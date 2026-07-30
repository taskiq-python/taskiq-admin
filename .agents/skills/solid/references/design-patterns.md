# Design Patterns

## What Are Design Patterns?

Reusable solutions to common design problems. A shared vocabulary for discussing design.

## WARNING: Don't Force Patterns

> "Let patterns emerge from refactoring, don't force them upfront."

Patterns should solve problems you HAVE, not problems you MIGHT have.

## When to Use Patterns

1. **You recognize the problem** - You've seen it before
2. **The pattern fits** - Not forcing it
3. **It simplifies** - Doesn't add unnecessary complexity
4. **Team understands it** - Shared knowledge

---

## Creational Patterns

### Singleton

**Purpose:** Ensure only one instance exists.

**When to use:** Global configuration, connection pools, logging.

**Warning:** Often overused. Consider dependency injection instead.

```typescript
class Logger {
  private static instance: Logger;

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  log(message: string): void { ... }
}
```

### Factory

**Purpose:** Create objects without specifying exact class.

**When to use:** Object creation logic is complex, or varies by type.

```typescript
interface Notification {
  send(message: string): void;
}

class EmailNotification implements Notification { ... }
class SMSNotification implements Notification { ... }
class PushNotification implements Notification { ... }

class NotificationFactory {
  create(type: 'email' | 'sms' | 'push'): Notification {
    switch (type) {
      case 'email': return new EmailNotification();
      case 'sms': return new SMSNotification();
      case 'push': return new PushNotification();
    }
  }
}
```

### Builder

**Purpose:** Construct complex objects step by step.

**When to use:** Objects with many optional parameters, test data creation.

```typescript
class UserBuilder {
  private user: Partial<User> = {};

  withName(name: string): UserBuilder {
    this.user.name = name;
    return this;
  }

  withEmail(email: string): UserBuilder {
    this.user.email = email;
    return this;
  }

  withAge(age: number): UserBuilder {
    this.user.age = age;
    return this;
  }

  build(): User {
    return new User(
      this.user.name!,
      this.user.email!,
      this.user.age
    );
  }
}

// Usage
const user = new UserBuilder()
  .withName('Alice')
  .withEmail('alice@example.com')
  .build();
```

### Prototype

**Purpose:** Create new objects by cloning existing ones.

**When to use:** Object creation is expensive, or you need copies with slight variations.

```typescript
interface Prototype {
  clone(): Prototype;
}

class Document implements Prototype {
  constructor(
    public title: string,
    public content: string,
    public metadata: Metadata
  ) {}

  clone(): Document {
    return new Document(
      this.title,
      this.content,
      { ...this.metadata }
    );
  }
}
```

---

## Structural Patterns

### Adapter

**Purpose:** Make incompatible interfaces work together.

**When to use:** Integrating third-party libraries, legacy code.

```typescript
// Third-party library with different interface
class OldPaymentAPI {
  makePayment(cents: number): boolean { ... }
}

// Our interface
interface PaymentGateway {
  charge(amount: Money): ChargeResult;
}

// Adapter
class OldPaymentAdapter implements PaymentGateway {
  constructor(private oldAPI: OldPaymentAPI) {}

  charge(amount: Money): ChargeResult {
    const cents = amount.toCents();
    const success = this.oldAPI.makePayment(cents);
    return success ? ChargeResult.success() : ChargeResult.failed();
  }
}
```

### Decorator

**Purpose:** Add behavior to objects dynamically.

**When to use:** Adding features without modifying existing code.

```typescript
interface Notifier {
  send(message: string): void;
}

class EmailNotifier implements Notifier {
  send(message: string): void {
    console.log(`Email: ${message}`);
  }
}

// Decorators
class SMSDecorator implements Notifier {
  constructor(private wrapped: Notifier) {}

  send(message: string): void {
    this.wrapped.send(message);
    console.log(`SMS: ${message}`);
  }
}

class SlackDecorator implements Notifier {
  constructor(private wrapped: Notifier) {}

  send(message: string): void {
    this.wrapped.send(message);
    console.log(`Slack: ${message}`);
  }
}

// Usage - compose behaviors
const notifier = new SlackDecorator(
  new SMSDecorator(
    new EmailNotifier()
  )
);
notifier.send('Alert!'); // Sends to all three
```

### Proxy

**Purpose:** Control access to an object.

**When to use:** Lazy loading, access control, logging, caching.

```typescript
interface Image {
  display(): void;
}

class RealImage implements Image {
  constructor(private filename: string) {
    this.loadFromDisk(); // Expensive
  }

  private loadFromDisk(): void { ... }

  display(): void { ... }
}

// Lazy loading proxy
class ImageProxy implements Image {
  private realImage: RealImage | null = null;

  constructor(private filename: string) {}

  display(): void {
    if (!this.realImage) {
      this.realImage = new RealImage(this.filename);
    }
    this.realImage.display();
  }
}
```

### Composite

**Purpose:** Treat individual objects and compositions uniformly.

**When to use:** Tree structures, hierarchies (files/folders, UI components).

```typescript
interface Component {
  getPrice(): number;
}

class Product implements Component {
  constructor(private price: number) {}

  getPrice(): number {
    return this.price;
  }
}

class Box implements Component {
  private children: Component[] = [];

  add(component: Component): void {
    this.children.push(component);
  }

  getPrice(): number {
    return this.children.reduce(
      (sum, child) => sum + child.getPrice(),
      0
    );
  }
}

// Usage
const smallBox = new Box();
smallBox.add(new Product(10));
smallBox.add(new Product(20));

const bigBox = new Box();
bigBox.add(smallBox);
bigBox.add(new Product(50));

console.log(bigBox.getPrice()); // 80
```

---

## Behavioral Patterns

### Strategy

**Purpose:** Define a family of algorithms, make them interchangeable.

**When to use:** Multiple ways to do something, switchable at runtime.

```typescript
interface PricingStrategy {
  calculate(basePrice: number): number;
}

class RegularPricing implements PricingStrategy {
  calculate(basePrice: number): number {
    return basePrice;
  }
}

class PremiumDiscount implements PricingStrategy {
  calculate(basePrice: number): number {
    return basePrice * 0.8; // 20% off
  }
}

class BlackFriday implements PricingStrategy {
  calculate(basePrice: number): number {
    return basePrice * 0.5; // 50% off
  }
}

class ShoppingCart {
  constructor(private pricing: PricingStrategy) {}

  calculateTotal(items: Item[]): number {
    const base = items.reduce((sum, i) => sum + i.price, 0);
    return this.pricing.calculate(base);
  }
}
```

### Observer

**Purpose:** Notify multiple objects about state changes.

**When to use:** Event systems, pub/sub, reactive updates.

```typescript
interface Observer {
  update(event: Event): void;
}

class EventEmitter {
  private observers: Observer[] = [];

  subscribe(observer: Observer): void {
    this.observers.push(observer);
  }

  unsubscribe(observer: Observer): void {
    this.observers = this.observers.filter(o => o !== observer);
  }

  notify(event: Event): void {
    this.observers.forEach(o => o.update(event));
  }
}

// Usage
class OrderService extends EventEmitter {
  placeOrder(order: Order): void {
    // Process order...
    this.notify({ type: 'ORDER_PLACED', order });
  }
}

class EmailService implements Observer {
  update(event: Event): void {
    if (event.type === 'ORDER_PLACED') {
      this.sendConfirmation(event.order);
    }
  }
}
```

### Template Method

**Purpose:** Define algorithm skeleton, let subclasses override steps.

**When to use:** Common algorithm with varying steps.

```typescript
abstract class DataExporter {
  // Template method - defines the algorithm
  export(data: Data[]): void {
    this.validate(data);
    const formatted = this.format(data);
    this.write(formatted);
    this.notify();
  }

  // Common steps
  private validate(data: Data[]): void { ... }
  private notify(): void { ... }

  // Steps to override
  protected abstract format(data: Data[]): string;
  protected abstract write(content: string): void;
}

class CSVExporter extends DataExporter {
  protected format(data: Data[]): string {
    return data.map(d => d.toCSV()).join('\n');
  }

  protected write(content: string): void {
    fs.writeFileSync('export.csv', content);
  }
}

class JSONExporter extends DataExporter {
  protected format(data: Data[]): string {
    return JSON.stringify(data);
  }

  protected write(content: string): void {
    fs.writeFileSync('export.json', content);
  }
}
```

### Command

**Purpose:** Encapsulate a request as an object.

**When to use:** Undo/redo, queuing, logging actions.

```typescript
interface Command {
  execute(): void;
  undo(): void;
}

class AddItemCommand implements Command {
  constructor(
    private cart: Cart,
    private item: Item
  ) {}

  execute(): void {
    this.cart.add(this.item);
  }

  undo(): void {
    this.cart.remove(this.item);
  }
}

class CommandHistory {
  private history: Command[] = [];

  execute(command: Command): void {
    command.execute();
    this.history.push(command);
  }

  undo(): void {
    const command = this.history.pop();
    command?.undo();
  }
}
```

---

## Pattern Awareness

### The Four-Dimensional Lens

When analyzing new code/libraries, ask:

1. **What problem does it solve?** (Creational, Structural, Behavioral)
2. **What scope?** (Object-level, Class-level, System-level)
3. **When is it applied?** (Compile-time, Runtime)
4. **How coupled?** (Tight, Loose)

This helps recognize patterns even in unfamiliar code.

---

## Anti-Patterns to Avoid

| Anti-Pattern | Problem | Solution |
|--------------|---------|----------|
| **God Object** | Class does everything | Split by responsibility |
| **Spaghetti Code** | Tangled, no structure | Refactor to layers |
| **Golden Hammer** | Using one pattern for everything | Match pattern to problem |
| **Premature Optimization** | Optimizing before needed | YAGNI, profile first |
| **Copy-Paste Programming** | Duplication | Extract, Rule of Three |
