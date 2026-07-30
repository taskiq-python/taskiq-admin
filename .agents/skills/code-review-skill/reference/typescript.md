# TypeScript/JavaScript Code Review Guide

> TypeScript code review guide, covering type system, generics, conditional types, strict mode, async/await patterns, and other core topics.

## Table of Contents

- [Type Safety Fundamentals](#type-safety-fundamentals)
- [Generic Patterns](#generic-patterns)
- [Advanced Types](#advanced-types)
- [Strict Mode Configuration](#strict-mode-configuration)
- [Async Handling](#async-handling)
- [Immutability](#immutability)
- [ESLint Rules](#eslint-rules)
- [Testing](#testing)
- [Module Resolution](#module-resolution)
- [TS 4.9+ / 5.x New Features](#ts-49--5x-new-features)
- [Review Checklist](#review-checklist)

---

## Type Safety Fundamentals

### Avoid Using any

```typescript
// ❌ Using any defeats type safety
function processData(data: any) {
  return data.value // No type checking, may crash at runtime
}

// ✅ Use proper types
interface DataPayload {
  value: string
}
function processData(data: DataPayload) {
  return data.value
}

// ✅ Use unknown + type guards for unknown types
function processUnknown(data: unknown) {
  if (typeof data === 'object' && data !== null && 'value' in data) {
    return (data as { value: string }).value
  }
  throw new Error('Invalid data')
}
```

### Type Narrowing

```typescript
// ❌ Unsafe type assertion
function getLength(value: string | string[]) {
  return (value as string[]).length // Error if it's a string
}

// ✅ Use type guards
function getLength(value: string | string[]): number {
  if (Array.isArray(value)) {
    return value.length
  }
  return value.length
}

// ✅ Use in operator
interface Dog {
  bark(): void
}
interface Cat {
  meow(): void
}

function speak(animal: Dog | Cat) {
  if ('bark' in animal) {
    animal.bark()
  } else {
    animal.meow()
  }
}
```

### Literal Types and as const

```typescript
// ❌ Type too broad
const config = {
  endpoint: '/api',
  method: 'GET'  // type is string
};

// ✅ Use as const for literal types
const config = {
  endpoint: '/api',
  method: 'GET'
} as const;  // method type is 'GET'

// ✅ Used for function parameters
function request(method: 'GET' | 'POST', url: string) { ... }
request(config.method, config.endpoint);  // Correct!
```

---

## Generic Patterns

### Basic Generics

```typescript
// ❌ Duplicated code
function getFirstString(arr: string[]): string | undefined {
  return arr[0]
}
function getFirstNumber(arr: number[]): number | undefined {
  return arr[0]
}

// ✅ Use generics
function getFirst<T>(arr: T[]): T | undefined {
  return arr[0]
}
```

### Generic Constraints

```typescript
// ❌ Generic without constraints, cannot access properties
function getProperty<T>(obj: T, key: string) {
  return obj[key] // Error: cannot index
}

// ✅ Use keyof constraint
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key]
}

const user = { name: 'Alice', age: 30 }
getProperty(user, 'name') // Return type is string
getProperty(user, 'age') // Return type is number
getProperty(user, 'foo') // Error: 'foo' not in keyof User
```

### Generic Default Values

```typescript
// ✅ Provide reasonable default types
interface ApiResponse<T = unknown> {
  data: T;
  status: number;
  message: string;
}

// Can omit generic parameter
const response: ApiResponse = { data: null, status: 200, message: 'OK' };
// Or specify it
const userResponse: ApiResponse<User> = { ... };
```

### Common Utility Types

```typescript
// ✅ Make good use of built-in utility types
interface User {
  id: number
  name: string
  email: string
}

type PartialUser = Partial<User> // All properties optional
type RequiredUser = Required<User> // All properties required
type ReadonlyUser = Readonly<User> // All properties readonly
type UserKeys = keyof User // 'id' | 'name' | 'email'
type NameOnly = Pick<User, 'name'> // { name: string }
type WithoutId = Omit<User, 'id'> // { name: string; email: string }
type UserRecord = Record<string, User> // { [key: string]: User }
```

---

## Advanced Types

### Conditional Types

```typescript
// ✅ Return different types based on input type
type IsString<T> = T extends string ? true : false

type A = IsString<string> // true
type B = IsString<number> // false

// ✅ Extract array element type
type ElementType<T> = T extends (infer U)[] ? U : never

type Elem = ElementType<string[]> // string

// ✅ Extract function return type (built-in ReturnType)
type MyReturnType<T> = T extends (...args: any[]) => infer R ? R : never
```

### Mapped Types

```typescript
// ✅ Transform all properties of an object type
type Nullable<T> = {
  [K in keyof T]: T[K] | null
}

interface User {
  name: string
  age: number
}

type NullableUser = Nullable<User>
// { name: string | null; age: number | null }

// ✅ Add prefix
type Getters<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K]
}

type UserGetters = Getters<User>
// { getName: () => string; getAge: () => number }
```

### Template Literal Types

```typescript
// ✅ Type-safe event names
type EventName = 'click' | 'focus' | 'blur'
type HandlerName = `on${Capitalize<EventName>}`
// 'onClick' | 'onFocus' | 'onBlur'

// ✅ API route types
type ApiRoute = `/api/${string}`
const route: ApiRoute = '/api/users' // OK
const badRoute: ApiRoute = '/users' // Error
```

### Discriminated Unions

```typescript
// ✅ Use discriminant property for type safety
type Result<T, E> = { success: true; data: T } | { success: false; error: E }

function handleResult(result: Result<User, Error>) {
  if (result.success) {
    console.log(result.data.name) // TypeScript knows data exists
  } else {
    console.log(result.error.message) // TypeScript knows error exists
  }
}

// ✅ Redux Action pattern
type Action =
  | { type: 'INCREMENT'; payload: number }
  | { type: 'DECREMENT'; payload: number }
  | { type: 'RESET' }

function reducer(state: number, action: Action): number {
  switch (action.type) {
    case 'INCREMENT':
      return state + action.payload // payload type is known
    case 'DECREMENT':
      return state - action.payload
    case 'RESET':
      return 0 // No payload here
  }
}
```

---

## Strict Mode Configuration

### Recommended tsconfig.json

```json
{
  "compilerOptions": {
    // ✅ Must-enable strict options
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "useUnknownInCatchVariables": true,

    // ✅ Additional recommended options
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "exactOptionalPropertyTypes": true,
    "noPropertyAccessFromIndexSignature": true
  }
}
```

### Impact of noUncheckedIndexedAccess

```typescript
// tsconfig: "noUncheckedIndexedAccess": true

const arr = [1, 2, 3]
const first = arr[0] // Type is number | undefined

// ❌ Direct usage may error
console.log(first.toFixed(2)) // Error: may be undefined

// ✅ Check first
if (first !== undefined) {
  console.log(first.toFixed(2))
}

// ✅ Or use non-null assertion (when certain)
console.log(arr[0]!.toFixed(2))
```

---

## Async Handling

### Promise Error Handling

```typescript
// ❌ Not handling async errors
async function fetchUser(id: string) {
  const response = await fetch(`/api/users/${id}`)
  return response.json() // Network errors not handled
}

// ✅ Handle errors properly
async function fetchUser(id: string): Promise<User> {
  try {
    const response = await fetch(`/api/users/${id}`)
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    return await response.json()
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to fetch user: ${error.message}`)
    }
    throw error
  }
}
```

### Promise.all vs Promise.allSettled

```typescript
// ❌ Promise.all fails all if one fails
async function fetchAllUsers(ids: string[]) {
  const users = await Promise.all(ids.map(fetchUser))
  return users // One failure fails all
}

// ✅ Promise.allSettled gets all results
async function fetchAllUsers(ids: string[]) {
  const results = await Promise.allSettled(ids.map(fetchUser))

  const users: User[] = []
  const errors: Error[] = []

  for (const result of results) {
    if (result.status === 'fulfilled') {
      users.push(result.value)
    } else {
      errors.push(result.reason)
    }
  }

  return { users, errors }
}
```

### Race Condition Handling

```typescript
// ❌ Race condition: old request may overwrite new request
function useSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])

  useEffect(() => {
    fetch(`/api/search?q=${query}`)
      .then((r) => r.json())
      .then(setResults) // Old request may return later!
  }, [query])
}

// ✅ Use AbortController
function useSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])

  useEffect(() => {
    const controller = new AbortController()

    fetch(`/api/search?q=${query}`, { signal: controller.signal })
      .then((r) => r.json())
      .then(setResults)
      .catch((e) => {
        if (e.name !== 'AbortError') throw e
      })

    return () => controller.abort()
  }, [query])
}
```

---

## Immutability

### Readonly and ReadonlyArray

```typescript
// ❌ Mutable parameter may be accidentally modified
function processUsers(users: User[]) {
  users.sort((a, b) => a.name.localeCompare(b.name)) // Modifies original array!
  return users
}

// ✅ Use readonly to prevent modification
function processUsers(users: readonly User[]): User[] {
  return [...users].sort((a, b) => a.name.localeCompare(b.name))
}

// ✅ Deep readonly
type DeepReadonly<T> = {
  readonly [K in keyof T]: T[K] extends object ? DeepReadonly<T[K]> : T[K]
}
```

### Immutable Function Parameters

```typescript
// ✅ Use as const and readonly to protect data
function createConfig<T extends readonly string[]>(routes: T) {
  return routes
}

const routes = createConfig(['home', 'about', 'contact'] as const)
// Type is readonly ['home', 'about', 'contact']
```

---

## ESLint Rules

### Recommended @typescript-eslint Rules

```javascript
// eslint.config.js (flat config, typescript-eslint v8)
import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  eslint.configs.recommended,
  // Ruleset requiring type information, corresponds to old recommended-requiring-type-checking
  tseslint.configs.recommendedTypeChecked,
  tseslint.configs.strictTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        // Let typed rules automatically find the corresponding tsconfig
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // ✅ Type safety
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',

      // ✅ Best practices
      '@typescript-eslint/explicit-function-return-type': 'warn',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/no-misused-promises': 'error',

      // ✅ Code style
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',
    },
  }
)
```

### Common ESLint Error Fixes

```typescript
// ❌ no-floating-promises: Promise must be handled
async function save() { ... }
save();  // Error: Unhandled Promise

// ✅ Handle explicitly
await save();
// or
save().catch(console.error);
// or explicitly ignore
void save();

// ❌ no-misused-promises: Cannot use Promise in non-async position
const items = [1, 2, 3];
items.forEach(async (item) => {  // Error!
  await processItem(item);
});

// ✅ Use for...of
for (const item of items) {
  await processItem(item);
}
// or Promise.all
await Promise.all(items.map(processItem));
```

---

---

## Testing

### Vitest vs Jest Choice

```typescript
// ✅ New projects recommend Vitest (integrates with Vite ecosystem, native ESM support)
// vitest.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
    },
  },
})

// ✅ Existing Jest projects can keep it, note config differences
// jest.config.ts
import type { Config } from 'jest'

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
}
export default config
```

### Type Testing (tsd / expect-type)

```typescript
// ✅ Use expect-type to verify type inference
import { expectTypeOf } from 'vitest'

function getFirst<T>(arr: T[]): T | undefined {
  return arr[0]
}

it('should infer correct return type', () => {
  const result = getFirst([1, 2, 3])
  expectTypeOf(result).toEqualTypeOf<number | undefined>()
})

// ✅ Use expect-type to verify function signature
const fn = (a: string, b: number) => a.repeat(b)
expectTypeOf(fn).parameters.toEqualTypeOf<[string, number]>()
expectTypeOf(fn).returns.toBeString()

// ❌ Type errors will be caught at compile time
const result = getFirst(['a', 'b'])
// @ts-expect-error: Type mismatch
expectTypeOf(result).toEqualTypeOf<number>()
```

### Snapshot Testing Best Practices

```typescript
// ✅ Snapshots suitable for: stable output structures, config objects, error messages
it('should match serialized config', () => {
  const config = createAppConfig()
  expect(config).toMatchSnapshot()
})

// ❌ Avoid: large objects, dynamic data, random values
it('should not snapshot large payloads', () => {
  const hugePayload = { users: generateRandomUsers(1000) }
  // Too-long snapshots are hard to review, unclear intent on change
})

// ✅ Use inline snapshot for small fragments
it('should generate correct error message', () => {
  expect(formatError('INVALID_INPUT')).toMatchInlineSnapshot(
    `"Error: Invalid input provided"`
  )
})

// ✅ Use snapshot property matchers for dynamic values
it('should match user with generated id', () => {
  expect(createUser('Alice')).toMatchSnapshot({
    id: expect.any(String),
    createdAt: expect.any(Date),
  })
})
```

### Mock Strategies

```typescript
// ✅ Vitest: vi.mock auto-hoists
import { vi, describe, it, expect } from 'vitest'

vi.mock('./api', () => ({
  fetchUser: vi.fn().mockResolvedValue({ id: 1, name: 'Alice' }),
}))

it('should display user', async () => {
  const { fetchUser } = await import('./api')
  const user = await fetchUser('1')
  expect(user.name).toBe('Alice')
})

// ✅ Jest: jest.mock also auto-hoists
jest.mock('./database', () => ({
  query: jest.fn().mockResolvedValue([{ id: 1 }]),
}))

// ❌ Avoid partial mocks — testing the mock rather than real behavior
jest.mock('./utils', () => ({
  ...jest.requireActual('./utils'),
  calculateTotal: jest.fn(), // Other functions are real, this one is fake
}))
```

### Testing Utilities

```typescript
// ✅ Use testing-library for DOM testing
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

it('should submit form', async () => {
  render(<LoginForm />);
  await userEvent.type(screen.getByLabelText('Email'), 'alice@example.com');
  await userEvent.click(screen.getByRole('button', { name: 'Submit' }));
  expect(screen.getByText('Welcome, Alice!')).toBeInTheDocument();
});

// ✅ Use MSW for API mocking (Mock Service Worker)
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  http.get('/api/users/:id', ({ params }) => {
    return HttpResponse.json({ id: params.id, name: 'Alice' });
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

---

## Module Resolution

### ESM vs CJS Differences and Pitfalls

```typescript
// ❌ CJS style not available in ESM
// package.json: "type": "module"
const fs = require('fs') // Error: require is not defined
module.exports = { foo: 'bar' } // Error: module is not defined

// ✅ Correct ESM syntax
import fs from 'node:fs'
export const foo = 'bar'

// ✅ Get __dirname in ESM
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// ❌ Dynamic require in ESM
const moduleName = 'lodash'
const _ = require(moduleName) // Error!

// ✅ ESM dynamic import
const _ = await import(moduleName)
```

### tsconfig paths and Path Aliases

```json
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@components/*": ["./src/components/*"],
      "@utils/*": ["./src/utils/*"]
    }
  }
}
```

```typescript
// ✅ Before using aliases
import { Button } from '../../components/ui/Button'
import { formatDate } from '../../../utils/date'

// ✅ After using aliases — clearer and less likely to break on file moves
import { Button } from '@components/ui/Button'
import { formatDate } from '@utils/date'
```

```typescript
// ⚠️ tsconfig paths only affect TS compilation, not runtime
// Need to pair with bundler (Vite, webpack) or tsx alias resolution

// vite.config.ts
import { resolve } from 'node:path'

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
})

// ⚠️ When publishing npm packages, tsconfig paths don't auto-resolve
// Need tsc-alias or tsconfig-paths to handle
```

### package.json exports field

```json
// package.json
{
  "name": "my-library",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts"
    },
    "./utils": {
      "import": "./dist/utils.mjs",
      "require": "./dist/utils.cjs",
      "types": "./dist/utils.d.ts"
    },
    "./*": "./dist/*"
  }
}
```

```typescript
// ✅ Consumer usage
import { foo } from 'my-library' // Resolves to "." condition
import { bar } from 'my-library/utils' // Resolves to "./utils" condition

// ❌ Paths without exports mapping cannot be accessed
import { secret } from 'my-library/internal' // Error!
```

### Dynamic import() and Code Splitting

```typescript
// ✅ Conditionally load modules
async function loadChartLibrary() {
  if (typeof window === 'undefined') return null; // SSR skip
  const { Chart } = await import('chart.js');
  return Chart;
}

// ✅ React lazy-loaded components
const AdminPanel = lazy(() => import('./AdminPanel'));
// Use with Suspense
<Suspense fallback={<Loading />}>
  <AdminPanel />
</Suspense>

// ✅ With error handling
const AdminPanel = lazy(() =>
  import('./AdminPanel').catch(() => ({
    default: () => <ErrorFallback />,
  }))
);
```

---

## TS 4.9+ / 5.x New Features

### satisfies Keyword (TS 4.9+)

```typescript
// ❌ Without satisfies: type too broad
const palette = {
  red: '#ff0000',
  green: '#00ff00',
  blue: '#0000ff',
}
// palette.red type is string, lost the precise value '#ff0000'

// ✅ satisfies preserves literal types while validating structure
const palette = {
  red: '#ff0000',
  green: '#00ff00',
  blue: '#0000ff',
} satisfies Record<string, `#${string}`>

// palette.red type is '#ff0000' (not string)
// But adding new properties still validates the format
```

```typescript
// ✅ satisfies used to validate object conforms to interface
interface UserConfig {
  theme: 'light' | 'dark'
  locale: string
}

const config = {
  theme: 'dark',
  locale: 'en-US',
} satisfies UserConfig
// config.theme type is 'dark' (not 'light' | 'dark')
// All properties pass satisfies type check
```

### const Type Parameters (TS 5.0+)

```typescript
// ❌ Before: needed as const assertion
function getRoutes<T extends readonly string[]>(routes: T) {
  return routes
}
const routes = getRoutes(['home', 'about'] as const)

// ✅ TS 5.0+: const type parameters
function getRoutes<const T extends readonly string[]>(routes: T) {
  return routes
}
const routes = getRoutes(['home', 'about'])
// routes type is readonly ['home', 'about']
```

```typescript
// ✅ Real-world scenario: type-safe config objects
declare function createConfig<const T extends Record<string, unknown>>(
  config: T
): T

const config = createConfig({
  api: { url: 'https://api.example.com', version: 2 },
  features: { newDashboard: true },
})
// config.api.url type is 'https://api.example.com' (literal)
```

### Decorators (Stage 3 Decorators, TS 5.0+)

```typescript
// ✅ Stage 3 decorators (TS 5.0+, experimentalDecorators no longer needed)
function logged<This, Args extends unknown[], Return>(
  target: (this: This, ...args: Args) => Return,
  context: ClassMethodDecoratorContext
) {
  return function (this: This, ...args: Args): Return {
    console.log(`Calling ${String(context.name)} with`, args)
    return target.apply(this, args)
  }
}

class Calculator {
  @logged
  add(a: number, b: number): number {
    return a + b
  }
}

// Output: Calling add with [1, 2]
new Calculator().add(1, 2)
```

```typescript
// ⚠️ Stage 3 decorators differ from legacy experimentalDecorators
// Legacy: requires "experimentalDecorators": true in tsconfig
// New (TS 5.0+): supported by default, no extra config needed

// ❌ Legacy decorator signature (still supported but marked as legacy)
function deprecated<T extends { new (...args: any[]): {} }>(constructor: T) {
  return class extends constructor {
    /* ... */
  }
}

// ✅ New decorator distinguishes context by type
function sealed<T extends { new (...args: any[]): {} }>(
  target: T,
  context: ClassDecoratorContext
) {
  // context.kind === 'class'
}
```

### using Declarations (Explicit Resource Management, TS 5.2+)

```typescript
// ✅ Use Symbol.dispose for automatic cleanup
class TempFile implements Disposable {
  private path: string

  constructor() {
    this.path = `/tmp/file-${Date.now()}`
  }

  write(data: string) {
    /* ... */
  }

  [Symbol.dispose]() {
    // Automatic cleanup — regardless of how function exits (normal/exception)
    fs.unlinkSync(this.path)
    console.log(`Cleaned up: ${this.path}`)
  }
}

function processFile() {
  using file = new TempFile() // using declaration
  file.write('data')
  // file[Symbol.dispose]() called automatically when scope ends
}
```

```typescript
// ✅ AsyncDisposable for async resources (TS 5.2+)
class DatabaseConnection implements AsyncDisposable {
  private db: sqlite3.Database

  async connect() {
    this.db = new sqlite3.Database(':memory:')
  }

  async [Symbol.asyncDispose]() {
    await this.db.close()
  }
}

async function query() {
  await using conn = new DatabaseConnection() // await using
  await conn.connect()
  // await conn[Symbol.asyncDispose]() called automatically when scope ends
}
```

### Enum Improvements (TS 5.0+)

```typescript
// ✅ All enums are now union enums (TS 5.0+)
enum Color {
  Red = 'RED',
  Green = 'GREEN',
}

// Before: Color behaved inconsistently as a type
// Now: Color fully acts as a string literal union type
const color: Color = Color.Red // TypeScript now has better inference for Color type
```

## Review Checklist

### Type System

- [ ] No use of `any` (use `unknown` + type guards instead)
- [ ] Interfaces and type definitions are complete and meaningfully named
- [ ] Generics used to improve code reusability
- [ ] Union types have correct type narrowing
- [ ] Good use of utility types (Partial, Pick, Omit, etc.)

### Generics

- [ ] Generics have appropriate constraints (extends)
- [ ] Generic parameters have reasonable default values
- [ ] Avoid over-generalization (KISS principle)

### Strict Mode

- [ ] tsconfig.json has strict: true enabled
- [ ] noUncheckedIndexedAccess enabled
- [ ] No use of @ts-ignore (use @ts-expect-error instead)

### Async Code

- [ ] async functions have error handling
- [ ] Promise rejections are properly handled
- [ ] No floating promises (unhandled Promises)
- [ ] Concurrent requests use Promise.all or Promise.allSettled
- [ ] Race conditions handled with AbortController

### Immutability

- [ ] No direct mutation of function parameters
- [ ] Use spread operator to create new objects/arrays
- [ ] Consider using readonly modifier

### ESLint

- [ ] Using @typescript-eslint/recommended
- [ ] No ESLint warnings or errors
- [ ] Using consistent-type-imports
