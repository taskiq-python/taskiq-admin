# React Code Review Guide

React review focus: Hooks rules, appropriateness of performance optimization, component design, and modern React 19/RSC patterns.

## Table of Contents

- [Basic Hooks Rules](#basic-hooks-rules)
- [useEffect Patterns](#useeffect-patterns)
- [useMemo / useCallback](#usememo--usecallback)
- [Component Design](#component-design)
- [Error Boundaries & Suspense](#error-boundaries--suspense)
- [Server Components (RSC)](#server-components-rsc)
- [React 19 Actions & Forms](#react-19-actions--forms)
- [Suspense & Streaming SSR](#suspense--streaming-ssr)
- [TanStack Query v5](#tanstack-query-v5)
- [Review Checklists](#review-checklists)

---

## Basic Hooks Rules

```tsx
// ❌ Conditionally calling Hooks — violates Hooks rules
function BadComponent({ isLoggedIn }) {
  if (isLoggedIn) {
    const [user, setUser] = useState(null) // Error!
  }
  return <div>...</div>
}

// ✅ Hooks must be called at the top level of the component
function GoodComponent({ isLoggedIn }) {
  const [user, setUser] = useState(null)
  if (!isLoggedIn) return <LoginPrompt />
  return <div>{user?.name}</div>
}
```

---

## useEffect Patterns

```tsx
// ❌ Missing or incomplete dependency array
function BadEffect({ userId }) {
  const [user, setUser] = useState(null)
  useEffect(() => {
    fetchUser(userId).then(setUser)
  }, []) // Missing userId dependency!
}

// ✅ Complete dependency array
function GoodEffect({ userId }) {
  const [user, setUser] = useState(null)
  useEffect(() => {
    let cancelled = false
    fetchUser(userId).then((data) => {
      if (!cancelled) setUser(data)
    })
    return () => {
      cancelled = true
    } // Cleanup function
  }, [userId])
}

// ❌ useEffect for derived state (anti-pattern)
function BadDerived({ items }) {
  const [filteredItems, setFilteredItems] = useState([])
  useEffect(() => {
    setFilteredItems(items.filter((i) => i.active))
  }, [items]) // Unnecessary effect + extra render
  return <List items={filteredItems} />
}

// ✅ Compute directly during render, or use useMemo
function GoodDerived({ items }) {
  const filteredItems = useMemo(() => items.filter((i) => i.active), [items])
  return <List items={filteredItems} />
}

// ❌ useEffect for event response
function BadEventEffect() {
  const [query, setQuery] = useState('')
  useEffect(() => {
    if (query) {
      analytics.track('search', { query }) // Should be in event handler
    }
  }, [query])
}

// ✅ Perform side effects in event handlers
function GoodEvent() {
  const [query, setQuery] = useState('')
  const handleSearch = (q: string) => {
    setQuery(q)
    analytics.track('search', { query: q })
  }
}
```

---

## useMemo / useCallback

```tsx
// ❌ Over-optimization — constants don't need useMemo
function OverOptimized() {
  const config = useMemo(() => ({ timeout: 5000 }), []) // Meaningless
  const handleClick = useCallback(() => {
    console.log('clicked')
  }, []) // Meaningless if not passed to a memo component
}

// ✅ Only optimize when needed
function ProperlyOptimized() {
  const config = { timeout: 5000 } // Define simple objects directly
  const handleClick = () => console.log('clicked')
}

// ❌ useCallback dependency always changes
function BadCallback({ data }) {
  // data is a new object every render, useCallback is ineffective
  const process = useCallback(() => {
    return data.map(transform)
  }, [data])
}

// ✅ useMemo + useCallback used with React.memo
const MemoizedChild = React.memo(function Child({ onClick, items }) {
  return <div onClick={onClick}>{items.length}</div>
})

function Parent({ rawItems }) {
  const items = useMemo(() => processItems(rawItems), [rawItems])
  const handleClick = useCallback(() => {
    console.log(items.length)
  }, [items])
  return <MemoizedChild onClick={handleClick} items={items} />
}
```

---

## Component Design

```tsx
// ❌ Defining components inside components — creates new component every render
function BadParent() {
  function ChildComponent() {
    // New function every render!
    return <div>child</div>
  }
  return <ChildComponent />
}

// ✅ Define components outside
function ChildComponent() {
  return <div>child</div>
}
function GoodParent() {
  return <ChildComponent />
}

// ❌ Props are always new object references
function BadProps() {
  return (
    <MemoizedComponent
      style={{ color: 'red' }} // New object every render
      onClick={() => {}} // New function every render
    />
  )
}

// ✅ Stable references
const style = { color: 'red' }
function GoodProps() {
  const handleClick = useCallback(() => {}, [])
  return <MemoizedComponent style={style} onClick={handleClick} />
}
```

---

## Error Boundaries & Suspense

```tsx
// ❌ No error boundary
function BadApp() {
  return (
    <Suspense fallback={<Loading />}>
      <DataComponent /> {/* Error crashes the entire app */}
    </Suspense>
  )
}

// ✅ Error Boundary wrapping Suspense
function GoodApp() {
  return (
    <ErrorBoundary fallback={<ErrorUI />}>
      <Suspense fallback={<Loading />}>
        <DataComponent />
      </Suspense>
    </ErrorBoundary>
  )
}
```

---

## Server Components (RSC)

```tsx
// ❌ Using client features in a Server Component
// app/page.tsx (Server Component by default)
function BadServerComponent() {
  const [count, setCount] = useState(0);  // Error! No hooks in RSC
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}

// ✅ Extract interactive logic to a Client Component
// app/counter.tsx
'use client';
function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}

// app/page.tsx (Server Component)
async function GoodServerComponent() {
  const data = await fetchData();  // Can directly await
  return (
    <div>
      <h1>{data.title}</h1>
      <Counter />  {/* Client component */}
    </div>
  );
}

// ❌ 'use client' placed incorrectly — entire tree becomes client
// layout.tsx
'use client';  // This makes all child components client components
export default function Layout({ children }) { ... }

// ✅ Only use 'use client' for components that need interactivity
// Isolate client logic to leaf components
```

---

## React 19 Actions & Forms

React 19 introduced the Actions system and new form handling Hooks, simplifying async operations and optimistic updates.

### useActionState

```tsx
// ❌ Traditional approach: multiple state variables
function OldForm() {
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState(null)

  const handleSubmit = async (formData: FormData) => {
    setIsPending(true)
    setError(null)
    try {
      const result = await submitForm(formData)
      setData(result)
    } catch (e) {
      setError(e.message)
    } finally {
      setIsPending(false)
    }
  }
}

// ✅ React 19: useActionState for unified management
import { useActionState } from 'react'

function NewForm() {
  const [state, formAction, isPending] = useActionState(
    async (prevState, formData: FormData) => {
      try {
        const result = await submitForm(formData)
        return { success: true, data: result }
      } catch (e) {
        return { success: false, error: e.message }
      }
    },
    { success: false, data: null, error: null }
  )

  return (
    <form action={formAction}>
      <input name="email" />
      <button disabled={isPending}>
        {isPending ? 'Submitting...' : 'Submit'}
      </button>
      {state.error && <p className="error">{state.error}</p>}
    </form>
  )
}
```

### useFormStatus

```tsx
// ❌ Prop drilling form status
function BadSubmitButton({ isSubmitting }) {
  return <button disabled={isSubmitting}>Submit</button>
}

// ✅ useFormStatus accesses parent <form> status (no props needed)
import { useFormStatus } from 'react-dom'

function SubmitButton() {
  const { pending, data, method, action } = useFormStatus()
  // Note: Must be used in a child component inside <form>
  return (
    <button disabled={pending}>{pending ? 'Submitting...' : 'Submit'}</button>
  )
}

// ❌ useFormStatus called in the same component as form — doesn't work
function BadForm() {
  const { pending } = useFormStatus() // Cannot get status here!
  return (
    <form action={action}>
      <button disabled={pending}>Submit</button>
    </form>
  )
}

// ✅ useFormStatus must be in a child component of the form
function GoodForm() {
  return (
    <form action={action}>
      <SubmitButton /> {/* useFormStatus is called inside here */}
    </form>
  )
}
```

### useOptimistic

```tsx
// ❌ Waiting for server response before updating UI
function SlowLike({ postId, likes }) {
  const [likeCount, setLikeCount] = useState(likes)
  const [isPending, setIsPending] = useState(false)

  const handleLike = async () => {
    setIsPending(true)
    const newCount = await likePost(postId) // Wait...
    setLikeCount(newCount)
    setIsPending(false)
  }
}

// ✅ useOptimistic for instant feedback, auto-rollback on failure
import { useOptimistic } from 'react'

function FastLike({ postId, likes }) {
  const [optimisticLikes, addOptimisticLike] = useOptimistic(
    likes,
    (currentLikes, increment: number) => currentLikes + increment
  )

  const handleLike = async () => {
    addOptimisticLike(1) // Update UI immediately
    try {
      await likePost(postId) // Sync in background
    } catch {
      // React auto-rolls back to original likes value
    }
  }

  return <button onClick={handleLike}>{optimisticLikes} likes</button>
}
```

### Server Actions (Next.js 15+)

```tsx
// ❌ Client-side API call
'use client'
function ClientForm() {
  const handleSubmit = async (formData: FormData) => {
    const res = await fetch('/api/submit', {
      method: 'POST',
      body: formData,
    })
    // ...
  }
}

// ✅ Server Action + useActionState
// actions.ts
;('use server')
export async function createPost(prevState: any, formData: FormData) {
  const title = formData.get('title')
  await db.posts.create({ title })
  revalidatePath('/posts')
  return { success: true }
}

// form.tsx
;('use client')
import { createPost } from './actions'

function PostForm() {
  const [state, formAction, isPending] = useActionState(createPost, null)
  return (
    <form action={formAction}>
      <input name="title" />
      <SubmitButton />
    </form>
  )
}
```

---

## Suspense & Streaming SSR

Suspense and Streaming are core features of React 18+, widely used in frameworks like Next.js 15 in 2025.

### Basic Suspense

```tsx
// ❌ Traditional loading state management
function OldComponent() {
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchData()
      .then(setData)
      .finally(() => setIsLoading(false))
  }, [])

  if (isLoading) return <Spinner />
  return <DataView data={data} />
}

// ✅ Suspense declarative loading state
function NewComponent() {
  return (
    <Suspense fallback={<Spinner />}>
      <DataView />{' '}
      {/* Internally uses use() or Suspense-compatible data fetching */}
    </Suspense>
  )
}
```

### Multiple Independent Suspense Boundaries

```tsx
// ❌ Single boundary — all content loads together
function BadLayout() {
  return (
    <Suspense fallback={<FullPageSpinner />}>
      <Header />
      <MainContent /> {/* Slow */}
      <Sidebar /> {/* Fast */}
    </Suspense>
  )
}

// ✅ Independent boundaries — each part streams independently
function GoodLayout() {
  return (
    <>
      <Header /> {/* Shown immediately */}
      <div className="flex">
        <Suspense fallback={<ContentSkeleton />}>
          <MainContent /> {/* Loads independently */}
        </Suspense>
        <Suspense fallback={<SidebarSkeleton />}>
          <Sidebar /> {/* Loads independently */}
        </Suspense>
      </div>
    </>
  )
}
```

### Next.js 15 Streaming

```tsx
// app/page.tsx - Automatic Streaming
export default async function Page() {
  // This await does not block the entire page
  const data = await fetchSlowData()
  return <div>{data}</div>
}

// app/loading.tsx - Automatic Suspense boundary
export default function Loading() {
  return <Skeleton />
}
```

### use() Hook (React 19)

```tsx
// ✅ Read Promise in component
import { use } from 'react'

function Comments({ commentsPromise }) {
  const comments = use(commentsPromise) // Automatically triggers Suspense
  return (
    <ul>
      {comments.map((c) => (
        <li key={c.id}>{c.text}</li>
      ))}
    </ul>
  )
}

// Parent component creates Promise, child component consumes
function Post({ postId }) {
  const commentsPromise = fetchComments(postId) // Don't await
  return (
    <article>
      <PostContent id={postId} />
      <Suspense fallback={<CommentsSkeleton />}>
        <Comments commentsPromise={commentsPromise} />
      </Suspense>
    </article>
  )
}
```

---

## TanStack Query v5

TanStack Query is the most popular data fetching library in the React ecosystem, v5 is the current stable version.

### Basic Configuration

```tsx
// ❌ Incorrect default configuration
const queryClient = new QueryClient() // Default config may not be suitable

// ✅ Production recommended configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // Data considered fresh for 5 minutes
      gcTime: 1000 * 60 * 30, // Garbage collected after 30 minutes (renamed in v5)
      retry: 3,
      refetchOnWindowFocus: false, // Decide based on requirements
    },
  },
})
```

### queryOptions (v5 new)

```tsx
// ❌ Duplicated queryKey and queryFn definitions
function Component1() {
  const { data } = useQuery({
    queryKey: ['users', userId],
    queryFn: () => fetchUser(userId),
  })
}

function prefetchUser(queryClient, userId) {
  queryClient.prefetchQuery({
    queryKey: ['users', userId], // Duplicated!
    queryFn: () => fetchUser(userId), // Duplicated!
  })
}

// ✅ queryOptions unified definition, type-safe
import { queryOptions } from '@tanstack/react-query'

const userQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: ['users', userId],
    queryFn: () => fetchUser(userId),
  })

function Component1({ userId }) {
  const { data } = useQuery(userQueryOptions(userId))
}

function prefetchUser(queryClient, userId) {
  queryClient.prefetchQuery(userQueryOptions(userId))
}

// getQueryData is also type-safe
const user = queryClient.getQueryData(userQueryOptions(userId).queryKey)
```

### Common Pitfalls

```tsx
// ❌ staleTime of 0 causes excessive requests
useQuery({
  queryKey: ['data'],
  queryFn: fetchData,
  // staleTime defaults to 0, refetches on every component mount
})

// ✅ Set a reasonable staleTime
useQuery({
  queryKey: ['data'],
  queryFn: fetchData,
  staleTime: 1000 * 60, // Won't refetch within 1 minute
})

// ❌ Using unstable references in queryFn
function BadQuery({ filters }) {
  useQuery({
    queryKey: ['items'], // queryKey doesn't include filters!
    queryFn: () => fetchItems(filters), // filters changes won't trigger refetch
  })
}

// ✅ queryKey includes all parameters that affect data
function GoodQuery({ filters }) {
  useQuery({
    queryKey: ['items', filters], // filters is part of queryKey
    queryFn: () => fetchItems(filters),
  })
}
```

### useSuspenseQuery

> **Important limitation**: useSuspenseQuery differs significantly from useQuery, understand its limitations before choosing.

#### useSuspenseQuery Limitations

| Feature           | useQuery             | useSuspenseQuery         |
| ----------------- | -------------------- | ------------------------ |
| `enabled` option  | ✅ Supported         | ❌ Not supported         |
| `placeholderData` | ✅ Supported         | ❌ Not supported         |
| `data` type       | `T \| undefined`     | `T` (guaranteed)         |
| Error handling    | `error` property     | Throws to Error Boundary |
| Loading state     | `isLoading` property | Suspends to Suspense     |

#### Alternative for Unsupported enabled

```tsx
// ❌ Using useQuery + enabled for conditional queries
function BadSuspenseQuery({ userId }) {
  const { data } = useSuspenseQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
    enabled: !!userId, // useSuspenseQuery doesn't support enabled!
  })
}

// ✅ Component composition for conditional rendering
function GoodSuspenseQuery({ userId }) {
  // useSuspenseQuery guarantees data is T, not T | undefined
  const { data } = useSuspenseQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
  })
  return <UserProfile user={data} />
}

function Parent({ userId }) {
  if (!userId) return <NoUserSelected />
  return (
    <Suspense fallback={<UserSkeleton />}>
      <GoodSuspenseQuery userId={userId} />
    </Suspense>
  )
}
```

#### Error Handling Differences

```tsx
// ❌ useSuspenseQuery has no error property
function BadErrorHandling() {
  const { data, error } = useSuspenseQuery({...});
  if (error) return <Error />;  // error is always null!
}

// ✅ Use Error Boundary for error handling
function GoodErrorHandling() {
  return (
    <ErrorBoundary fallback={<ErrorMessage />}>
      <Suspense fallback={<Loading />}>
        <DataComponent />
      </Suspense>
    </ErrorBoundary>
  );
}

function DataComponent() {
  // Errors throw to Error Boundary
  const { data } = useSuspenseQuery({
    queryKey: ['data'],
    queryFn: fetchData,
  });
  return <Display data={data} />;
}
```

#### When to Choose useSuspenseQuery

```tsx
// ✅ Suitable scenarios:
// 1. Data is always needed (unconditional query)
// 2. Component must have data to render
// 3. Using React 19's Suspense pattern
// 4. Server components + client hydration

// ❌ Unsuitable scenarios:
// 1. Conditional queries (triggered by user action)
// 2. Need placeholderData or initial data
// 3. Need to handle loading/error state within component
// 4. Multiple queries with dependencies

// ✅ Multiple independent queries with useSuspenseQueries
function MultipleQueries({ userId }) {
  const [userQuery, postsQuery] = useSuspenseQueries({
    queries: [
      { queryKey: ['user', userId], queryFn: () => fetchUser(userId) },
      { queryKey: ['posts', userId], queryFn: () => fetchPosts(userId) },
    ],
  })
  // Both queries execute in parallel, component renders after both complete
  return <Profile user={userQuery.data} posts={postsQuery.data} />
}
```

### Optimistic Updates (v5 Simplified)

```tsx
// ❌ Manually managing cache for optimistic updates (complex)
const mutation = useMutation({
  mutationFn: updateTodo,
  onMutate: async (newTodo) => {
    await queryClient.cancelQueries({ queryKey: ['todos'] })
    const previousTodos = queryClient.getQueryData(['todos'])
    queryClient.setQueryData(['todos'], (old) => [...old, newTodo])
    return { previousTodos }
  },
  onError: (err, newTodo, context) => {
    queryClient.setQueryData(['todos'], context.previousTodos)
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ['todos'] })
  },
})

// ✅ v5 simplified: use variables for optimistic UI
function TodoList() {
  const { data: todos } = useQuery(todosQueryOptions)
  const { mutate, variables, isPending } = useMutation({
    mutationFn: addTodo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] })
    },
  })

  return (
    <ul>
      {todos?.map((todo) => (
        <TodoItem key={todo.id} todo={todo} />
      ))}
      {/* Optimistically display the todo being added */}
      {isPending && <TodoItem todo={variables} isOptimistic />}
    </ul>
  )
}
```

### v5 State Field Changes

```tsx
// v4: isLoading indicates first load or subsequent fetch
// v5: isPending means no data, isLoading = isPending && isFetching

const { data, isPending, isFetching, isLoading } = useQuery({...});

// isPending: No data in cache (first load)
// isFetching: Request in progress (including background refresh)
// isLoading: isPending && isFetching (first load in progress)

// ❌ Direct migration from v4 code
if (isLoading) return <Spinner />;  // Behavior may differ in v5

// ✅ Be explicit about intent
if (isPending) return <Spinner />;  // Show loading when no data
// or
if (isLoading) return <Spinner />;  // During first load
```

---

## Review Checklists

### Hooks Rules

- [ ] Hooks called at the top level of component/custom Hook
- [ ] No Hooks called in conditions/loops
- [ ] useEffect dependency array is complete
- [ ] useEffect has cleanup function (subscriptions/timers/requests)
- [ ] No useEffect for computing derived state

### Performance Optimization (Principle of Moderation)

- [ ] useMemo/useCallback only used when truly needed
- [ ] React.memo paired with stable prop references
- [ ] No child components defined inside components
- [ ] No new objects/functions created in JSX (unless passed to non-memo components)
- [ ] Long lists use virtualization (react-window/react-virtual)

### Component Design

- [ ] Component has single responsibility, under 200 lines
- [ ] Logic and presentation separated (Custom Hooks)
- [ ] Clear Props interface, using TypeScript
- [ ] Avoid Props Drilling (consider Context or composition)

### State Management

- [ ] State kept close to where it's needed (minimal necessary scope)
- [ ] Complex state uses useReducer
- [ ] Global state uses Context or state library
- [ ] Avoid unnecessary state (derived > stored)

### Error Handling

- [ ] Critical areas have Error Boundary
- [ ] Suspense used with Error Boundary
- [ ] Async operations have error handling

### Server Components (RSC)

- [ ] 'use client' only for components needing interactivity
- [ ] Server Component doesn't use Hooks/event handlers
- [ ] Client components kept at leaf nodes as much as possible
- [ ] Data fetching done in Server Component

### React 19 Forms

- [ ] Use useActionState instead of multiple useState
- [ ] useFormStatus called in form child component
- [ ] useOptimistic not used for critical business (payments, etc.)
- [ ] Server Action correctly marked with 'use server'

### Suspense & Streaming

- [ ] Divide Suspense boundaries based on UX requirements
- [ ] Each Suspense has a corresponding Error Boundary
- [ ] Provide meaningful fallback (skeleton > spinner)
- [ ] Avoid awaiting slow data at layout level

### TanStack Query

- [ ] queryKey includes all parameters that affect data
- [ ] Set reasonable staleTime (not default 0)
- [ ] useSuspenseQuery doesn't use enabled
- [ ] Invalidate related queries after mutation success
- [ ] Understand isPending vs isLoading difference

### Testing

- [ ] Use @testing-library/react
- [ ] Use screen to query elements
- [ ] Use userEvent instead of fireEvent
- [ ] Prefer \*ByRole queries
- [ ] Test behavior, not implementation details
