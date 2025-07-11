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

export function isTrySuccess<T>(result: TryResult<T>): result is [T, null] {
	return result[1] === null;
}

export function isTryError<T>(result: TryResult<T>): result is [null, Error] {
	return result[0] === null;
}

export function isFailure<T extends Record<string, any>>(
	result: TryResult<T>,
	statusKey?: keyof T
): boolean;
export function isFailure<T extends Record<string, any>>(
	result: TryResult<T>,
	statusKey: null
): boolean;
export function isFailure<T extends Record<string, any>>(
	result: TryResult<T>,
	statusKey: keyof T | null = "success"
): boolean {
	const [value, error] = result;
	return (
		error !== null ||
		value == null ||
		(statusKey !== null && statusKey in value && value[statusKey] === false)
	);
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
