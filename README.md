# try-error

Elegant tuple-based error handling utilities for TypeScript, inspired by Rust's `Result<T, E>` pattern.

## 🔍 Philosophy

This utility module encourages a pattern of handling asynchronous and synchronous operations through predictable tuples, inspired by Rust's `Result<T, E>` pattern.

**Our approach complements existing error handling strategies** — exceptions are still allowed and meaningful when appropriate. This library provides an alternative pattern where thrown errors are captured and surfaced as the second value of a result tuple, enabling safe branching and structured error handling while maintaining the flexibility to throw when needed.

Similar to Rust's `Result<T, E>`, we model results as `[T, null]` or `[null, Error]`, enabling developers to destructure outcomes, check for failure via helpers, and respond clearly. This pattern ensures callers can handle errors gracefully without unexpected crashes, while still allowing you to throw exceptions when they make sense for your use case.

Whether you prefer traditional try/catch blocks, functional Result types, or a hybrid approach, this library gives you the tools to handle errors in a way that fits your coding style and project needs.

## 🚀 Install

```bash
npm install @julian-i/try-error
```

## 🔧 Usage Guidelines

- **`tryPromise(promise)`** - Use for async expressions
- **`tryCatch(() => syncWork())`** - Use for synchronous expressions
- **`tryMap(inputs, fn)`** - Use to apply error-safe operations across an array
- **`tryPipe(...fns)`** - Use to compose a pipeline of safe steps that short-circuit on failure
- **`isTryError`** - Type guard to check if a result is an error

## 📖 Examples

### Basic Usage

```typescript
import { tryPromise, tryCatch } from "@julian-i/try-error";

// Async error handling
const [data, error] = await tryPromise(
  fetch("https://api.example.com/data").then(r => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  })
);

if (error) {
  console.error("Failed:", error.message);
  return;
}

console.log("Success:", data);

// Synchronous error handling
const [value, parseError] = tryCatch(() => {
  return JSON.parse("invalid json");
});

if (parseError) {
  console.error("Parse failed:", parseError.message);
  return;
}

console.log("Parsed:", value);
```

### Array Processing

```typescript
import { tryMap } from "@julian-i/try-error";

const urls = ["https://api1.com", "https://api2.com", "https://api3.com"];

const results = await tryMap(urls, async (url) => {
  const response = await fetch(url);
  return response.json();
});

// results is TryResult<Data>[] - each item is either [data, null] or [null, Error]
results.forEach(([data, error], index) => {
  if (error) {
    console.error(`Failed to fetch ${urls[index]}:`, error.message);
  } else {
    console.log(`Successfully fetched ${urls[index]}:`, data);
  }
});
```

### Pipeline Composition

```typescript
import { tryPipe } from "@julian-i/try-error";

const processUserData = tryPipe(
  async (userId: string) => {
    const response = await fetch(`/api/users/${userId}`);
    return response.json();
  },
  (userData) => {
    if (!userData.email) throw new Error("User has no email");
    return userData;
  },
  async (userData) => {
    const processed = await processUser(userData);
    return { ...userData, processed };
  }
);

const [result, error] = await processUserData("123");
if (error) {
  console.error("Pipeline failed:", error.message);
} else {
  console.log("Pipeline succeeded:", result);
}
```

## 📚 API Reference

### Types

```typescript
type TryResult<T> = [T, null] | [null, Error];
```

### Core Functions

#### `tryPromise<T>(promise)`

Wraps a promise to return a `TryResult<T>`.

```typescript
function tryPromise<T>(promise: Promise<T>): Promise<TryResult<T>>;
```

#### `tryCatch<T>(fn)`

Wraps a synchronous function to return a `TryResult<T>`.

```typescript
function tryCatch<T>(fn: () => T): TryResult<T>;
```

### Utility Functions

#### `isTryError<T>(result)`

Type guard to check if a result is an error.

```typescript
function isTryError<T>(result: TryResult<T>): result is [null, Error];
```

### Collection Functions

#### `tryMap<T, R>(inputs, fn)`

Applies a safe function across an array of inputs.

```typescript
function tryMap<T, R>(
  inputs: T[],
  fn: (item: T, index: number) => Promise<R> | R
): Promise<TryResult<R>[]>;
```

### Composition Functions

#### `tryPipe<TArgs, TStep, TResult>(...fns)`

Composes a pipeline of functions that short-circuits on failure.

```typescript
function tryPipe<TArgs extends any[], TStep, TResult>(
  ...fns: [
    (...args: TArgs) => Promise<TStep> | TStep,
    ...((input: any) => Promise<any> | any)[]
  ]
): (...args: TArgs) => Promise<TryResult<TResult>>;
```

### Helper Functions

#### `ensureError(value)`

Ensures a value is converted to an Error instance.

```typescript
function ensureError(value: unknown): Error;
```

## 📋 Changelog

### Version 0.2.0 - Breaking Changes

**Removed Functions:**

The following helper functions have been removed from the library. Direct error checking is more idiomatic and provides better error context:

- **`tryFn(fn)`** - Removed. Use `tryCatch()` for synchronous operations or `tryPromise()` for async operations instead.
- **`isTrySuccess(result)`** - Removed. Check directly with `if (error)` or `if (!error)` instead.
- **`getFailureReason(result)`** - Removed. Access the error directly from the tuple: `const [_, error] = result`.
- **`isFailure(result)`** - Removed. Check directly with `if (error)` instead.

**Migration Guide:**

```typescript
// Before (v0.1.x)
const result = tryFn(() => riskyOperation());
if (isTrySuccess(result)) {
  // handle success
} else if (isFailure(result)) {
  const error = getFailureReason(result);
  console.error(error);
}

// After (v0.2.x)
const [data, error] = tryCatch(() => riskyOperation());
if (error) {
  console.error(error);
} else {
  // handle success with data
}
```

**What's Kept:**

- ✅ `isTryError(result)` - Still available as a useful type guard for TypeScript narrowing

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT
