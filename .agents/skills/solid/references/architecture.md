# Software Architecture

## The Goal of Architecture

Enable the development team to:
1. **Add** features with minimal friction
2. **Change** existing features safely
3. **Remove** features cleanly
4. **Test** features in isolation
5. **Deploy** independently when possible

## Architectural Principles

### 1. Vertical Boundaries (Features/Slices)

Organize by **feature**, not by technical layer.

```
BAD: Layer-first
src/
  controllers/
    UserController.ts
    OrderController.ts
  services/
    UserService.ts
    OrderService.ts
  repositories/
    UserRepository.ts
    OrderRepository.ts

GOOD: Feature-first
src/
  users/
    UserController.ts
    UserService.ts
    UserRepository.ts
  orders/
    OrderController.ts
    OrderService.ts
    OrderRepository.ts
```

**Why:** Changes to "users" feature stay in `users/`. High cohesion within features.

### 2. Horizontal Boundaries (Layers)

Separate concerns into layers with clear dependencies.

```
┌──────────────────────────────────────┐
│           Presentation               │  UI, Controllers, CLI
├──────────────────────────────────────┤
│           Application                │  Use Cases, Orchestration
├──────────────────────────────────────┤
│             Domain                   │  Business Logic, Entities
├──────────────────────────────────────┤
│          Infrastructure              │  Database, APIs, External
└──────────────────────────────────────┘
```

### 3. The Dependency Rule

**Dependencies point INWARD.**

```
Infrastructure → Application → Domain
      ↓               ↓            ↓
   (outer)        (middle)      (inner)
```

- Inner layers know NOTHING about outer layers
- Domain has zero dependencies on infrastructure
- Use interfaces to invert dependencies

```typescript
// Domain defines the interface (inner)
interface UserRepository {
  save(user: User): Promise<void>;
  findById(id: UserId): Promise<User | null>;
}

// Infrastructure implements it (outer)
class PostgresUserRepository implements UserRepository {
  save(user: User): Promise<void> {
    // SQL here
  }
}

// Domain service uses the interface
class UserService {
  constructor(private repo: UserRepository) {} // Depends on abstraction
}
```

### 4. Contracts

Interfaces define boundaries between components.

```typescript
// The contract
interface PaymentGateway {
  charge(amount: Money, card: CardDetails): Promise<ChargeResult>;
  refund(chargeId: string): Promise<RefundResult>;
}

// Multiple implementations possible
class StripeGateway implements PaymentGateway { }
class PayPalGateway implements PaymentGateway { }
class MockGateway implements PaymentGateway { }  // For tests
```

### 5. Cross-Cutting Concerns

Concerns that span multiple features: logging, auth, validation, error handling.

**Options:**
- Middleware/interceptors
- Decorators
- Aspect-oriented approaches
- Base classes (use sparingly)

```typescript
// Middleware approach
class LoggingMiddleware {
  handle(request: Request, next: Handler): Response {
    console.log(`Request: ${request.path}`);
    const response = next(request);
    console.log(`Response: ${response.status}`);
    return response;
  }
}
```

### 6. Conway's Law

> "Organizations design systems that mirror their communication structure."

**Implication:** Team structure affects architecture. Align both intentionally.

---

## Common Architectural Styles

### Layered Architecture

Traditional layers: Presentation → Business → Persistence

**Pros:** Simple, well-understood
**Cons:** Can become a "big ball of mud" without discipline

### Hexagonal Architecture (Ports & Adapters)

Domain at center, adapters around the edges.

```
        ┌─────────────────────┐
        │     HTTP Adapter    │
        └─────────┬───────────┘
                  │
┌─────────────────▼─────────────────┐
│              DOMAIN                │
│   ┌─────────────────────────┐     │
│   │      Business Logic      │     │
│   │      Use Cases           │     │
│   └─────────────────────────┘     │
└─────────────────┬─────────────────┘
                  │
        ┌─────────▼───────────┐
        │   Database Adapter   │
        └─────────────────────┘
```

**Ports:** Interfaces defined by the domain
**Adapters:** Implementations that connect to the outside world

### Clean Architecture

Similar to Hexagonal, with explicit layers:

1. **Entities** - Enterprise business rules
2. **Use Cases** - Application business rules
3. **Interface Adapters** - Controllers, Presenters, Gateways
4. **Frameworks & Drivers** - Web, DB, External interfaces

---

## Feature-Driven Structure (Frontend)

```
src/
  features/
    auth/
      components/
        LoginForm.tsx
        SignupForm.tsx
      hooks/
        useAuth.ts
      services/
        authService.ts
      types/
        auth.types.ts
      index.ts  # Public API
    checkout/
      components/
      hooks/
      services/
      types/
      index.ts
  shared/
    components/  # Truly shared UI
    hooks/       # Truly shared hooks
    utils/       # Truly shared utilities
```

---

## Feature-Driven Structure (Backend)

```
src/
  modules/
    users/
      domain/
        User.ts
        UserRepository.ts  # Interface
      application/
        CreateUser.ts      # Use case
        GetUser.ts         # Use case
      infrastructure/
        PostgresUserRepo.ts
      presentation/
        UserController.ts
        UserDTO.ts
    orders/
      domain/
      application/
      infrastructure/
      presentation/
  shared/
    domain/        # Shared value objects
    infrastructure/ # Shared infra utilities
```

---

## The Walking Skeleton

Start with a minimal end-to-end slice:

1. **Thinnest possible feature** that touches all layers
2. **Deployable** from day one
3. **Proves the architecture** works

Example walking skeleton for e-commerce:
- User can view ONE product (hardcoded)
- User can add it to cart
- User can "checkout" (just logs)

From there, flesh out each feature fully.

---

## Testing Architecture

```
┌────────────────────────────────────────────┐
│            E2E / Acceptance Tests          │  Few, slow, high confidence
├────────────────────────────────────────────┤
│            Integration Tests               │  Some, medium speed
├────────────────────────────────────────────┤
│              Unit Tests                    │  Many, fast, isolated
└────────────────────────────────────────────┘
```

**Test by layer:**
- **Domain:** Unit tests (most tests here)
- **Application:** Integration tests with mocked infra
- **Infrastructure:** Integration tests with real dependencies
- **E2E:** Critical paths only

---

## Architecture Decision Records (ADRs)

Document significant decisions:

```markdown
# ADR 001: Use PostgreSQL for persistence

## Status
Accepted

## Context
We need a database. Options: PostgreSQL, MongoDB, MySQL

## Decision
PostgreSQL for:
- ACID compliance
- Team familiarity
- JSON support for flexibility

## Consequences
- Need PostgreSQL expertise
- Schema migrations required
- Excellent query capabilities
```

---

## Red Flags in Architecture

- **Circular dependencies** between modules
- **Domain depending on infrastructure**
- **Framework code in business logic**
- **No clear boundaries** between features
- **Shared mutable state** across modules
- **"Util" or "Common" packages** that grow forever
- **Database schema driving domain model**
