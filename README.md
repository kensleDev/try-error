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

- **`tryFn(fn)`** - Use when you want a **reusable wrapper** for a function (sync or async)
- **`tryPromise(promise)`** - Use for one-off async expressions
- **`tryCatch(() => syncWork())`** - Use for one-off synchronous expressions
- **`tryMap(inputs, fn)`** - Use to apply a safe function across an array
- **`tryPipe(...fns)`** - Use to compose a pipeline of safe steps that short-circuit on failure
- **`isFailure`, `isTrySuccess`, `getFailureReason`** - Use for ergonomic result handling

## 📖 Examples

### Basic Usage

```typescript
import {
  tryFn,
  tryPromise,
  tryCatch,
  isSuccess,
  isErrorOrNoData,
  getFailureReason,
} from "@julian-i/try-error";

// Wrapping a function for reuse
const safeFetch = tryFn(async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
});

// Using the wrapped function
const [data, error] = await safeFetch("https://api.example.com/data");
if (isSuccess([data, error])) {
  console.log("Success:", data);
} else {
  console.error("Failed:", getFailureReason([data, error]));
}

// One-off promise handling
const [result, err] = await tryPromise(fetch("https://api.example.com/data"));

// Synchronous error handling
const [value, error] = tryCatch(() => {
  return JSON.parse("invalid json");
});

// Validating API responses
const [apiResponse, apiError] = await apiCall();
const validationError = isErrorOrNoData([apiResponse, apiError], "success");
if (validationError) {
  console.error("API validation failed:", validationError.message);
}
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

### Advanced Error Handling

```typescript
import { isFailure, getFailureReason } from "@julian-i/try-error";

// Check for various failure conditions
const [apiResult, apiError] = await safeApiCall();

if (isFailure([apiResult, apiError])) {
  // This handles: null/undefined results, thrown errors, or {success: false} objects
  console.error("Operation failed:", getFailureReason([apiResult, apiError]));
}

// Custom status key
const [customResult, customError] = await customApiCall();
if (isFailure([customResult, customError], "status")) {
  // Checks for {status: false} in addition to other failure conditions
  console.error("Custom operation failed");
}
```

## 📚 API Reference

### Types

```typescript
type TryResult<T> = [T, null] | [null, Error];
```

### Core Functions

#### `tryFn<TArgs, TReturn>(fn)`

Creates a reusable wrapper function that returns `TryResult<TReturn>`.

```typescript
function tryFn<TArgs extends any[], TReturn>(
  fn: (...args: TArgs) => Promise<TReturn> | TReturn
): (...args: TArgs) => Promise<TryResult<TReturn>>;
```

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

#### `isSuccess<T>(result)`

Type guard to check if a result is successful.

```typescript
function isSuccess<T>(result: TryResult<T>): result is [T, null];
```

#### `isError<T>(result)`

Type guard to check if a result is an error.

```typescript
function isError<T>(result: TryResult<T>): result is [null, Error];
```

#### `isErrorOrNoData<T>(result, statusKey?)`

Checks for error conditions or missing data, returning an Error instance or undefined.

```typescript
function isErrorOrNoData<T>(
  result: TryResult<T>,
  statusKey?: string
): Error | undefined;
```

This function is useful for validating API responses that might have error states or missing data:

```typescript
// Check for errors or null data
const [data, error] = await fetchUserData();
const validationError = isErrorOrNoData([data, error]);
if (validationError) {
  console.error("Validation failed:", validationError.message);
  return;
}

// Check for errors or failed status
const [response, responseError] = await apiCall();
const statusError = isErrorOrNoData([response, responseError], "success");
if (statusError) {
  console.error("API call failed:", statusError.message);
  return;
}
```

#### `isFailure<T>(result, statusKey?)`

Checks for various failure conditions including custom status keys.

```typescript
function isFailure<T extends Record<string, any>>(
  result: TryResult<T>,
  statusKey?: keyof T | null
): boolean;
```

#### `getFailureReason<T>(result)`

Extracts a human-readable failure reason from a result.

```typescript
function getFailureReason<T extends { message?: string }>(
  result: TryResult<T>
): string | undefined;
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

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT
