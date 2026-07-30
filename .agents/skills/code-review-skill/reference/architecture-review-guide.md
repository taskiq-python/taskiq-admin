# Architecture Review Guide

Architecture design review guide to help evaluate whether code architecture is sound and design is appropriate.

## SOLID Principles Checklist

### S - Single Responsibility Principle (SRP)

**Key checks:**

- Does this class/module have only one reason to change?
- Do all methods in the class serve the same purpose?
- If you had to describe this class to a non-technical person, could you do it in one sentence?

**Identification signals in code review:**

```
⚠️ Class name contains "And", "Manager", "Handler", "Processor" or other generic words
⚠️ A class exceeds 200-300 lines of code
⚠️ Class has more than 5-7 public methods
⚠️ Different methods operate on completely different data
```

**Review questions:**

- "What responsibilities does this class have? Can it be split?"
- "If requirement X changes, which methods need to change? What about Y?"

### O - Open/Closed Principle (OCP)

**Key checks:**

- Does adding new features require modifying existing code?
- Can new behavior be added through extension (inheritance, composition)?
- Are there large if/else or switch statements for handling different types?

**Identification signals in code review:**

```
⚠️ switch/if-else chains handling different types
⚠️ Adding new features requires modifying core classes
⚠️ Type checks (instanceof, typeof) scattered throughout code
```

**Review questions:**

- "To add a new type X, which files need to be modified?"
- "Will this switch statement grow as new types are added?"

### L - Liskov Substitution Principle (LSP)

**Key checks:**

- Can subclasses fully replace parent classes?
- Do subclasses change the expected behavior of parent class methods?
- Do subclasses throw exceptions not declared by the parent class?

**Identification signals in code review:**

```
⚠️ Explicit type casting
⚠️ Subclass methods throw NotImplementedException
⚠️ Subclass methods are empty or only return
⚠️ Code using base class needs to check specific types
```

**Review questions:**

- "If a subclass replaces the parent class, does the caller code need to change?"
- "Does this method's behavior in the subclass conform to the parent class contract?"

### I - Interface Segregation Principle (ISP)

**Key checks:**

- Are interfaces small and focused enough?
- Are implementing classes forced to implement methods they don't need?
- Do clients depend on methods they don't use?

**Identification signals in code review:**

```
⚠️ Interface has more than 5-7 methods
⚠️ Implementing classes have empty methods or throw NotImplementedException
⚠️ Interface names are too generic (IManager, IService)
⚠️ Different clients only use parts of the interface
```

**Review questions:**

- "Are all methods of this interface used by every implementing class?"
- "Can this large interface be split into smaller, specialized interfaces?"

### D - Dependency Inversion Principle (DIP)

**Key checks:**

- Do high-level modules depend on abstractions rather than concrete implementations?
- Is dependency injection used instead of direct `new` object creation?
- Are abstractions defined by high-level modules rather than low-level modules?

**Identification signals in code review:**

```
⚠️ High-level modules directly `new` low-level module concrete classes
⚠️ Importing concrete implementation classes instead of interfaces/abstract classes
⚠️ Configuration and connection strings hardcoded in business logic
⚠️ Hard to write unit tests for a class
```

**Review questions:**

- "Can this class's dependencies be mocked in tests?"
- "If you need to switch the database/API implementation, how many places need changes?"

---

## Architecture Anti-Pattern Identification

### Fatal Anti-Patterns

| Anti-Pattern        | Identification Signal                                                          | Impact                                |
| ------------------- | ------------------------------------------------------------------------------ | ------------------------------------- |
| **Big Ball of Mud** | No clear module boundaries, any code can call any other code                   | Hard to understand, modify, and test  |
| **God Object**      | Single class takes on too many responsibilities, knows too much, does too much | High coupling, hard to reuse and test |
| **Spaghetti Code**  | Chaotic control flow, goto or deep nesting, hard to trace execution path       | Hard to understand and maintain       |
| **Lava Flow**       | Old code nobody dares to touch, lacks documentation and tests                  | Technical debt accumulation           |

### Design Anti-Patterns

| Anti-Pattern                       | Identification Signal                                                  | Suggestion                                        |
| ---------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------- |
| **Golden Hammer**                  | Using the same technology/pattern for all problems                     | Choose appropriate solutions based on the problem |
| **Gas Factory (Over-engineering)** | Simple problems solved with complex solutions, abusing design patterns | YAGNI principle, simple first then complex        |
| **Boat Anchor**                    | Unused code written for "might need it in the future"                  | Delete unused code, write it when needed          |
| **Copy-Paste Programming**         | Same logic appears in multiple places                                  | Extract common methods or modules                 |

### Review Questions

```markdown
🔴 [blocking] "This class has 2000 lines of code, consider splitting into multiple focused classes"
🟡 [important] "This logic is duplicated in 3 places, consider extracting a common method?"
💡 [suggestion] "This switch statement could be replaced with the strategy pattern for easier extension"
```

---

## Coupling and Cohesion Assessment

### Coupling Types (from good to bad)

| Type                    | Description                                    | Example                                                  |
| ----------------------- | ---------------------------------------------- | -------------------------------------------------------- |
| **Message Coupling** ✅ | Pass data through parameters                   | `calculate(price, quantity)`                             |
| **Data Coupling** ✅    | Share simple data structures                   | `processOrder(orderDTO)`                                 |
| **Stamp Coupling** ⚠️   | Share complex data structure but use only part | Pass entire User object but only use name                |
| **Control Coupling** ⚠️ | Pass control flags affecting behavior          | `process(data, isAdmin=true)`                            |
| **Common Coupling** ❌  | Share global variables                         | Multiple modules read/write the same global state        |
| **Content Coupling** ❌ | Directly access another module's internals     | Directly manipulating another class's private attributes |

### Cohesion Types (from good to bad)

| Type                         | Description                                  | Quality       |
| ---------------------------- | -------------------------------------------- | ------------- |
| **Functional Cohesion**      | All elements perform a single task           | ✅ Best       |
| **Sequential Cohesion**      | Output serves as input for next step         | ✅ Good       |
| **Communicational Cohesion** | Operate on same data                         | ⚠️ Acceptable |
| **Temporal Cohesion**        | Tasks executed at the same time              | ⚠️ Poor       |
| **Logical Cohesion**         | Logically related but functionally different | ❌ Bad        |
| **Coincidental Cohesion**    | No obvious relationship                      | ❌ Worst      |

### Metric Reference

```yaml
Coupling Metrics:
  CBO (Coupling Between Objects):
    Good: < 5
    Warning: 5-10
    Dangerous: > 10

  Ce (Efferent Coupling):
    Description: How many external classes it depends on
    Good: < 7

  Ca (Afferent Coupling):
    Description: How many classes depend on it
    High value means: Changes have wide impact, needs to be stable

Cohesion Metrics:
  LCOM4 (Lack of Cohesion in Methods):
    1: Single responsibility ✅
    2-3: May need splitting ⚠️
    >3: Should be split ❌
```

### Review Questions

- "How many other modules does this module depend on? Can it be reduced?"
- "How many other places are affected by modifying this class?"
- "Do all methods of this class operate on the same data?"

---

## Layered Architecture Review

### Clean Architecture Layer Check

```
┌─────────────────────────────────────┐
│         Frameworks & Drivers        │ ← Outermost: Web, DB, UI
├─────────────────────────────────────┤
│         Interface Adapters          │ ← Controllers, Gateways, Presenters
├─────────────────────────────────────┤
│          Application Layer          │ ← Use Cases, Application Services
├─────────────────────────────────────┤
│            Domain Layer             │ ← Entities, Domain Services
└─────────────────────────────────────┘
          ↑ Dependencies can only point inward ↑
```

### Dependency Rule Check

**Core rule: Source code dependencies can only point inward**

```typescript
// ❌ Violates dependency rule: Domain layer depends on Infrastructure
// domain/User.ts
import { MySQLConnection } from '../infrastructure/database'

// ✅ Correct: Domain layer defines interface, Infrastructure implements
// domain/UserRepository.ts (interface)
interface UserRepository {
  findById(id: string): Promise<User>
}

// infrastructure/MySQLUserRepository.ts (implementation)
class MySQLUserRepository implements UserRepository {
  findById(id: string): Promise<User> {
    /* ... */
  }
}
```

### Review Checklist

**Layer boundary checks:**

- [ ] Does the Domain layer have external dependencies (database, HTTP, file system)?
- [ ] Does the Application layer directly operate the database or call external APIs?
- [ ] Does the Controller contain business logic?
- [ ] Are there cross-layer calls (UI directly calling Repository)?

**Separation of concerns checks:**

- [ ] Is business logic separated from presentation logic?
- [ ] Is data access encapsulated in a dedicated layer?
- [ ] Are configuration and environment-related code centrally managed?

### Review Questions

```markdown
🔴 [blocking] "Domain entity directly imports database connection, violating dependency rule"
🟡 [important] "Controller contains business calculation logic, suggest moving to Service layer"
💡 [suggestion] "Consider using dependency injection to decouple these components"
```

---

## Design Pattern Usage Evaluation

### When to Use Design Patterns

| Pattern       | Suitable Scenario                                                        | Unsuitable Scenario                                       |
| ------------- | ------------------------------------------------------------------------ | --------------------------------------------------------- |
| **Factory**   | Need to create different types of objects, type determined at runtime    | Only one type, or type is fixed                           |
| **Strategy**  | Algorithm needs to switch at runtime, multiple interchangeable behaviors | Only one algorithm, or algorithm won't change             |
| **Observer**  | One-to-many dependency, state changes need to notify multiple objects    | Simple direct calls suffice                               |
| **Singleton** | Genuinely need a globally unique instance, like config management        | Objects that can be passed via dependency injection       |
| **Decorator** | Need to dynamically add responsibilities, avoid inheritance explosion    | Responsibilities are fixed, no dynamic composition needed |

### Over-engineering Warning Signs

```
⚠️ Patternitis identification signals:

1. Simple if/else replaced with strategy pattern + factory + registry
2. Interface with only one implementation
3. Abstraction layers added for "might need it in the future"
4. Code line count increases significantly due to pattern application
5. Newcomers need a long time to understand the code structure
```

### Review Principles

```markdown
✅ Correct pattern usage:

- Solves a real extensibility problem
- Code is easier to understand and test
- Adding new features becomes simpler

❌ Overuse of patterns:

- Using patterns for the sake of using patterns
- Adds unnecessary complexity
- Violates YAGNI principle
```

### Review Questions

- "What specific problem does using this pattern solve?"
- "What problems would the code have without this pattern?"
- "Is the value of this abstraction layer greater than its complexity?"

---

## Scalability Assessment

### Scalability Checklist

**Functional scalability:**

- [ ] Does adding new features require modifying core code?
- [ ] Are extension points provided (hooks, plugins, events)?
- [ ] Is configuration externalized (config files, environment variables)?

**Data scalability:**

- [ ] Does the data model support adding new fields?
- [ ] Are data volume growth scenarios considered?
- [ ] Do queries have appropriate indexes?

**Load scalability:**

- [ ] Can it scale horizontally (add more instances)?
- [ ] Are there state dependencies (session, local cache)?
- [ ] Are database connections using a connection pool?

### Extension Point Design Check

```typescript
// ✅ Good extension design: using events/hooks
class OrderService {
  private hooks: OrderHooks

  async createOrder(order: Order) {
    await this.hooks.beforeCreate?.(order)
    const result = await this.save(order)
    await this.hooks.afterCreate?.(result)
    return result
  }
}

// ❌ Poor extension design: hardcoding all behavior
class OrderService {
  async createOrder(order: Order) {
    await this.sendEmail(order) // hardcoded
    await this.updateInventory(order) // hardcoded
    await this.notifyWarehouse(order) // hardcoded
    return await this.save(order)
  }
}
```

### Review Questions

```markdown
💡 [suggestion] "If new payment methods need to be supported in the future, is this design easy to extend?"
🟡 [important] "This logic is hardcoded, consider using configuration or strategy pattern?"
📚 [learning] "Event-driven architecture can make this feature easier to extend"
```

---

## Code Structure Best Practices

### Directory Organization

**Organize by feature/domain (recommended):**

```
src/
├── user/
│   ├── User.ts           (entity)
│   ├── UserService.ts    (service)
│   ├── UserRepository.ts (data access)
│   └── UserController.ts (API)
├── order/
│   ├── Order.ts
│   ├── OrderService.ts
│   └── ...
└── shared/
    ├── utils/
    └── types/
```

**Organize by technical layer (not recommended):**

```
src/
├── controllers/     ← Different domains mixed together
│   ├── UserController.ts
│   └── OrderController.ts
├── services/
├── repositories/
└── models/
```

### Naming Convention Check

| Type               | Convention                | Example                          |
| ------------------ | ------------------------- | -------------------------------- |
| Class name         | PascalCase, noun          | `UserService`, `OrderRepository` |
| Method name        | camelCase, verb           | `createUser`, `findOrderById`    |
| Interface name     | I prefix or no prefix     | `IUserService` or `UserService`  |
| Constants          | UPPER_SNAKE_CASE          | `MAX_RETRY_COUNT`                |
| Private attributes | Underscore prefix or none | `_cache` or `#cache`             |

### File Size Guidelines

```yaml
Recommended limits:
  Single file: < 300 lines
  Single function: < 50 lines
  Single class: < 200 lines
  Function parameters: < 4
  Nesting depth: < 4 levels

When exceeding limits:
  - Consider splitting into smaller units
  - Use composition over inheritance
  - Extract helper functions or classes
```

### Review Questions

```markdown
🟢 [nit] "This 500-line file could be split by responsibility"
🟡 [important] "Recommend organizing directory structure by feature domain rather than technical layer"
💡 [suggestion] "Function name `process` is not clear enough, consider `calculateOrderTotal`?"
```

---

## Quick Reference Checklist

### 5-Minute Architecture Review

```markdown
□ Are dependency directions correct? (outer depends on inner)
□ Are there circular dependencies?
□ Is core business logic decoupled from framework/UI/database?
□ Are SOLID principles followed?
□ Are there obvious anti-patterns?
```

### Red Flags (Must Address)

```markdown
🔴 God Object - single class exceeds 1000 lines
🔴 Circular dependency - A → B → C → A
🔴 Domain layer contains framework dependencies
🔴 Hardcoded configuration and secrets
🔴 External service calls without interfaces
```

### Yellow Flags (Should Address)

```markdown
🟡 Coupling Between Objects (CBO) > 10
🟡 Method parameters exceed 5
🟡 Nesting depth exceeds 4 levels
🟡 Duplicate code blocks > 10 lines
🟡 Interface with only one implementation
```

---

## Tool Recommendations

| Tool          | Purpose                                 | Language Support      |
| ------------- | --------------------------------------- | --------------------- |
| **SonarQube** | Code quality, coupling analysis         | Multi-language        |
| **NDepend**   | Dependency analysis, architecture rules | .NET                  |
| **JDepend**   | Package dependency analysis             | Java                  |
| **Madge**     | Module dependency graph                 | JavaScript/TypeScript |
| **ESLint**    | Code standards, complexity checks       | JavaScript/TypeScript |
| **CodeScene** | Technical debt, hotspot analysis        | Multi-language        |

---

## Reference Resources

- [Clean Architecture - Uncle Bob](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [SOLID Principles in Code Review - JetBrains](https://blog.jetbrains.com/upsource/2015/08/31/what-to-look-for-in-a-code-review-solid-principles-2/)
- [Software Architecture Anti-Patterns](https://medium.com/@christophnissle/anti-patterns-in-software-architecture-3c8970c9c4f5)
- [Coupling and Cohesion in System Design](https://www.geeksforgeeks.org/system-design/coupling-and-cohesion-in-system-design/)
- [Design Patterns - Refactoring Guru](https://refactoring.guru/design-patterns)
