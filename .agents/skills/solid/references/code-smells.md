# Code Smells & Anti-Patterns

## What Are Code Smells?

Indicators that something MAY be wrong. Not bugs, but design problems that make code hard to understand, change, or test.

## The Five Categories

### 1. Bloaters
Code that has grown too large.

| Smell | Symptom | Refactoring |
|-------|---------|-------------|
| **Long Method** | > 10 lines | Extract Method |
| **Large Class** | > 50 lines, multiple responsibilities | Extract Class |
| **Long Parameter List** | > 3 parameters | Introduce Parameter Object |
| **Data Clumps** | Same group of variables appear together | Extract Class |
| **Primitive Obsession** | Primitives instead of small objects | Wrap in Value Object |

### 2. Object-Orientation Abusers
Misuse of OO principles.

| Smell | Symptom | Refactoring |
|-------|---------|-------------|
| **Switch Statements** | Type checking, large switch/if-else | Replace with Polymorphism |
| **Parallel Inheritance** | Adding subclass requires adding another | Merge Hierarchies |
| **Refused Bequest** | Subclass doesn't use parent methods | Replace Inheritance with Delegation |
| **Alternative Classes** | Different interfaces, same concept | Rename, Extract Superclass |

### 3. Change Preventers
Code that makes changes difficult.

| Smell | Symptom | Refactoring |
|-------|---------|-------------|
| **Divergent Change** | One class changed for many reasons | Extract Class (SRP) |
| **Shotgun Surgery** | One change touches many classes | Move Method/Field together |
| **Parallel Inheritance** | (see above) | Merge Hierarchies |

### 4. Dispensables
Code that can be removed.

| Smell | Symptom | Refactoring |
|-------|---------|-------------|
| **Comments** | Explaining bad code | Rename, Extract Method |
| **Duplicate Code** | Copy-paste | Extract Method, Pull Up Method |
| **Dead Code** | Unreachable code | Delete |
| **Speculative Generality** | "Just in case" code | Delete (YAGNI) |
| **Lazy Class** | Class that does almost nothing | Inline Class |

### 5. Couplers
Excessive coupling between classes.

| Smell | Symptom | Refactoring |
|-------|---------|-------------|
| **Feature Envy** | Method uses another class's data extensively | Move Method |
| **Inappropriate Intimacy** | Classes know too much about each other | Move Method, Extract Class |
| **Message Chains** | `a.getB().getC().getD()` | Hide Delegate |
| **Middle Man** | Class only delegates | Inline Class |

---

## The Seven Most Common Code Smells

### 1. Long Method

**Symptom:** Method > 10 lines, doing multiple things.

```typescript
// SMELL
function processOrder(order: Order) {
  // Validate
  if (!order.items.length) throw new Error('Empty');
  if (!order.customer) throw new Error('No customer');

  // Calculate
  let total = 0;
  for (const item of order.items) {
    total += item.price * item.quantity;
    if (item.discount) {
      total -= item.discount;
    }
  }

  // Apply tax
  const taxRate = getTaxRate(order.customer.state);
  total = total * (1 + taxRate);

  // Save
  db.orders.insert({ ...order, total });

  // Notify
  emailService.send(order.customer.email, 'Order confirmed');
}

// REFACTORED
function processOrder(order: Order) {
  validateOrder(order);
  const total = calculateTotal(order);
  saveOrder(order, total);
  notifyCustomer(order);
}
```

### 2. Large Class

**Symptom:** Class with many responsibilities, > 50 lines.

```typescript
// SMELL: God class
class User {
  // User data
  name: string;
  email: string;

  // Authentication
  login() { }
  logout() { }
  resetPassword() { }

  // Preferences
  setTheme() { }
  setLanguage() { }

  // Notifications
  sendEmail() { }
  sendSMS() { }

  // Billing
  charge() { }
  refund() { }
}

// REFACTORED: Separate classes
class User { name: string; email: string; }
class AuthService { login(); logout(); resetPassword(); }
class UserPreferences { setTheme(); setLanguage(); }
class NotificationService { sendEmail(); sendSMS(); }
class BillingService { charge(); refund(); }
```

### 3. Feature Envy

**Symptom:** Method uses another class's data more than its own.

```typescript
// SMELL: Order envies Customer
class Order {
  calculateShipping(customer: Customer): number {
    if (customer.country === 'US') {
      if (customer.state === 'CA') return 10;
      return 15;
    }
    return 25;
  }
}

// REFACTORED: Move to Customer
class Customer {
  getShippingCost(): number {
    if (this.country === 'US') {
      if (this.state === 'CA') return 10;
      return 15;
    }
    return 25;
  }
}

class Order {
  calculateShipping(): number {
    return this.customer.getShippingCost();
  }
}
```

### 4. Primitive Obsession

**Symptom:** Using primitives for domain concepts.

```typescript
// SMELL
function createUser(email: string, age: number, zipCode: string) {
  // No validation, easy to pass wrong values
  if (!email.includes('@')) throw new Error();
  if (age < 0) throw new Error();
}

// REFACTORED: Value objects
class Email {
  constructor(private value: string) {
    if (!value.includes('@')) throw new InvalidEmail();
  }
}

class Age {
  constructor(private value: number) {
    if (value < 0 || value > 150) throw new InvalidAge();
  }
}

function createUser(email: Email, age: Age, address: Address) {
  // Type system prevents invalid data
}
```

### 5. Switch Statements

**Symptom:** Switching on type, repeated across codebase.

```typescript
// SMELL
function getArea(shape: Shape): number {
  switch (shape.type) {
    case 'circle': return Math.PI * shape.radius ** 2;
    case 'rectangle': return shape.width * shape.height;
    case 'triangle': return 0.5 * shape.base * shape.height;
  }
}

function getPerimeter(shape: Shape): number {
  switch (shape.type) { // Same switch again!
    case 'circle': return 2 * Math.PI * shape.radius;
    // ...
  }
}

// REFACTORED: Polymorphism
interface Shape {
  getArea(): number;
  getPerimeter(): number;
}

class Circle implements Shape {
  constructor(private radius: number) {}
  getArea(): number { return Math.PI * this.radius ** 2; }
  getPerimeter(): number { return 2 * Math.PI * this.radius; }
}
```

### 6. Inappropriate Intimacy

**Symptom:** Classes know too much about each other's internals.

```typescript
// SMELL
class Order {
  process() {
    const inventory = new Inventory();
    // Reaching into inventory's internals
    for (const item of this.items) {
      const stock = inventory.stockLevels[item.sku];
      if (stock.quantity < item.quantity) {
        throw new Error('Out of stock');
      }
      inventory.stockLevels[item.sku].quantity -= item.quantity;
    }
  }
}

// REFACTORED: Tell, don't ask
class Inventory {
  reserve(items: OrderItem[]): ReserveResult {
    // Inventory manages its own state
    for (const item of items) {
      if (!this.canReserve(item)) {
        return ReserveResult.outOfStock(item);
      }
    }
    this.deductStock(items);
    return ReserveResult.success();
  }
}

class Order {
  process(inventory: Inventory) {
    const result = inventory.reserve(this.items);
    if (!result.isSuccess()) {
      throw new OutOfStockError(result.failedItem);
    }
  }
}
```

### 7. Speculative Generality

**Symptom:** "Just in case" abstractions that aren't used.

```typescript
// SMELL: Over-engineered for hypothetical needs
interface PaymentProcessor {
  process(): void;
  rollback(): void;
  audit(): void;
  generateReport(): void;
  scheduleRecurring(): void;
}

class StripeProcessor implements PaymentProcessor {
  process() { /* actual code */ }
  rollback() { throw new Error('Not implemented'); }
  audit() { throw new Error('Not implemented'); }
  generateReport() { throw new Error('Not implemented'); }
  scheduleRecurring() { throw new Error('Not implemented'); }
}

// REFACTORED: YAGNI
interface PaymentProcessor {
  process(): void;
}

class StripeProcessor implements PaymentProcessor {
  process() { /* actual code */ }
}
// Add other methods when actually needed
```

---

## Prevention Strategies

1. **Follow Object Calisthenics** - Rules prevent most smells
2. **Practice TDD** - Tests reveal design problems early
3. **Review in pairs** - Fresh eyes catch smells
4. **Refactor continuously** - Don't let smells accumulate
5. **Apply SOLID** - Prevents structural smells
6. **Use static analysis** - Tools catch common issues

---

## When You Find a Smell

1. **Confirm it's a problem** - Not all smells need fixing
2. **Ensure test coverage** - Before refactoring
3. **Refactor in small steps** - Keep tests passing
4. **Commit frequently** - Easy to revert if needed
