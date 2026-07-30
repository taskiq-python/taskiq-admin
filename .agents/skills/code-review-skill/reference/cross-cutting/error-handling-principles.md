# Error Handling Principles — Cross-Language Guide

> This document covers core error handling principles, common anti-patterns, error hierarchy design, and logging best practices. Each principle includes cross-language code examples.

## Table of Contents

- [Core Principles](#core-principles)
- [Anti-Patterns](#anti-patterns)
- [Error Hierarchy Design](#error-hierarchy-design)
- [Logging Best Practices](#logging-best-practices)
- [Cross-Language Code Examples](#cross-language-code-examples)
- [Review Checklist](#review-checklist)

---

## Core Principles

### Principle 1: Don't Swallow Errors

Every error must be handled: propagate it upward, log it, or convert it to a more meaningful error. **Never** silently ignore it.

```
// Pseudocode
result = risky_operation()
if error:
    // Must do one of the following:
    //   1. return error to caller (propagate)
    //   2. log + return fallback (degrade)
    //   3. panic/crash (when unrecoverable)
```

### Principle 2: Add Context

Error messages should include the **operation description** and **key parameters**, so debuggers can locate the problem without reading the call chain.

```
// ❌ No context
"failed"

// ✅ With context
"failed to process order #12345: payment gateway timeout after 30s"
```

### Principle 3: Use Specific Types

Use error types to distinguish failure reasons, allowing callers to handle different failure scenarios precisely.

```
// ❌ Generic error
throw new Error("something went wrong")

// ✅ Specific types
throw new OrderNotFoundError(orderId)
throw new PaymentTimeoutException(gatewayName, timeoutMs)
```

### Principle 4: Fail Fast

Validate preconditions before starting an operation to fail early. This avoids inconsistent states caused by discovering errors after partial execution.

```
// ❌ Discovering invalid parameters halfway through
def process(data, config):
    result = expensive_computation(data)  # already spent 5 seconds
    if not config.valid:
        raise ValueError("invalid config")  # 5 seconds wasted

// ✅ Validate first
def process(data, config):
    if not config.valid:
        raise ValueError("invalid config")
    result = expensive_computation(data)
```

### Principle 5: Handle Errors Only Once

Don't handle the same error at every level (both log and return and wrap). Choose one approach and let the caller decide how to handle it.

```
// ❌ Both log and return (duplicate handling)
if err:
    log.error("failed: %s", err)
    return err

// ✅ Only wrap and return, let the top level handle uniformly
if err:
    return wrap_error("operation failed", err)
```

---

## Anti-Patterns

### Anti-Pattern 1: Empty catch Block

```python
# ❌ Python: Bare except swallows all exceptions (including KeyboardInterrupt)
try:
    result = risky()
except:
    pass

# ❌ Java: Empty catch swallows exception
try {
    result = risky();
} catch (Exception e) {
    // do nothing
}

# ❌ Go: Ignoring error
result, _ := risky()

# ❌ Rust: unwrap() in production code
let result = risky().unwrap();  // panic on error
```

### Anti-Pattern 2: Overly Broad catch

```python
# ❌ Catching all exceptions, cannot distinguish failure types
try:
    result = risky()
except Exception as e:
    logger.error(f"failed: {e}")

# ✅ Catch specific exceptions
try:
    result = risky()
except ConnectionError as e:
    logger.warning(f"network issue, retrying: {e}")
    result = retry(risky)
except ValueError as e:
    logger.error(f"bad input: {e}")
    raise
```

### Anti-Pattern 3: Losing the Original Exception

```python
# ❌ Lost the original exception's stack and information
try:
    result = external_api.call()
except APIError as e:
    raise RuntimeError("API failed")  # lost the cause

# ✅ Preserve exception chain
try:
    result = external_api.call()
except APIError as e:
    raise RuntimeError("API failed") from e
```

```java
// ❌ Losing original exception
catch (IOException e) {
    throw new ServiceException("IO failed");
}

// ✅ Preserve cause
catch (IOException e) {
    throw new ServiceException("IO failed", e);
}
```

### Anti-Pattern 4: Using Exceptions for Flow Control

```python
# ❌ Using exceptions for normal flow control (slow and unclear)
try:
    user = users[name]
except KeyError:
    user = create_default_user(name)

# ✅ Explicit check
user = users.get(name) or create_default_user(name)
```

```go
// ❌ Go: panic for flow control
func getUser(id int) User {
    if id <= 0 {
        panic("invalid id")
    }
}

// ✅ Go: Return error
func getUser(id int) (User, error) {
    if id <= 0 {
        return User{}, fmt.Errorf("invalid user id: %d", id)
    }
}
```

### Anti-Pattern 5: Ignoring Return Values

```csharp
// ❌ Ignoring returned bool/Result
dict.TryGetValue("key", out var value);
// value may be default, but code continues as if successful

// ✅ Check return value
if (!dict.TryGetValue("key", out var value))
{
    throw new KeyNotFoundException("key not found");
}
```

---

## Error Hierarchy Design

### Three-Layer Error Architecture

```
┌─────────────────────────────────────────────────┐
│ Application Errors                               │
│   - AppError / ServiceError                      │
│   - Caught by global exception handler, returns  │
│     user-friendly response                       │
├─────────────────────────────────────────────────┤
│ Module Errors                                    │
│   - PaymentError, AuthError, ValidationError     │
│   - Each business module defines its own types   │
├─────────────────────────────────────────────────┤
│ Infrastructure Errors                            │
│   - IOError, NetworkError, DatabaseError         │
│   - Low-level errors from OS, network, database  │
└─────────────────────────────────────────────────┘
```

### Design Rules

1. **Module-level errors inherit from application-level base class**, enabling global catch
2. **Infrastructure errors are converted to module-level errors at module boundaries**, not exposed to upper layers
3. **Each error type includes sufficient context** for debugging (ID, timestamp, operation name)

### Example Hierarchy (Python)

```python
class AppError(Exception):
    """Application base exception"""
    pass

class PaymentError(AppError):
    """Payment module error"""
    def __init__(self, order_id: str, reason: str):
        self.order_id = order_id
        super().__init__(f"payment failed for order {order_id}: {reason}")

class PaymentGatewayTimeout(PaymentError):
    """Payment gateway timeout"""
    def __init__(self, order_id: str, gateway: str, timeout_ms: int):
        self.gateway = gateway
        self.timeout_ms = timeout_ms
        super().__init__(order_id, f"gateway {gateway} timed out after {timeout_ms}ms")
```

### Example Hierarchy (Java)

```java
public class AppException extends RuntimeException {
    private final String errorCode;
    public AppException(String errorCode, String message, Throwable cause) {
        super(message, cause);
        this.errorCode = errorCode;
    }
}

public class OrderNotFoundException extends AppException {
    public OrderNotFoundException(Long orderId) {
        super("ORDER_NOT_FOUND", "Order " + orderId + " not found", null);
    }
}
```

---

## Logging Best Practices

### Log Level Selection

| Level     | When to Use                           | Example                                 |
| --------- | ------------------------------------- | --------------------------------------- |
| **ERROR** | Failures requiring human intervention | Payment failure, data inconsistency     |
| **WARN**  | Auto-recoverable anomalies            | Retry succeeded, degraded handling      |
| **INFO**  | Normal business events                | Order created, user login               |
| **DEBUG** | Debugging information                 | Function parameters, intermediate state |

### Log Format

```
// ❌ No structured information
log.error("failed to process")

// ✅ Structured information + context
log.error("payment_failed", {
    "order_id": "12345",
    "gateway": "stripe",
    "error_code": "card_declined",
    "amount": 99.99,
    "duration_ms": 2340
})
```

### Log Security

- **Do not log sensitive information**: passwords, tokens, PII, full credit card numbers
- **Masking**: `email: a***@example.com`
- **Log injection protection**: escape user input to prevent forged log lines

---

## Cross-Language Code Examples

### Python

```python
# ✅ Specific exception + context + exception chain
try:
    response = http_client.post(url, data=payload)
    response.raise_for_status()
except requests.ConnectionError as e:
    raise PaymentGatewayError(f"cannot reach {gateway_name}") from e
except requests.HTTPError as e:
    if response.status_code == 429:
        raise RateLimitError(f"rate limited by {gateway_name}") from e
    raise PaymentGatewayError(f"HTTP {response.status_code} from {gateway_name}") from e
```

### Java

```java
// ✅ Specific exception + context + cause chain
try {
    var response = httpClient.send(request, BodyHandlers.ofString());
    if (response.statusCode() == 404) {
        throw new OrderNotFoundException(orderId);
    }
} catch (IOException e) {
    throw new PaymentGatewayException(
        "gateway unreachable: " + gatewayUrl, e);
}
```

### Go

```go
// ✅ Error wrapping + context + %w preserves chain
result, err := client.Do(req)
if err != nil {
    return fmt.Errorf("payment gateway %s request failed: %w", gatewayName, err)
}
defer result.Body.Close()

if result.StatusCode == http.StatusNotFound {
    return fmt.Errorf("order %d not found: %w", orderID, ErrNotFound)
}
```

### Rust

```rust
// ✅ thiserror defines error types + context
#[derive(Debug, thiserror::Error)]
enum PaymentError {
    #[error("gateway {gateway} unreachable")]
    GatewayUnreachable {
        gateway: String,
        #[source]
        source: reqwest::Error,
    },
    #[error("order {order_id} not found")]
    OrderNotFound { order_id: u64 },
}

async fn process_payment(gateway: &str, order_id: u64) -> Result<(), PaymentError> {
    let response = client.post(url)
        .send()
        .await
        .map_err(|e| PaymentError::GatewayUnreachable {
            gateway: gateway.into(),
            source: e,
        })?;
    Ok(())
}
```

### C#

```csharp
// ✅ Specific exception + context
try
{
    var response = await httpClient.PostAsync(url, content);
    response.EnsureSuccessStatusCode();
}
catch (HttpRequestException ex) when (ex.StatusCode == HttpStatusCode.NotFound)
{
    throw new OrderNotFoundException(orderId, ex);
}
catch (HttpRequestException ex)
{
    throw new PaymentGatewayException($"gateway unreachable: {url}", ex);
}
```

### Swift

```swift
// ✅ Error enum + context
enum PaymentError: Error {
    case gatewayUnreachable(name: String, underlying: Error)
    case orderNotFound(id: Int)
    case declined(reason: String)
}

func processPayment(orderId: Int) throws -> Receipt {
    guard orderId > 0 else {
        throw PaymentError.orderNotFound(id: orderId)
    }
    do {
        let response = try networkClient.post(url, body: payload)
        return try Receipt(from: response)
    } catch let error as NetworkError {
        throw PaymentError.gatewayUnreachable(name: gateway, underlying: error)
    }
}
```

### TypeScript

```typescript
// ✅ Custom error class + context
class PaymentError extends Error {
  constructor(
    message: string,
    public readonly orderId: string,
    public readonly gateway: string,
    public readonly cause?: Error
  ) {
    super(message)
    this.name = 'PaymentError'
  }
}

async function processPayment(orderId: string): Promise<Receipt> {
  try {
    const response = await fetch(url, { method: 'POST', body: payload })
    if (!response.ok) {
      throw new PaymentError(
        `gateway returned ${response.status}`,
        orderId,
        gatewayName
      )
    }
    return await response.json()
  } catch (err) {
    if (err instanceof TypeError) {
      throw new PaymentError('gateway unreachable', orderId, gatewayName, err)
    }
    throw err
  }
}
```

---

## Review Checklist

### Core Checks

- [ ] No empty catch blocks or silently ignored errors
- [ ] Error messages include operation description and key parameters
- [ ] Specific error types used (not generic Error/Exception)
- [ ] Exception chain preserved (from / cause / %w)
- [ ] Preconditions validated before operation starts (fail fast)

### Architecture Checks

- [ ] Clear error hierarchy defined (application/module/infrastructure)
- [ ] Global exception handler catches unhandled errors
- [ ] API boundaries convert internal errors to appropriate HTTP status codes

### Logging Checks

- [ ] Error logs include structured context
- [ ] No sensitive information logged (passwords, tokens, PII)
- [ ] Log levels used correctly (ERROR vs WARN vs INFO)

### Language-Specific

- [ ] Go: errors not ignored, use `%w` for wrapping
- [ ] Python: catch specific exceptions, use `from` to preserve chain
- [ ] Java: exceptions have cause, use specific types
- [ ] Rust: `?` propagation, custom Error types
- [ ] C#: `when` filter, specific exception types
- [ ] Swift: do-catch, Result for deferred handling
