import { describe, expect, it } from "vitest";
import {
  TryResult,
  ensureError,
  isTryError,
  tryCatch,
  tryMap,
  tryPipe,
  tryPromise,
} from "./try";

describe("ensureError", () => {
  it("should return Error instance as-is", () => {
    const error = new Error("test error");
    expect(ensureError(error)).toBe(error);
  });

  it("should convert string to Error", () => {
    const result = ensureError("string error");
    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe("string error");
  });

  it("should convert object to Error", () => {
    const obj = { key: "value" };
    const result = ensureError(obj);
    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe('{"key":"value"}');
  });

  it("should handle circular references", () => {
    const obj: any = { key: "value" };
    obj.self = obj;
    const result = ensureError(obj);
    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe("Unknown error");
  });
});

describe("tryPromise", () => {
  it("should handle successful promise", async () => {
    const promise = Promise.resolve("success");
    const result = await tryPromise(promise);
    expect(result).toEqual(["success", null]);
  });

  it("should handle rejected promise", async () => {
    const promise = Promise.reject(new Error("promise error"));
    const result = await tryPromise(promise);
    expect(result[0]).toBeNull();
    expect(result[1]).toBeInstanceOf(Error);
    expect(result[1]!.message).toBe("promise error");
  });
});

describe("tryCatch", () => {
  it("should handle successful synchronous function", () => {
    const fn = () => "success";
    const result = tryCatch(fn);
    expect(result).toEqual(["success", null]);
  });

  it("should handle synchronous errors", () => {
    const fn = () => {
      throw new Error("sync error");
    };
    const result = tryCatch(fn);
    expect(result[0]).toBeNull();
    expect(result[1]).toBeInstanceOf(Error);
    expect(result[1]!.message).toBe("sync error");
  });
});

describe("isTryError", () => {
  it("should return true for error result", () => {
    const result: TryResult<string> = [null, new Error("error")];
    expect(isTryError(result)).toBe(true);
  });

  it("should return false for successful result", () => {
    const result: TryResult<string> = ["success", null];
    expect(isTryError(result)).toBe(false);
  });
});

describe("tryMap", () => {
  it("should map over array successfully", async () => {
    const inputs = [1, 2, 3];
    const fn = (x: number) => x * 2;
    const results = await tryMap(inputs, fn);
    expect(results).toEqual([
      [2, null],
      [4, null],
      [6, null],
    ]);
  });

  it("should handle errors in mapping function", async () => {
    const inputs = [1, -1, 3];
    const fn = (x: number) => {
      if (x < 0) throw new Error("negative number");
      return x * 2;
    };
    const results = await tryMap(inputs, fn);
    expect(results[0]).toEqual([2, null]);
    expect(results[1][0]).toBeNull();
    expect(results[1][1]!.message).toBe("negative number");
    expect(results[2]).toEqual([6, null]);
  });

  it("should handle async mapping function", async () => {
    const inputs = [1, 2, 3];
    const fn = async (x: number) => x * 2;
    const results = await tryMap(inputs, fn);
    expect(results).toEqual([
      [2, null],
      [4, null],
      [6, null],
    ]);
  });
});

describe("tryPipe", () => {
  it("should pipe functions successfully", async () => {
    const pipe = tryPipe(
      (x: number) => x * 2,
      (x: number) => x + 1,
      (x: number) => x.toString()
    );
    const result = await pipe(5);
    expect(result).toEqual(["11", null]);
  });

  it("should handle async functions in pipe", async () => {
    const pipe = tryPipe(
      async (x: number) => x * 2,
      async (x: number) => x + 1,
      (x: number) => x.toString()
    );
    const result = await pipe(5);
    expect(result).toEqual(["11", null]);
  });

  it("should short-circuit on error", async () => {
    const pipe = tryPipe(
      (x: number) => x * 2,
      (x: number) => {
        if (x > 10) throw new Error("too big");
        return x + 1;
      },
      (x: number) => x.toString()
    );
    const result = await pipe(10);
    expect(result[0]).toBeNull();
    expect(result[1]!.message).toBe("too big");
  });

  it("should handle single function", async () => {
    const pipe = tryPipe((x: number) => x * 2);
    const result = await pipe(5);
    expect(result).toEqual([10, null]);
  });
});
