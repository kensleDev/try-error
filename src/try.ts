export type TryResult<T> = [T, null] | [null, Error];

export function ensureError(value: unknown): Error {
  if (value instanceof Error) return value;
  try {
    return new Error(typeof value === "string" ? value : JSON.stringify(value));
  } catch {
    return new Error("Unknown error");
  }
}

export function tryFn<TArgs extends any[], TReturn>(
  fn: (...args: TArgs) => Promise<TReturn> | TReturn
): (...args: TArgs) => Promise<TryResult<TReturn>> {
  return async (...args: TArgs): Promise<TryResult<TReturn>> => {
    try {
      return [await fn(...args), null];
    } catch (err) {
      return [null, ensureError(err)];
    }
  };
}

export function tryPromise<T>(promise: Promise<T>): Promise<TryResult<T>> {
  return tryFn(() => promise)();
}

export function tryCatch<T>(fn: () => T): TryResult<T> {
  try {
    return [fn(), null];
  } catch (err) {
    return [null, ensureError(err)];
  }
}

export function isSuccess<T>(result: TryResult<T>): result is [T, null] {
  return result[1] === null;
}

export function isError<T>(result: TryResult<T>): result is [null, Error] {
  return result[1] !== null;
}

export function isErrorOrNoData<T>(
  result: TryResult<T>,
  statusKey?: string
): Error | undefined {
  if (isError(result)) return result[1];
  if (result[0] === null) return new Error("No data");

  if (statusKey) {
    const value = result[0]?.[statusKey as keyof T];
    if (value === false) return new Error("No data");
    if (value === undefined) return new Error("No data");
    if (value === null) return new Error("No data");

    return undefined;
  }

  return undefined;
}

export function getFailureReason<T extends { message?: string }>(
  result: TryResult<T>
): string | undefined {
  const [value, error] = result;
  if (error) return error.message;
  if (!value) return "No result";
  if ("success" in value && value.success === false)
    return value.message ?? "Unsuccessful result";
}

export async function tryMap<T, R>(
  inputs: T[],
  fn: (item: T, index: number) => Promise<R> | R
): Promise<TryResult<R>[]> {
  const safeFn = tryFn(fn);
  return Promise.all(inputs.map((item, i) => safeFn(item, i)));
}

export function tryPipe<TArgs extends any[], TStep, TResult>(
  ...fns: [
    (...args: TArgs) => Promise<TStep> | TStep,
    ...((input: any) => Promise<any> | any)[]
  ]
): (...args: TArgs) => Promise<TryResult<TResult>> {
  return async (...args: TArgs) => {
    let result: any;
    let error: Error | null = null;
    try {
      result = await fns[0](...args);
      for (let i = 1; i < fns.length; i++) {
        result = await fns[i](result);
      }
      return [result as TResult, null];
    } catch (err) {
      error = ensureError(err);
      return [null, error];
    }
  };
}
