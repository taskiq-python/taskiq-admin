---
name: code-review-skill
description: |
  Provides comprehensive code review guidance for React 19, Vue 3, Angular 17+, Svelte 5,
  Rust, TypeScript, Java, PHP, Python, Django, FastAPI, Go, C#/.NET, Kotlin, Swift,
  NestJS, C/C++, Zig, CSS/Less/Sass, Qt, and more.
  Covers architecture review, performance review, security audit, code quality anti-patterns,
  and common bugs across all ecosystems.
  Use when: reviewing pull requests, conducting PR reviews, code review, reviewing code changes,
  establishing review standards, mentoring developers, architecture reviews, security audits,
  performance reviews, checking code quality, finding bugs, giving feedback on code.
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash      # Run lint/test/build commands to verify code quality
  - WebFetch  # Look up the latest documentation and best practices
---

# Code Review Skill

Transform code reviews from gatekeeping to knowledge sharing through constructive feedback, systematic analysis, and collaborative improvement.

## When to Use This Skill

- Reviewing pull requests and code changes
- Establishing code review standards for teams
- Mentoring junior developers through reviews
- Conducting architecture reviews
- Creating review checklists and guidelines
- Improving team collaboration
- Reducing code review cycle time
- Maintaining code quality standards

## Core Principles

### 1. The Review Mindset

**Goals of Code Review:**
- Catch bugs and edge cases
- Ensure code maintainability
- Share knowledge across team
- Enforce coding standards
- Improve design and architecture
- Build team culture

**Not the Goals:**
- Show off knowledge
- Nitpick formatting (use linters)
- Block progress unnecessarily
- Rewrite to your preference

### 2. Effective Feedback

**Good Feedback is:**
- Specific and actionable
- Educational, not judgmental
- Focused on the code, not the person
- Balanced (praise good work too)
- Prioritized (critical vs nice-to-have)

```markdown
❌ Bad: "This is wrong."
✅ Good: "This could cause a race condition when multiple users
         access simultaneously. Consider using a mutex here."

❌ Bad: "Why didn't you use X pattern?"
✅ Good: "Have you considered the Repository pattern? It would
         make this easier to test. Here's an example: [link]"

❌ Bad: "Rename this variable."
✅ Good: "[nit] Consider `userCount` instead of `uc` for
         clarity. Not blocking if you prefer to keep it."
```

### 3. Review Scope

**What to Review:**
- Logic correctness and edge cases
- Security vulnerabilities
- Performance implications
- Test coverage and quality
- Error handling
- Documentation and comments
- API design and naming
- Architectural fit

**What Not to Review Manually:**
- Code formatting (use Prettier, Black, etc.)
- Import organization
- Linting violations
- Simple typos

## Review Process

### Phase 1: Context Gathering (2-3 minutes)

Before diving into code, understand:
1. Read PR description and linked issue
2. Check PR size (>400 lines? Ask to split)
3. Review CI/CD status (tests passing?)
4. Understand the business requirement
5. Note any relevant architectural decisions

> For large diffs, pipe the diff through [`scripts/pr-analyzer.py`](scripts/pr-analyzer.py) (`git diff main...HEAD | python scripts/pr-analyzer.py`) to triage complexity and get a suggested review approach before reading.

### Phase 2: High-Level Review (5-10 minutes)

1. **Architecture & Design** - Does the solution fit the problem?
   - For significant changes, consult [Architecture Review Guide](reference/architecture-review-guide.md)
   - Check: SOLID principles, coupling/cohesion, anti-patterns
2. **Performance Assessment** - Are there performance concerns?
   - For performance-critical code, consult [Performance Review Guide](reference/performance-review-guide.md)
   - Check: Algorithm complexity, N+1 queries, memory usage
3. **File Organization** - Are new files in the right places?
4. **Testing Strategy** - Are there tests covering edge cases?

### Phase 3: Line-by-Line Review (10-20 minutes)

For each file, check:
- **Logic & Correctness** - Edge cases, off-by-one, null checks, race conditions
- **Security** - Input validation, injection risks, XSS, sensitive data
- **Performance** - N+1 queries, unnecessary loops, memory leaks
- **Maintainability** - Clear names, single responsibility, comments
- **Reuse** - Before accepting new code, search for existing utilities/helpers that could replace it. Check adjacent files and shared modules for similar patterns. See [Universal Quality Guide](reference/code-quality-universal.md) for anti-patterns like parameter sprawl, leaky abstractions, nested conditionals, stringly-typed code, TOCTOU, and no-op updates.

### Phase 4: Summary & Decision (2-3 minutes)

1. Summarize key concerns
2. Highlight what you liked
3. Make clear decision:
   - ✅ Approve
   - 💬 Comment (minor suggestions)
   - 🔄 Request Changes (must address)
4. Offer to pair if complex

## Review Techniques

### Technique 1: The Checklist Method

Use checklists for consistent reviews. See [Security Review Guide](reference/security-review-guide.md) for comprehensive security checklist.

### Technique 2: The Question Approach

Instead of stating problems, ask questions:

```markdown
❌ "This will fail if the list is empty."
✅ "What happens if `items` is an empty array?"

❌ "You need error handling here."
✅ "How should this behave if the API call fails?"
```

### Technique 3: Suggest, Don't Command

Use collaborative language:

```markdown
❌ "You must change this to use async/await"
✅ "Suggestion: async/await might make this more readable. What do you think?"

❌ "Extract this into a function"
✅ "This logic appears in 3 places. Would it make sense to extract it?"
```

### Technique 4: Differentiate Severity

Use labels to indicate priority:

- 🔴 `[blocking]` - Must fix before merge
- 🟡 `[important]` - Should fix, discuss if disagree
- 🟢 `[nit]` - Nice to have, not blocking
- 💡 `[suggestion]` - Alternative approach to consider
- 📚 `[learning]` - Educational comment, no action needed
- 🎉 `[praise]` - Good work, keep it up!

**Severity levels:** 🔴 / 🟡 / 🟢 are the three severity tiers used as the standard across all guides in this skill — 🔴 blocks the merge, 🟡 should be addressed, 🟢 is optional. The remaining markers (💡 / 📚 / 🎉) are non-blocking annotations.

## Language-Specific Guides

Consult the corresponding detailed guide based on the language being reviewed:

| Language/Framework | Reference File | Key Topics |
|-------------------|----------------|------------|
| **React** | [React Guide](reference/react.md) | Hooks, useEffect, React 19 Actions, RSC, Suspense, TanStack Query v5 |
| **Vue 3** | [Vue Guide](reference/vue.md) | Composition API, Reactivity System, Props/Emits, Watchers, Composables |
| **Angular 17+** | [Angular Guide](reference/angular.md) | Signals, Standalone, RxJS, Zoneless, Template Optimization, Testing, Route Guards, HttpInterceptor |
| **Rust** | [Rust Guide](reference/rust.md) | Ownership/Borrowing, Unsafe Review, Async Code, Cancellation Safety, Error Handling |
| **TypeScript** | [TypeScript Guide](reference/typescript.md) | Type Safety, async/await, Immutability, Testing, Module Resolution, TS 5.x |
| **Python** | [Python Guide](reference/python.md) | Mutable Default Arguments, Exception Handling, Class Attributes |
| **Django / DRF** | [Django Guide](reference/django.md) | Security Review, N+1 Queries, Serializer Anti-patterns, ViewSet, Async Views |
| **FastAPI** | [FastAPI Guide](reference/fastapi.md) | Depends, Pydantic v2 validation, async correctness, sessions/N+1, auth vs authorization, test-driven verification |
| **Java** | [Java Guide](reference/java.md) | Java 17/21 New Features, Spring Boot 3, Virtual Threads, Stream/Optional |
| **PHP** | [PHP Guide](reference/php.md) | PHP 8.x type system, PDO, security review, Composer, PHPUnit/PHPStan |
| **C# / .NET** | [C# Guide](reference/csharp.md) | C# 12 Features, Async Programming, EF Core Performance, ASP.NET Core, LINQ |
| **Go** | [Go Guide](reference/go.md) | Error Handling, goroutine/channel, context, Interface Design |
| **Kotlin / Android** | [Kotlin Guide](reference/kotlin.md) | Coroutines, Flow, Jetpack Compose, Null Safety, Memory Leaks, Architecture Patterns |
| **Swift / SwiftUI** | [Swift Guide](reference/swift.md) | Optionals, Swift Concurrency, Sendable/actors, SwiftUI property wrappers, value vs reference types, API design |
| **NestJS** | [NestJS Guide](reference/nestjs.md) | Dependency Injection, Layered Architecture, DTO Validation, Guard/Interceptor, Circular Dependencies |
| **Svelte / SvelteKit** | [Svelte Guide](reference/svelte.md) | Runes, Load Functions, Form Actions, Store Migration, SSR/CSR Boundaries |
| **C** | [C Guide](reference/c.md) | Pointers/Buffers, Memory Safety, UB, Secure Coding, Portability, Testing |
| **C++** | [C++ Guide](reference/cpp.md) | RAII, Smart Pointers, C++20/23, constexpr, Testing |
| **Zig** | [Zig Guide](reference/zig.md) | Allocators, error unions, defer/errdefer, comptime, C interop |
| **CSS/Less/Sass** | [CSS Guide](reference/css-less-sass.md) | Variable Conventions, !important, Performance Optimization, Responsive Design, Compatibility |
| **Qt** | [Qt Guide](reference/qt.md) | Object Model, Signals/Slots, Model/View, QML, Qt6 Migration, Testing |

## Cross-Cutting Guides

Language-agnostic patterns applicable to all code reviews:

| Topic | Reference File | Key Topics |
|-------|----------------|------------|
| **Architecture Review** | [Architecture Review Guide](reference/architecture-review-guide.md) | SOLID, anti-patterns, coupling/cohesion, dependency direction |
| **Performance Review** | [Performance Review Guide](reference/performance-review-guide.md) | Web Vitals, N+1, algorithm complexity, memory leaks, caching |
| **Security Review** | [Security Review Guide](reference/security-review-guide.md) | SQLi, XSS, CSRF, SSRF, IDOR, Command Injection, Cross-language Examples |
| **Universal Quality** | [Universal Quality Guide](reference/code-quality-universal.md) | Reuse audit, parameter sprawl, leaky abstractions, nested conditionals, stringly-typed code, TOCTOU, no-op updates, redundant state |
| **Common Bugs** | [Common Bugs Checklist](reference/common-bugs-checklist.md) | Language-specific bug patterns, common pitfalls |
| **SQL Injection Prevention** | [SQL Injection Guide](reference/cross-cutting/sql-injection-prevention.md) | Parameterized queries, ORM safety, 6 languages, dynamic identifiers, detection |
| **XSS Prevention** | [XSS Prevention Guide](reference/cross-cutting/xss-prevention.md) | Output encoding, CSP, 5 frameworks, input validation vs encoding, detection |
| **N+1 Queries** | [N+1 Queries Guide](reference/cross-cutting/n-plus-one-queries.md) | Eager loading, batch fetching, DataLoader, 5 languages, detection |
| **Error Handling** | [Error Handling Guide](reference/cross-cutting/error-handling-principles.md) | Fail fast, error hierarchy, 7 languages, anti-patterns, logging |
| **Async & Concurrency** | [Concurrency Guide](reference/cross-cutting/async-concurrency-patterns.md) | Goroutines, async/await, actors, structured concurrency, 7 languages |
| **Review Best Practices** | [Code Review Best Practices](reference/code-review-best-practices.md) | Communication, reviewer mindset, giving feedback, severity labels |

## Additional Resources

- [PR Review Template](assets/pr-review-template.md) - PR review comment template
- [Review Checklist](assets/review-checklist.md) - Quick reference checklist
