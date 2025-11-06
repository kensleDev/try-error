export type TryResult<T> = [T, null] | [null, Error];

export function ensureError(value: unknown): Error {
	if (value instanceof Error) return value;
	try {
		return new Error(typeof value === "string" ? value : JSON.stringify(value));
	} catch {
		return new Error("Unknown error");
	}
}

export async function tryPromise<T>(promise: Promise<T>): Promise<TryResult<T>> {
	try {
		return [await promise, null];
	} catch (err) {
		return [null, ensureError(err)];
	}
}

export function tryCatch<T>(fn: () => T): TryResult<T> {
	try {
		return [fn(), null];
	} catch (err) {
		return [null, ensureError(err)];
	}
}

export function isTryError<T>(result: TryResult<T>): result is [null, Error] {
	return result[0] === null;
}

export async function tryMap<T, R>(
	inputs: T[],
	fn: (item: T, index: number) => Promise<R> | R
): Promise<TryResult<R>[]> {
	return Promise.all(inputs.map(async (item, i) => {
		try {
			return [await fn(item, i), null] as TryResult<R>;
		} catch (err) {
			return [null, ensureError(err)] as TryResult<R>;
		}
	}));
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
