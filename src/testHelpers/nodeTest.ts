import assert from "node:assert/strict";
import { AsyncLocalStorage } from "node:async_hooks";
import path from "node:path";
import nodeTest, {
  after,
  afterEach,
  before,
  beforeEach,
  describe,
  mock as nodeMock,
  snapshot as nodeSnapshot,
  type TestContext,
  type TestOptions,
} from "node:test";
import { isDeepStrictEqual } from "node:util";

const testContext = new AsyncLocalStorage<TestContext>();

nodeSnapshot.setResolveSnapshotPath((testFilePath) => {
  if (!testFilePath) {
    throw new Error("Snapshot assertions require a test file path.");
  }
  const relativeTestPath = path.relative(path.resolve(".test-dist"), testFilePath);
  return path.resolve("src", relativeTestPath.replace(/\.js$/, ".ts.snapshot"));
});

type TestCallback = (context: TestContext) => void | Promise<void>;

function runTest(name: string, optionsOrCallback: TestOptions | TestCallback, callback?: TestCallback) {
  const options = typeof optionsOrCallback === "function" ? undefined : optionsOrCallback;
  const testCallback = typeof optionsOrCallback === "function" ? optionsOrCallback : callback;

  if (!testCallback) {
    return nodeTest(name, options);
  }

  return nodeTest(name, options, (context) => testContext.run(context, () => testCallback(context)));
}

function each(cases: readonly unknown[]) {
  // biome-ignore lint/suspicious/noExplicitAny: test table callbacks accept heterogeneous arguments
  return (name: string, callback: (...args: any[]) => void | Promise<void>): void => {
    for (const entry of cases) {
      const args = Array.isArray(entry) ? entry : [entry];
      const caseName =
        entry && typeof entry === "object" && !Array.isArray(entry)
          ? name.replace(/\$([A-Za-z0-9_]+)/g, (placeholder, key: string) =>
              Object.hasOwn(entry, key) ? String((entry as Record<string, unknown>)[key]) : placeholder,
            )
          : name;
      runTest(
        caseName.replace(/%[sdifjo]/g, () => String(args[0])),
        () => callback(...args),
      );
    }
  };
}

export const test = Object.assign(runTest, { each });
export const it = test;
export const beforeAll = before;
export const afterAll = after;
export { afterEach, beforeEach, describe };

const asymmetricMatcher = Symbol("asymmetricMatcher");
type AsymmetricMatcher = { [asymmetricMatcher]: (actual: unknown) => boolean };

function isAsymmetricMatcher(value: unknown): value is AsymmetricMatcher {
  return typeof value === "object" && value !== null && asymmetricMatcher in value;
}

function matches(actual: unknown, expected: unknown): boolean {
  if (isAsymmetricMatcher(expected)) {
    return expected[asymmetricMatcher](actual);
  }
  if (!containsAsymmetricMatcher(expected)) {
    return isDeepStrictEqual(actual, expected);
  }
  if (Array.isArray(expected)) {
    return (
      Array.isArray(actual) &&
      expected.length === actual.length &&
      expected.every((item, index) => matches(actual[index], item))
    );
  }
  if (expected && typeof expected === "object") {
    if (!actual || typeof actual !== "object") {
      return false;
    }
    return Object.entries(expected).every(([key, value]) => matches((actual as Record<string, unknown>)[key], value));
  }
  return Object.is(actual, expected);
}

function containsAsymmetricMatcher(value: unknown): boolean {
  if (isAsymmetricMatcher(value)) {
    return true;
  }
  if (Array.isArray(value)) {
    return value.some(containsAsymmetricMatcher);
  }
  return Boolean(value && typeof value === "object" && Object.values(value).some(containsAsymmetricMatcher));
}

function partiallyMatches(actual: unknown, expected: unknown): boolean {
  if (isAsymmetricMatcher(expected)) {
    return expected[asymmetricMatcher](actual);
  }
  if (expected && typeof expected === "object") {
    if (!actual || typeof actual !== "object") {
      return false;
    }
    return Object.entries(expected).every(([key, value]) =>
      partiallyMatches((actual as Record<string, unknown>)[key], value),
    );
  }
  return isDeepStrictEqual(actual, expected);
}

function snapshot(value: unknown): void {
  const context = testContext.getStore();
  if (!context) {
    throw new Error("Snapshot assertions must run inside a test.");
  }
  context.assert.snapshot(value);
}

function normalizeInlineSnapshot(value: string): string {
  const lines = value
    .replace(/^\n/, "")
    .replace(/\n\s*$/, "")
    .split("\n");
  const indentation = Math.min(
    ...lines.filter((line) => line.trim()).map((line) => line.match(/^\s*/)?.[0].length ?? 0),
  );
  const normalized = lines.map((line) => line.slice(indentation)).join("\n");
  return normalized.startsWith('"') && normalized.endsWith('"') ? normalized.slice(1, -1) : normalized;
}

function thrownValue(callback: () => unknown): unknown {
  try {
    callback();
  } catch (error) {
    return error instanceof Error ? error.message : error;
  }
  assert.fail("Expected function to throw");
}

// biome-ignore lint/suspicious/noExplicitAny: matchers intentionally accept arbitrary runtime values
function createMatchers(actual: any, inverted = false): any {
  const check = (condition: boolean, message?: string): void => {
    const result = inverted ? !condition : condition;
    message === undefined ? assert.ok(result) : assert.ok(result, message);
  };
  const calls = (): Array<{ arguments: unknown[] }> => actual?.mock?.calls ?? [];

  return {
    get not() {
      return createMatchers(actual, !inverted);
    },
    get rejects() {
      return {
        async toThrow(expected: string | RegExp) {
          const error = await actual.then(
            () => undefined,
            (reason: unknown) => reason,
          );
          check(
            error !== undefined &&
              (expected instanceof RegExp ? expected.test(String(error)) : String(error).includes(expected)),
          );
        },
        async toMatchObject(expected: object) {
          const error = await actual.then(
            () => undefined,
            (reason: unknown) => reason,
          );
          check(error !== undefined && partiallyMatches(error, expected));
        },
      };
    },
    toBe(expected: unknown) {
      check(Object.is(actual, expected));
    },
    toEqual(expected: unknown) {
      check(matches(actual, expected));
    },
    toContain(expected: unknown) {
      check(actual.includes(expected));
    },
    toContainEqual(expected: unknown) {
      check(actual.some((item: unknown) => matches(item, expected)));
    },
    toContainValidationMessage(message: string, count = 1) {
      check(Array.isArray(actual) && actual.filter((result) => result.message.includes(message)).length === count);
    },
    toHaveBeenCalled() {
      check(calls().length > 0);
    },
    toHaveBeenCalledWith(...expected: unknown[]) {
      check(calls().some((call) => matches(call.arguments, expected)));
    },
    toHaveLength(expected: number) {
      check(actual.length === expected);
    },
    toHaveProperty(property: string, ...expectedValues: [] | [unknown]) {
      let value = actual;
      const found = property.split(".").every((key) => {
        if (value === null || value === undefined || !Object.hasOwn(value, key)) {
          return false;
        }
        value = value[key];
        return true;
      });
      check(found && (expectedValues.length === 0 || matches(value, expectedValues[0])));
    },
    toBeDefined() {
      check(actual !== undefined);
    },
    toBeUndefined() {
      check(actual === undefined);
    },
    toBeInstanceOf(expected: abstract new (...args: never[]) => object) {
      check(actual instanceof expected);
    },
    toBeGreaterThan(expected: number) {
      check(actual > expected);
    },
    toBeLessThan(expected: number) {
      check(actual < expected);
    },
    toMatch(expected: string | RegExp) {
      check(typeof expected === "string" ? actual.includes(expected) : expected.test(actual));
    },
    toMatchObject(expected: object) {
      check(partiallyMatches(actual, expected));
    },
    toThrow(expected?: string | RegExp) {
      const error = thrownValue(actual);
      check(
        expected === undefined ||
          (expected instanceof RegExp ? expected.test(String(error)) : String(error).includes(expected)),
      );
    },
    toMatchSnapshot() {
      if (inverted) {
        throw new Error("Negated snapshots are not supported.");
      }
      snapshot(actual);
    },
    toMatchInlineSnapshot(expected: string) {
      check(actual === normalizeInlineSnapshot(expected));
    },
    toThrowErrorMatchingInlineSnapshot(expected: string) {
      check(thrownValue(actual) === normalizeInlineSnapshot(expected));
    },
    toThrowErrorMatchingSnapshot() {
      snapshot(thrownValue(actual));
    },
  };
}

export const expect = Object.assign((actual: unknown) => createMatchers(actual), {
  arrayContaining: (expected: unknown[]): AsymmetricMatcher => ({
    [asymmetricMatcher]: (actual) =>
      Array.isArray(actual) &&
      expected.every((expectedItem) => actual.some((actualItem) => matches(actualItem, expectedItem))),
  }),
  objectContaining: (expected: object): AsymmetricMatcher => ({
    [asymmetricMatcher]: (actual) => partiallyMatches(actual, expected),
  }),
  stringContaining: (expected: string): AsymmetricMatcher => ({
    [asymmetricMatcher]: (actual) => typeof actual === "string" && actual.includes(expected),
  }),
});

type MockedFunction = ReturnType<typeof nodeMock.method> & {
  // biome-ignore lint/suspicious/noExplicitAny: mock implementations preserve arbitrary function signatures
  mockImplementation(implementation: (...args: any[]) => any): MockedFunction;
  mockResolvedValue(value: unknown): MockedFunction;
  mockReturnValue(value: unknown): MockedFunction;
  mockRestore(): void;
};

function spyOn(target: object, methodName: string): MockedFunction {
  const spy = nodeMock.method(target, methodName as never) as MockedFunction;
  spy.mockImplementation = (implementation) => {
    spy.mock.mockImplementation(implementation);
    return spy;
  };
  spy.mockResolvedValue = (value) => spy.mockImplementation(() => Promise.resolve(value));
  spy.mockReturnValue = (value) => spy.mockImplementation(() => value);
  spy.mockRestore = () => spy.mock.restore();
  return spy;
}

export const mock = {
  restoreAll: () => nodeMock.restoreAll(),
  spyOn,
};
