# Managing Complexity

## The Two Types of Complexity

### Essential Complexity
Inherent to the problem domain. Cannot be removed, only managed.
- Business rules
- Domain logic
- User requirements

### Accidental Complexity
Introduced by our solutions. CAN and SHOULD be minimized.
- Poor abstractions
- Unnecessary indirection
- Framework ceremony
- Technical debt

**Goal: Minimize accidental complexity while clearly expressing essential complexity.**

---

## Detecting Complexity

### 1. Change Amplification
Small changes require touching many files.

**Symptom:** "To add this field, I need to update 15 files."

**Cause:** Scattered responsibilities, poor abstraction boundaries.

### 2. Cognitive Load
Code is hard to understand, requires holding too much in memory.

**Symptom:** "I need to understand 10 other classes to understand this one."

**Cause:** Tight coupling, hidden dependencies, unclear naming.

### 3. Unknown Unknowns
Behavior is surprising, side effects are hidden.

**Symptom:** "I changed this, and something completely unrelated broke."

**Cause:** Global state, hidden dependencies, implicit contracts.

---

## The XP Values for Fighting Complexity

From Extreme Programming:

### 1. Communication
Code should communicate clearly. Names, structure, tests all contribute.

### 2. Simplicity
Do the simplest thing that could possibly work.

### 3. Feedback
Fast feedback loops catch complexity early. TDD, CI, code review.

### 4. Courage
Refactor aggressively. Don't let complexity accumulate.

### 5. Respect
Respect future readers (including yourself). Write for humans first.

---

## KISS - Keep It Simple, Silly

> "The simplest solution that works is usually the best."

### How to Apply:
1. Start with the obvious solution
2. Only add complexity when REQUIRED
3. Prefer boring, well-understood approaches
4. Question every abstraction

```typescript
// Over-engineered
class UserServiceFactoryProvider {
  private static instance: UserServiceFactoryProvider;

  static getInstance(): UserServiceFactoryProvider { ... }
  createFactory(): UserServiceFactory { ... }
}

// KISS
class UserService {
  getUser(id: string): User { ... }
}
```

---

## YAGNI - You Aren't Gonna Need It

> "Don't build features until they're actually needed."

### Warning Signs:
- "We might need this later"
- "It would be nice to have"
- "Just in case"
- "For future extensibility"

### The Cost of YAGNI Violations:
1. **Development time** - Building unused features
2. **Maintenance burden** - Code that must be maintained
3. **Cognitive load** - More to understand
4. **Wrong abstraction** - Guessing future needs incorrectly

```typescript
// YAGNI violation: Building for hypothetical needs
class User {
  // "We might need these someday"
  middleName?: string;
  secondaryEmail?: string;
  faxNumber?: string;
  linkedinProfile?: string;
  twitterHandle?: string;
}

// YAGNI: Only what's needed NOW
class User {
  name: string;
  email: Email;
}
```

---

## DRY - Don't Repeat Yourself (with The Rule of Three)

> "Every piece of knowledge should have a single, unambiguous representation."

### BUT: The Rule of Three

**Don't extract duplication until you see it THREE times.**

Why? The wrong abstraction is worse than duplication.

```
Duplication #1 → Leave it
Duplication #2 → Note it, leave it
Duplication #3 → NOW extract it
```

### Example:
```typescript
// First time - leave it
function processUserOrder(order) {
  validate(order);
  calculateTax(order);
  save(order);
}

// Second time - note the similarity, but leave it
function processGuestOrder(order) {
  validate(order);
  calculateTax(order);
  save(order);
  sendGuestEmail(order);
}

// Third time - NOW extract
function processCorporateOrder(order) {
  validate(order);
  calculateTax(order);
  save(order);
  applyCorporateDiscount(order);
}

// After three, extract the common parts
function processOrder(order: Order, postProcessing: (o: Order) => void) {
  validate(order);
  calculateTax(order);
  save(order);
  postProcessing(order);
}
```

---

## Separation of Concerns

> "Each module should address a single concern."

### Concerns to Separate:
- **Business logic** vs **Infrastructure**
- **What** (policy) vs **How** (mechanism)
- **Input** vs **Processing** vs **Output**
- **Data** vs **Behavior**

### Example:
```typescript
// BAD: Mixed concerns
class OrderProcessor {
  process(order: Order) {
    // Validation
    if (!order.items.length) throw new Error('Empty');

    // Business logic
    let total = 0;
    for (const item of order.items) {
      total += item.price * item.quantity;
    }

    // Persistence
    const db = new Database();
    db.query(`INSERT INTO orders...`);

    // Notification
    const email = new EmailClient();
    email.send(order.customer.email, 'Order confirmed');
  }
}

// GOOD: Separated concerns
class OrderProcessor {
  constructor(
    private validator: OrderValidator,
    private calculator: OrderCalculator,
    private repository: OrderRepository,
    private notifier: OrderNotifier
  ) {}

  process(order: Order): ProcessResult {
    this.validator.validate(order);
    const total = this.calculator.calculateTotal(order);
    const savedOrder = this.repository.save(order);
    this.notifier.notifyConfirmation(savedOrder);
    return ProcessResult.success(savedOrder);
  }
}
```

---

## Managing Technical Debt

### Types of Technical Debt:
1. **Deliberate** - Conscious trade-off for speed
2. **Accidental** - Mistakes, lack of knowledge
3. **Bit rot** - Code degrades over time

### The Boy Scout Rule:
> "Leave the code better than you found it."

Every time you touch code:
- Improve one small thing
- Fix one naming issue
- Extract one method
- Add one missing test

### When to Pay Down Debt:
- When it's in your path (you're already there)
- When it's blocking new features
- When it's causing bugs
- During dedicated refactoring time

### When NOT to Refactor:
- Code that works and won't change
- Code being replaced soon
- When you don't have tests

---

## The Four Elements of Simple Design

In priority order (from XP):

1. **Runs all the tests**
   - If it doesn't work, nothing else matters

2. **Expresses intent**
   - Clear names, obvious structure
   - Code tells the story

3. **No duplication**
   - DRY (but Rule of Three)
   - Single source of truth

4. **Minimal**
   - Fewest classes and methods possible
   - Remove anything unnecessary

If these four are true, the design is simple enough.
