# Universal Code Quality Anti-Patterns

> Language-agnostic code quality anti-pattern guide, covering code reuse, abstraction leaks, parameter bloat, nested conditionals, stringly typing, TOCTOU, no-op updates, and other core topics. Applicable to PR reviews across all languages.

## Table of Contents

- [Code Reuse Review](#code-reuse-review)
- [Parameter Bloat](#parameter-bloat)
- [Abstraction Leaks](#abstraction-leaks)
- [Stringly Typing](#stringly-typing)
- [Nested Conditional Expressions](#nested-conditional-expressions)
- [Copy-Paste Variants](#copy-paste-variants)
- [No-Op Updates](#no-op-updates)
- [TOCTOU Race Conditions](#toctou-race-conditions)
- [Overly Broad Operations](#overly-broad-operations)
- [Redundant State](#redundant-state)
- [Universal Quality Checklist](#universal-quality-checklist)

---

## Code Reuse Review

Before accepting new code, search the existing codebase for reusable utilities.

### Search for Existing Utility Functions

```python
# ❌ Newly written path joining logic — project already has PathBuilder
def get_config_path(name):
    base = os.environ.get("APP_ROOT", ".")
    return os.path.join(base, "config", name + ".json")

# ✅ Use existing PathBuilder
def get_config_path(name):
    return PathBuilder.config(f"{name}.json")
```

```javascript
// ❌ Hand-written debounce — project already has lodash or utils/debounce.ts
function debounce(fn, ms) {
  let timer
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), ms)
  }
}

// ✅ Use existing utility function
import { debounce } from '@/utils/debounce'
```

**Review points:**

- Does the new function overlap in name or functionality with existing utilities?
- Can inline logic be extracted as a call to an existing module?
- Check adjacent files and shared/utils directories

---

## Parameter Bloat

### Growing Function Parameters

```python
# ❌ Adding a parameter for every new requirement
def create_user(name, email, role, team, active, avatar_url, timezone):
    ...

# ✅ Use config object / dataclass
@dataclass
class CreateUserParams:
    name: str
    email: str
    role: Role = Role.MEMBER
    team: str | None = None
    active: bool = True
    avatar_url: str | None = None
    timezone: str = "UTC"

def create_user(params: CreateUserParams) -> User:
    ...
```

```typescript
// ❌ 6+ positional parameters
function renderWidget(
  title: string, width: number, height: number,
  theme: string, collapsible: boolean, icon: string
) { ... }

// ✅ Options object pattern
interface WidgetOptions {
  title: string;
  width?: number;
  height?: number;
  theme?: "light" | "dark";
  collapsible?: boolean;
  icon?: string;
}
function renderWidget(options: WidgetOptions) { ... }
```

**Review points:**

- Does the function have ≥ 4 parameters? Consider options object / dataclass
- Is the new parameter just a boolean flag? Consider enum or strategy pattern
- Are there mutually exclusive parameters like `enable_x`, `disable_y`?

---

## Abstraction Leaks

### Exposing Internal Implementation Details

```python
# ❌ Returning internal ORM object — caller is forced to know SQLAlchemy
def get_users():
    return session.query(User).filter(User.active == True).all()

# ✅ Return domain object, hide persistence layer
def get_active_users() -> list[UserDTO]:
    rows = user_repo.find_active()
    return [UserDTO.from_row(r) for r in rows]
```

```typescript
// ❌ Component receives raw API response structure
<UserCard user={apiResponse.data.results[0]} />

// ✅ Component receives domain type, adapter handles mapping
interface UserSummary {
  displayName: string;
  avatarUrl: string;
}
<UserCard user={adaptUser(apiResponse)} />
```

**Review points:**

- Does the return type leak the underlying implementation (ORM, HTTP client, file format)?
- Do components/functions depend on external system data structures?
- Are existing abstraction boundaries being broken?

---

## Stringly Typing

### Using Raw Strings Instead of Constants/Enums

```python
# ❌ Magic strings scattered everywhere
if status == "active":
    ...
if role == "admin":
    ...

# ✅ Use enum
class Status(StrEnum):
    ACTIVE = "active"
    SUSPENDED = "suspended"
    ARCHIVED = "archived"

if user.status == Status.ACTIVE:
    ...
```

```typescript
// ❌ Raw string event names — typos won't be caught
emitter.emit('userCreated', data)
emitter.on('usercreated', handler) // bug: typo

// ✅ Constants or branded type
const Events = {
  USER_CREATED: 'userCreated',
  USER_SUSPENDED: 'userSuspended',
} as const
emitter.emit(Events.USER_CREATED, data)
```

**Review points:**

- Are strings used instead of existing enum/union types?
- Are event names, action types, status values scattered across multiple files?
- Is string comparison case-sensitive but unvalidated?

---

## Nested Conditional Expressions

### Ternary Chains and Nested if/else

```python
# ❌ Ternary chain is hard to read
label = (
    "Admin" if role == "admin" else
    "Manager" if role == "manager" else
    "Viewer" if role == "viewer" else
    "Unknown"
)

# ✅ Lookup table or match
ROLE_LABELS = {
    "admin": "Admin",
    "manager": "Manager",
    "viewer": "Viewer",
}
label = ROLE_LABELS.get(role, "Unknown")
```

```typescript
// ❌ Nested ternary
const bg = isHovered
  ? isSelected
    ? 'blue'
    : 'gray'
  : isSelected
    ? 'navy'
    : 'white'

// ✅ Lookup map
const bgMap: Record<string, string> = {
  'true-true': 'blue',
  'true-false': 'gray',
  'false-true': 'navy',
  'false-false': 'white',
}
const bg = bgMap[`${isHovered}-${isSelected}`]
```

```python
# ❌ Nested if 3+ levels
def process(order):
    if order is not None:
        if order.items:
            for item in order.items:
                if item.price > 0:
                    ...

# ✅ Early return + guard clauses
def process(order):
    if not order or not order.items:
        return
    for item in order.items:
        if item.price <= 0:
            continue
        ...
```

**Review points:**

- Are ternary expressions nested ≥ 2 levels?
- Is if/else nesting ≥ 3 levels?
- Can it be replaced with a lookup table, early return, or match?

---

## Copy-Paste Variants

### Near-Duplicate Code Blocks

```python
# ❌ Two functions nearly identical, only field names differ
def format_user(user):
    return f"{user.first_name} {user.last_name} ({user.email})"

def format_employee(emp):
    return f"{emp.first_name} {emp.last_name} ({emp.work_email})"

# ✅ Unified abstraction
def format_person(first: str, last: str, email: str) -> str:
    return f"{first} {last} ({email})"
```

```typescript
// ❌ Copy-paste handler only changed URL
async function deletePost(id: string) {
  await fetch(`/api/posts/${id}`, { method: 'DELETE' })
  router.push('/posts')
}
async function deleteComment(id: string) {
  await fetch(`/api/comments/${id}`, { method: 'DELETE' })
  router.push('/comments')
}

// ✅ Parameterized
async function deleteResource(resource: string, id: string) {
  await fetch(`/api/${resource}/${id}`, { method: 'DELETE' })
  router.push(`/${resource}`)
}
```

**Review points:**

- Are there ≥ 2 code blocks that differ only in variable names/URLs/strings?
- Can a parameterized shared function be extracted?
- Can template method or strategy eliminate the variants?

---

## No-Op Updates

### Unconditionally Triggering State Updates

```typescript
// ❌ Every poll triggers update — even when data hasn't changed
useEffect(() => {
  const interval = setInterval(() => {
    fetch('/api/status')
      .then((r) => r.json())
      .then(setStatus)
  }, 5000)
  return () => clearInterval(interval)
}, [])

// ✅ Only update when value changes
useEffect(() => {
  const interval = setInterval(() => {
    fetch('/api/status')
      .then((r) => r.json())
      .then((data) => {
        setStatus((prev) => (isEqual(prev, data) ? prev : data))
      })
  }, 5000)
  return () => clearInterval(interval)
}, [])
```

```python
# ❌ Writing to DB every loop — even when value hasn't changed
for item in items:
    item.status = compute_status(item)
    session.commit()

# ✅ Only write when changed
for item in items:
    new_status = compute_status(item)
    if item.status != new_status:
        item.status = new_status
        session.commit()
```

**Review points:**

- Does polling / interval / event handler update unconditionally?
- Does the wrapper function respect same-reference return?
- Does the DB write check for actual changes?

---

## TOCTOU Race Conditions

### Time-of-Check-to-Time-of-Use

```python
# ❌ Check then operate — file may be deleted/created in between
if os.path.exists(path):
    with open(path) as f:
        data = f.read()

# ✅ Operate directly + handle exception
try:
    with open(path) as f:
        data = f.read()
except FileNotFoundError:
    data = None
```

```python
# ❌ Check balance → deduct two-step operation is not atomic
if account.balance >= amount:
    account.balance -= amount

# ✅ Atomic operation or lock
with account.lock:
    if account.balance < amount:
        raise InsufficientFundsError()
    account.balance -= amount
```

```typescript
// ❌ Check-then-act is unsafe in async environments
if (!fileExists(path)) {
  await writeFile(path, content)
}

// ✅ Operate directly + catch
try {
  await writeFile(path, content, { flag: 'wx' })
} catch (e) {
  if (e.code === 'EEXIST') {
    /* handle */
  } else throw e
}
```

**Review points:**

- Can `if exists → operate` pattern be replaced with `try operate → catch`?
- Are multi-step state changes within a transaction/lock?
- Is there an `await` between check and act in async operations?

---

## Overly Broad Operations

### Reading Too Much Data

```python
# ❌ Read entire file to get first line
content = Path("log.txt").read_text()
first_line = content.split("\n")[0]

# ✅ Only read first line, don't load entire file
with open("log.txt") as f:
    first_line = f.readline()
```

```typescript
// ❌ Load all items then filter
const allItems = await db.query('SELECT * FROM orders')
const pending = allItems.filter((o) => o.status === 'pending')

// ✅ Filter at database level
const pending = await db.query('SELECT * FROM orders WHERE status = ?', [
  'pending',
])
```

```python
# ❌ Read entire list to find one record
users = list(User.objects.all())
user = next(u for u in users if u.id == user_id)

# ✅ Precise query
user = User.objects.get(id=user_id)
```

**Review points:**

- Is the entire collection/file read only to use a small subset?
- Can filtering be pushed to the database/storage layer?
- Does the API call support pagination/limit parameters?

---

## Redundant State

### State That Can Be Derived

```typescript
// ❌ Storing fullName alongside firstName + lastName
interface User {
  firstName: string
  lastName: string
  fullName: string // redundant
}

// ✅ fullName is a derived value
interface User {
  firstName: string
  lastName: string
}
const fullName = `${user.firstName} ${user.lastName}`
```

```python
# ❌ Cached value may be stale when source data changes
class Order:
    total: float
    item_count: int       # redundant if len(items) gives the same
    items: list[Item]

# ✅ Derive or use property
class Order:
    items: list[Item]

    @property
    def total(self) -> float:
        return sum(item.price for item in self.items)

    @property
    def item_count(self) -> int:
        return len(self.items)
```

**Review points:**

- Are there fields that can be derived from other fields?
- Do cached values have an invalidation mechanism?
- Can observer/effect be replaced with a direct call?

---

## Universal Quality Checklist

- [ ] **Reuse review**: Searched for existing utilities/helpers, no reinventing the wheel?
- [ ] **Parameter count**: Function parameters ≤ 3? Use options object / dataclass if more?
- [ ] **Abstraction boundaries**: Return types don't expose internal implementation details (ORM, HTTP client, file format)?
- [ ] **Type safety**: No magic strings instead of existing enum/constant/union type?
- [ ] **Conditional depth**: Ternary nesting ≤ 1 level? if/else nesting ≤ 2 levels?
- [ ] **DRY**: No copy-paste-with-variation (≥ 2 near-duplicate code blocks)?
- [ ] **No-op guard**: Polling / interval / event handler has change-detection guard?
- [ ] **TOCTOU**: `if exists → operate` replaced with `try operate → catch`?
- [ ] **Data precision**: Not reading entire collection/file just to get a subset?
- [ ] **Redundant state**: No stored fields that can be derived from other fields?
