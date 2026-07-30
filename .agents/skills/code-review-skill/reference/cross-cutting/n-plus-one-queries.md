# N+1 Query Problem — Cross-Language Guide

> The N+1 query is the most common performance anti-pattern in ORMs and database access layers. This document covers problem definition, detection methods, general solutions, and cross-language code examples.

## Table of Contents

- [Problem Definition](#problem-definition)
- [Performance Impact](#performance-impact)
- [Detection Methods](#detection-methods)
- [General Solutions](#general-solutions)
- [Language-Specific Implementations](#language-specific-implementations)
- [Review Checklist](#review-checklist)

---

## Problem Definition

The N+1 query refers to: **1 query fetches N records, then N additional queries are triggered in a loop** to fetch related data.

```
Request flow:
  1 query   → Fetch N main records
  N queries → Query related data once per main record
  ─────────
  Total: 1 + N queries
```

### Impact

| Problem                           | Effect                                                                                                             |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| **Linear growth in query count**  | 100 records = 101 SQL queries, 1000 records = 1001 queries                                                         |
| **Network latency accumulation**  | Each query has round-trip time (RTT), N round trips >> 1 batch query                                               |
| **Connection pool exhaustion**    | Large number of queries exhaust database connections, slowing down the entire application                          |
| **Hard to detect in development** | Dev environments have little data, N+1 is not obvious; performance collapses in production with large data volumes |

---

## Performance Impact

### Scenario Comparison: Fetching 100 Users and Their Orders

| Approach             | SQL Count   | Latency (assuming RTT=1ms) | Suitable Scenario                 |
| -------------------- | ----------- | -------------------------- | --------------------------------- |
| N+1 lazy loading     | 101 queries | ~101ms                     | Very small data volumes           |
| Eager loading (JOIN) | 1 query     | ~1ms                       | One-to-many, moderate data volume |
| Eager loading (IN)   | 2 queries   | ~2ms                       | Many-to-many, large datasets      |
| DataLoader / batch   | 2 queries   | ~2ms                       | GraphQL / complex graph queries   |

### SQL Count Comparison

```sql
-- ❌ N+1: 1 + 100 = 101 queries
SELECT * FROM users;                          -- 1 query
SELECT * FROM orders WHERE user_id = 1;       -- query 2
SELECT * FROM orders WHERE user_id = 2;       -- query 3
...
SELECT * FROM orders WHERE user_id = 100;     -- query 101

-- ✅ Batch: 2 queries
SELECT * FROM users;
SELECT * FROM orders WHERE user_id IN (1,2,...,100);
```

---

## Detection Methods

### 1. ORM SQL Logging

Enable SQL logging and observe query counts in test or development environments:

```python
# Django
import logging
logging.getLogger('django.db.backends').setLevel(logging.DEBUG)

# SQLAlchemy
import logging
logging.getLogger('sqlalchemy.engine').setLevel(logging.INFO)
```

```java
// Spring Boot application.yml
spring:
  jpa:
    show-sql: true
    properties:
      hibernate.format_sql: true
```

```csharp
// EF Core
optionsBuilder.LogTo(Console.WriteLine, LogLevel.Information);
```

### 2. Query Count Assertions

Assert SQL query counts in tests:

```python
# Django: django-assert-num-queries
from django.test.utils import CaptureQueriesContext
from django.db import connection

with CaptureQueriesContext(connection) as ctx:
    list(User.objects.select_related("profile").all())
assert len(ctx) <= 2  # expect at most 2 queries
```

```java
// Hibernate: p6spy or datasource-proxy
// Count SQL executions in tests
assertThat(sqlCount).isLessThanOrEqualTo(2);
```

### 3. APM / Database Monitoring Tools

- **Django Debug Toolbar** — Real-time SQL count and timing display
- **p6spy** (Java) — JDBC layer interception, logs all SQL
- **MiniProfiler** (.NET) — In-page SQL statistics
- **DataDog / New Relic** — Production slow query alerts

---

## General Solutions

### Solution 1: Eager Loading (JOIN Preload)

A single JOIN query fetches both main and related records. Suitable for one-to-one, one-to-many.

### Solution 2: Batch Fetching (IN Clause Batch Query)

Two queries: main records + `WHERE id IN (...)` to batch fetch related records. Suitable for many-to-many, large datasets.

### Solution 3: DataLoader Pattern

In GraphQL or complex graph query scenarios, collect all needed IDs and merge them into a single batch query.

```
// DataLoader pseudocode
class DataLoader<K, V> {
    load(K key) → V         // Register demand, don't query immediately
    loadAll([K]) → [V]      // Merge into a single batch query
}
```

### Solution 4: Projection

Query only the needed fields to reduce data transfer:

```sql
-- ❌ Fetch all columns
SELECT * FROM users JOIN profiles ON ...

-- ✅ Project only needed fields
SELECT u.name, p.avatar_url FROM users u JOIN profiles p ON ...
```

---

## Language-Specific Implementations

### Python / Django

> See [Django Guide](../django.md#n1-query-optimization)

```python
# ForeignKey / OneToOne → select_related (SQL JOIN)
books = Book.objects.select_related("publisher")

# M2M / reverse FK → prefetch_related (2 queries + Python merge)
authors = Author.objects.prefetch_related("books")

# Nested prefetch
authors = Author.objects.prefetch_related("books__publisher")

# Prefetch object for fine-grained control
from django.db.models import Prefetch
authors = Author.objects.prefetch_related(
    Prefetch("books", queryset=Book.objects.filter(published=True), to_attr="published_books")
)
```

### Python / SQLAlchemy (FastAPI)

> See [FastAPI Guide](../fastapi.md#database-sessions--n1)

```python
from sqlalchemy.orm import selectinload

# selectinload: IN clause batch loading (recommended for async scenarios)
stmt = select(Order).options(selectinload(Order.customer))

# joinedload: JOIN loading
stmt = select(Order).options(joinedload(Order.customer))
```

### Java / JPA (Spring Boot)

> See [Java Guide](../java.md)

```java
// ❌ FetchType.EAGER or triggering lazy loading in a loop
@OneToMany(fetch = FetchType.EAGER)  // dangerous!

// ✅ JOIN FETCH
@Query("SELECT u FROM User u JOIN FETCH u.orders")
List<User> findAllWithOrders();

// ✅ @EntityGraph (declarative)
@EntityGraph(attributePaths = {"orders", "profile"})
List<User> findAll();

// ✅ @BatchSize (reduces N+1 to N/batchSize + 1)
@OneToMany
@BatchSize(size = 50)
private List<Order> orders;
```

### C# / EF Core

> See [C# Guide](../csharp.md)

```csharp
// ❌ N+1: foreach triggers lazy loading
foreach (var blog in await context.Blogs.ToListAsync())
    foreach (var post in blog.Posts)  // queries on every iteration!

// ✅ Include + ThenInclude
var blogs = await context.Blogs
    .Include(b => b.Posts)
    .ToListAsync();

// ✅ Projection (safest, avoids over-fetching)
var data = await context.Blogs
    .Select(b => new { b.Url, PostTitles = b.Posts.Select(p => p.Title) })
    .ToListAsync();
```

### PHP / Laravel / Doctrine

> See [PHP Guide](../php.md)

```php
// ❌ Querying inside a loop
foreach ($orders as $order) {
    $customer = $customerRepo->find($order->customerId);
    render($order, $customer);
}

// ✅ Batch preloading
$customerIds = array_unique(array_map(fn($o) => $o->customerId, $orders));
$customers = $customerRepo->findByIds($customerIds);

foreach ($orders as $order) {
    render($order, $customers[$order->customerId] ?? null);
}

// Laravel Eloquent: with()
$orders = Order::with('customer')->get();

// Doctrine: JOIN FETCH
$dql = 'SELECT o, c FROM Order o JOIN o.customer c';
```

### TypeScript / Prisma

```typescript
// ❌ N+1
const users = await prisma.user.findMany()
for (const user of users) {
  user.posts = await prisma.post.findMany({ where: { userId: user.id } })
}

// ✅ include (Prisma auto-generates JOIN or batch query)
const users = await prisma.user.findMany({
  include: { posts: true },
})

// ✅ Nested include
const users = await prisma.user.findMany({
  include: {
    posts: {
      include: { comments: true },
    },
  },
})
```

---

## Review Checklist

### Detection

- [ ] SQL logging or query count monitoring enabled
- [ ] Query count assertions in tests
- [ ] APM tool configured with N+1 alerts

### Fixes

- [ ] ForeignKey / OneToOne relationships use JOIN eager loading
- [ ] M2M / reverse relationships use IN batch preloading
- [ ] Avoid triggering database queries in loops
- [ ] Use projection to fetch only needed fields

### Architecture

- [ ] List APIs are paginated to avoid loading too many records at once
- [ ] GraphQL scenarios use DataLoader
- [ ] Caching strategy (Redis) for high-frequency related data reads
