# Async & Concurrency Patterns — Cross-Language Guide

> This document covers concurrency model comparisons, common pitfalls, cross-language best practices, and structured concurrency patterns.

## Table of Contents

- [Concurrency Model Comparison](#concurrency-model-comparison)
- [Common Pitfalls](#common-pitfalls)
- [Best Practices](#best-practices)
- [Cross-Language Code Examples](#cross-language-code-examples)
- [Review Checklist](#review-checklist)

---

## Concurrency Model Comparison

| Model                        | Languages          | Core Concept                               | Pros                                       | Cons                                   |
| ---------------------------- | ------------------ | ------------------------------------------ | ------------------------------------------ | -------------------------------------- |
| **Goroutines + Channels**    | Go                 | Lightweight coroutines + CSP communication | Minimal syntax, low overhead               | Manual cancellation propagation        |
| **async/await + Event Loop** | Python, TypeScript | Single-threaded cooperative multitasking   | Lock-free, easy to reason about            | Cannot block the event loop            |
| **async/await + Tokio**      | Rust               | Futures + runtime scheduling               | Zero-cost abstraction, compile-time safety | Steep learning curve                   |
| **Coroutines + Flow**        | Kotlin             | Suspend functions + structured concurrency | Automatic cancellation, lifecycle-bound    | Complex Dispatcher selection           |
| **async/await + Actors**     | Swift              | Structured concurrency + Actor isolation   | Compile-time data race checking            | Swift 6 migration cost                 |
| **async/await + TPL**        | C#                 | Task + thread pool                         | Mature ecosystem, ConfigureAwait           | Implicit thread switching              |
| **Threads + Mutexes**        | C++, Java, all     | OS threads + shared memory                 | True parallelism                           | Complex lock management, deadlock risk |

### When to Choose What

```
I/O-bound (network, database, files):
  → async/await (Python, TS, Rust, Swift, C#)
  → goroutines (Go)
  → coroutines (Kotlin)

CPU-bound (computation, image processing):
  → thread pool (Java, C++, C#)
  → multiprocessing (Python)
  → spawn_blocking (Rust tokio)
  → Dispatchers.Default (Kotlin)

Mixed:
  → async + spawn_blocking (Rust)
  → async + run_in_executor (Python)
  → goroutines + sync.Mutex (Go)
```

---

## Common Pitfalls

### Pitfall 1: Race Condition

Multiple concurrent tasks read and write shared state, and the result depends on execution order.

```
// Generic pseudocode
counter = 0

task1: counter += 1   // read counter=0, write counter=1
task2: counter += 1   // read counter=0, write counter=1
// expected counter=2, actual counter=1
```

**Solution**: Mutexes, atomic operations, or encapsulate shared state in an Actor.

### Pitfall 2: Deadlock

Two or more tasks wait for locks held by each other.

```
task1: lock(A); lock(B);  // holds A, waits for B
task2: lock(B); lock(A);  // holds B, waits for A
// both wait forever
```

**Solution**:

- Consistent lock acquisition order
- Timeout locks (tryLock with timeout)
- Avoid nested locks

### Pitfall 3: Starvation

Low-priority tasks never get a chance to execute.

```
// High-priority tasks keep arriving, low-priority tasks queue forever
```

**Solution**: Fair locks, task priority queues, concurrency limits.

### Pitfall 4: Goroutine / Task Leak

Starting concurrent tasks without ensuring they exit.

```go
// ❌ Go: goroutine leak
func process() {
    ch := make(chan int)
    go func() {
        result := <-ch  // if nobody sends, goroutine blocks forever
    }()
    // function returns, but goroutine is still waiting
}
```

```python
# ❌ Python: Task leak
async def process():
    task = asyncio.create_task(long_running())
    # function returns, but task is still running
```

**Solution**: Use context/done channel (Go), TaskGroup (Python), structured concurrency (Kotlin/Swift).

### Pitfall 5: Blocking in an Async Context

```python
# ❌ Python: Using synchronous I/O in an async function blocks the event loop
async def handle():
    result = requests.get(url)  # blocks! entire event loop stalls
    return result

# ✅ Use async I/O or offload blocking operations to a thread pool
async def handle():
    result = await aiohttp.get(url)  # non-blocking
    return result

# Or offload synchronous code to a thread pool
async def handle():
    result = await asyncio.to_thread(requests.get, url)
    return result
```

```rust
// ❌ Rust: Blocking in an async function
async fn handle() {
    let result = std::fs::read_to_string("large.txt");  // blocks tokio runtime
}

// ✅ Use spawn_blocking
async fn handle() {
    let result = tokio::task::spawn_blocking(|| {
        std::fs::read_to_string("large.txt")
    }).await?;
}
```

---

## Best Practices

### 1. Structured Concurrency

Ensure the lifetime of concurrent tasks is bound to the scope that created them. When the parent task is cancelled, child tasks are automatically cancelled.

```kotlin
// ✅ Kotlin: coroutineScope ensures all child coroutines complete when the scope ends
suspend fun processItems(items: List<Item>) = coroutineScope {
    items.forEach { item ->
        launch { processItem(item) }  // child coroutine
    }
    // waits for all child coroutines to complete when scope ends
}

// If processItems is cancelled, all child coroutines are automatically cancelled
```

```swift
// ✅ Swift: async let + TaskGroup
func processItems() async throws {
    async let resultA = fetchA()  // concurrent execution
    async let resultB = fetchB()
    let combined = try await (resultA, resultB)  // wait for both
}
```

```python
# ✅ Python 3.11+: TaskGroup
async def process_items():
    async with asyncio.TaskGroup() as tg:
        for item in items:
            tg.create_task(process_item(item))
    # TaskGroup waits for all tasks to complete on exit
    # If one task fails, remaining tasks are automatically cancelled
```

### 2. Cancellation Propagation

Ensure cancellation signals propagate correctly to all child tasks.

```go
// ✅ Go: context propagates cancellation
func processAll(ctx context.Context, items []Item) error {
    g, ctx := errgroup.WithContext(ctx)
    for _, item := range items {
        item := item
        g.Go(func() error {
            return processItem(ctx, item)
        })
    }
    return g.Wait()  // if any fails, context is cancelled, remaining tasks receive the signal
}
```

```rust
// ✅ Rust: tokio::select! + JoinHandle
async fn process_with_timeout(item: Item) -> Result<Data> {
    tokio::select! {
        result = process(item) => result,
        _ = tokio::time::sleep(Duration::from_secs(30)) => {
            Err(anyhow!("processing timed out"))
        }
    }
}
```

### 3. Backpressure

When the producer is much faster than the consumer, limit the queue size to prevent memory bloat.

```go
// ✅ Go: Buffered channel as natural backpressure
func process(items <-chan Item) <-chan Result {
    results := make(chan Result, 10)  // buffer 10 results
    go func() {
        for item := range items {
            results <- processItem(item)  // blocks when buffer is full
        }
        close(results)
    }()
    return results
}
```

```kotlin
// ✅ Kotlin: Flow has built-in backpressure
fun itemsFlow(): Flow<Item> = flow {
    for (item in fetchAll()) {
        emit(item)  // suspends when collector is not ready
    }
}
// Use buffer() to control buffering strategy
itemsFlow()
    .buffer(capacity = 10, onBufferOverflow = BufferOverflow.SUSPEND)
    .collect { process(it) }
```

### 4. Limit Concurrency

Prevent resource exhaustion from starting too many tasks simultaneously.

```python
# ✅ Python: Semaphore to limit concurrency
async def fetch_all(urls: list[str], max_concurrent: int = 10):
    semaphore = asyncio.Semaphore(max_concurrent)

    async def fetch_one(url: str):
        async with semaphore:
            return await aiohttp.get(url)

    return await asyncio.gather(*[fetch_one(url) for url in urls])
```

```go
// ✅ Go: errgroup + semaphore
func fetchAll(ctx context.Context, urls []string, maxConcurrent int) error {
    g, ctx := errgroup.WithContext(ctx)
    sem := make(chan struct{}, maxConcurrent)

    for _, url := range urls {
        url := url
        g.Go(func() error {
            sem <- struct{}{}        // acquire semaphore
            defer func() { <-sem }() // release semaphore
            return fetch(ctx, url)
        })
    }
    return g.Wait()
}
```

---

## Cross-Language Code Examples

### Go: Goroutines + Channels + Context

```go
// ✅ Complete pattern: context cancellation + errgroup + bounded concurrency
func processBatch(ctx context.Context, items []Item) ([]Result, error) {
    g, ctx := errgroup.WithContext(ctx)
    results := make([]Result, len(items))
    sem := make(chan struct{}, 10)  // at most 10 concurrent

    for i, item := range items {
        i, item := i, item
        g.Go(func() error {
            select {
            case sem <- struct{}{}:
            case <-ctx.Done():
                return ctx.Err()
            }
            defer func() { <-sem }()

            result, err := process(ctx, item)
            if err != nil {
                return fmt.Errorf("item %d: %w", i, err)
            }
            results[i] = result
            return nil
        })
    }

    if err := g.Wait(); err != nil {
        return nil, err
    }
    return results, nil
}
```

### Python: asyncio + TaskGroup

```python
# ✅ Python 3.11+: Structured concurrency + bounded concurrency + timeout
import asyncio

async def process_batch(items: list[Item], max_concurrent: int = 10) -> list[Result]:
    semaphore = asyncio.Semaphore(max_concurrent)

    async def process_one(item: Item) -> Result:
        async with semaphore:
            return await process(item)

    async with asyncio.TaskGroup() as tg:
        tasks = [tg.create_task(process_one(item)) for item in items]

    return [task.result() for task in tasks]
```

### Rust: tokio + select + spawn_blocking

```rust
// ✅ Bounded concurrency + timeout + isolated blocking operations
use tokio::sync::Semaphore;
use std::sync::Arc;

async fn process_batch(items: Vec<Item>, max_concurrent: usize) -> Result<Vec<Output>> {
    let sem = Arc::new(Semaphore::new(max_concurrent));
    let mut handles = Vec::new();

    for item in items {
        let permit = sem.clone().acquire_owned().await?;
        handles.push(tokio::spawn(async move {
            let _permit = permit;  // drop on completion
            tokio::select! {
                result = process(item) => result,
                _ = tokio::time::sleep(Duration::from_secs(30)) => {
                    Err(anyhow!("timeout"))
                }
            }
        }));
    }

    let mut results = Vec::new();
    for handle in handles {
        results.push(handle.await??);
    }
    Ok(results)
}
```

### Kotlin: Coroutines + Flow + Dispatchers

```kotlin
// ✅ Structured concurrency + bounded concurrency + cancellation safety
suspend fun processBatch(items: List<Item>, maxConcurrent: Int = 10): List<Result> {
    val semaphore = Semaphore(maxConcurrent)

    return coroutineScope {
        items.map { item ->
            async(Dispatchers.IO) {
                semaphore.withPermit {
                    process(item)
                }
            }
        }.awaitAll()
    }
}

// ✅ Flow: streaming + backpressure
fun itemStream(): Flow<Result> = flow {
    for (item in fetchAllItems()) {
        emit(process(item))
    }
}
    .flowOn(Dispatchers.IO)
    .buffer(capacity = 10)
    .catch { e -> logger.error("stream failed", e) }
```

### Swift: async/await + TaskGroup + Actors

```swift
// ✅ Structured concurrency + actor isolation
actor ResultCollector {
    private var results: [Result] = []
    func add(_ result: Result) { results.append(result) }
    func all() -> [Result] { results }
}

func processBatch(items: [Item], maxConcurrent: Int = 10) async throws -> [Result] {
    let collector = ResultCollector()

    try await withThrowingTaskGroup(of: Void.self) { group in
        var active = 0
        for item in items {
            if active >= maxConcurrent {
                try await group.next()
                active -= 1
            }
            group.addTask {
                let result = try await process(item)
                await collector.add(result)
            }
            active += 1
        }
    }

    return await collector.all()
}
```

### C#: async/await + SemaphoreSlim + CancellationToken

```csharp
// ✅ Bounded concurrency + cancellation + exception handling
async Task<List<Result>> ProcessBatchAsync(
    List<Item> items,
    int maxConcurrent = 10,
    CancellationToken ct = default)
{
    using var semaphore = new SemaphoreSlim(maxConcurrent);
    var tasks = items.Select(async item =>
    {
        await semaphore.WaitAsync(ct);
        try
        {
            return await ProcessAsync(item, ct);
        }
        finally
        {
            semaphore.Release();
        }
    });

    var results = await Task.WhenAll(tasks);
    return results.ToList();
}
```

### TypeScript: Worker-pool Concurrency Limit

```typescript
// ✅ Worker-pool pattern: fixed number of workers compete for task queue
//    Results are assigned by original index, ensuring output order matches input order.
async function processWithLimit<T, R>(
  items: T[],
  fn: (item: T) => Promise<R>,
  limit: number
): Promise<R[]> {
  const results: R[] = []
  let index = 0

  const workers = Array.from({ length: limit }, async () => {
    while (index < items.length) {
      const i = index++
      results[i] = await fn(items[i])
    }
  })

  await Promise.all(workers)
  return results
}
```

---

## Review Checklist

### Basic Checks

- [ ] Concurrent tasks have a clear exit mechanism (no leaks)
- [ ] Shared state is properly protected (mutex, actor, channel)
- [ ] No blocking operations in async contexts
- [ ] Cancellation signals propagate correctly to all child tasks

### Architecture Checks

- [ ] Uses structured concurrency (TaskGroup / coroutineScope / errgroup)
- [ ] Concurrency has an upper bound (semaphore / bounded channel)
- [ ] Long-running tasks support timeout
- [ ] Backpressure mechanism prevents memory bloat

### Performance Checks

- [ ] Concurrency granularity is reasonable (not too fine, not too coarse)
- [ ] I/O-bound uses async, CPU-bound uses threads/processes
- [ ] Lock hold time is minimized
- [ ] No unnecessary awaits (parallelizable operations executed serially)

### Language-Specific

- [ ] Go: context propagation, errgroup usage, reasonable channel buffering
- [ ] Python: event loop not blocked, TaskGroup manages lifecycle
- [ ] Rust: spawn_blocking isolates blocking operations, select! handles timeouts
- [ ] Kotlin: coroutineScope for structured concurrency, correct Dispatcher selection
- [ ] Swift: @MainActor protects UI, actor isolates mutable state
- [ ] C#: CancellationToken propagation, ConfigureAwait(false) in library code
- [ ] TypeScript: Promise.all + concurrency limit, AbortController for cancellation
