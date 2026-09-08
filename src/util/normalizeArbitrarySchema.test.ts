import type { SpecJsonSchemaRoot } from "../generated/spec/spec-v1/types/index.js";
import { describe, expect, it } from "../testHelpers/nodeTest.js";
import { normalizeArbitrarySchema } from "./normalizeArbitrarySchema.js";

describe("normalizeArbitrarySchema", () => {
  it("hoists an inline nested object into #/definitions and replaces it with a $ref", () => {
    const schema = {
      type: "object",
      title: "Root",
      properties: {
        metadata: {
          type: "object",
          properties: { name: { type: "string" } },
        },
      },
    } as unknown as SpecJsonSchemaRoot;

    const { schema: result, warnings } = normalizeArbitrarySchema(schema);

    expect(result.properties!.metadata).toEqual({ $ref: "#/definitions/Metadata" });
    expect(result.definitions!.Metadata).toMatchObject({ type: "object", title: "Metadata" });
    expect(warnings.length).toBe(1);
    expect(warnings[0]).toContain("inline nested object");
  });

  it("hoists inline array item objects", () => {
    const schema = {
      type: "object",
      title: "Root",
      properties: {
        schedule: {
          type: "array",
          items: { type: "object", properties: { cron: { type: "string" } } },
        },
      },
    } as unknown as SpecJsonSchemaRoot;

    const { schema: result } = normalizeArbitrarySchema(schema);
    expect(result.properties!.schedule.items).toEqual({ $ref: "#/definitions/ScheduleItems" });
    expect(result.definitions).toHaveProperty("ScheduleItems");
  });

  it("hoists an inline (non-$ref) oneOf branch that has a shape", () => {
    const schema = {
      type: "object",
      title: "Root",
      properties: {
        value: {
          oneOf: [{ type: "object", properties: { a: { type: "string" } } }, { type: "string" }],
        },
      },
    } as unknown as SpecJsonSchemaRoot;

    const { schema: result, warnings } = normalizeArbitrarySchema(schema);
    const branches = result.properties!.value.oneOf!;
    // The object branch is hoisted to a $ref; the primitive branch is left inline.
    expect(branches[0]).toEqual({ $ref: expect.stringContaining("#/definitions/") });
    expect(branches[1]).toEqual({ type: "string" });
    expect(warnings.some((w) => w.includes("oneOf branch"))).toBe(true);
  });

  it("leaves an empty object composition branch inline", () => {
    const schema = {
      type: "object",
      title: "Root",
      properties: { value: { oneOf: [{ type: "object" }, { type: "string" }] } },
    } as unknown as SpecJsonSchemaRoot;

    const { schema: result, warnings } = normalizeArbitrarySchema(schema);
    expect(result.properties!.value.oneOf).toEqual([{ type: "object" }, { type: "string" }]);
    expect(warnings).toHaveLength(0);
  });

  it("adds a missing object type when object keywords are present", () => {
    const schema = {
      type: "object",
      title: "Root",
      properties: {
        // no `type`, but has `properties` -> should become type: object then hoisted
        nested: { properties: { x: { type: "string" } } },
      },
    } as unknown as SpecJsonSchemaRoot;

    const { schema: result, warnings } = normalizeArbitrarySchema(schema);
    expect(result.properties!.nested).toEqual({ $ref: expect.stringContaining("#/definitions/") });
    expect(warnings.some((w) => w.includes('no "type"'))).toBe(true);
  });

  it("leaves conditional requiredness (allOf if/then, anyOf required) untouched", () => {
    const schema = {
      type: "object",
      title: "Root",
      properties: { a: { type: "string" }, b: { type: "string" } },
      // biome-ignore lint/suspicious/noThenProperty: `then` is a JSON Schema keyword, not a promise method.
      allOf: [{ if: { properties: { a: { const: "x" } } }, then: { required: ["b"] } }],
      anyOf: [{ required: ["a"] }, { required: ["b"] }],
    } as unknown as SpecJsonSchemaRoot;

    const { schema: result } = normalizeArbitrarySchema(schema);
    // The if/then and required-only branches must NOT be hoisted into definitions.
    // biome-ignore lint/suspicious/noThenProperty: `then` is a JSON Schema keyword, not a promise method.
    expect(result.allOf).toEqual([{ if: { properties: { a: { const: "x" } } }, then: { required: ["b"] } }]);
    expect(result.anyOf).toEqual([{ required: ["a"] }, { required: ["b"] }]);
    expect(Object.keys(result.definitions!)).toHaveLength(0);
  });

  it("normalizes $defs to definitions", () => {
    const schema = {
      type: "object",
      title: "Root",
      $defs: { Foo: { type: "object", properties: { x: { type: "string" } } } },
      properties: { foo: { $ref: "#/$defs/Foo" } },
    } as unknown as SpecJsonSchemaRoot;

    const { schema: result } = normalizeArbitrarySchema(schema);
    expect(result.definitions).toHaveProperty("Foo");
    expect(result.properties!.foo).toEqual({ $ref: "#/definitions/Foo" });
    expect((result as Record<string, unknown>).$defs).toBeUndefined();
  });

  it("preserves definitions when normalizing a colliding $defs name", () => {
    const schema = {
      type: "object",
      title: "Root",
      definitions: { Foo: { type: "string" } },
      $defs: { Foo: { type: "number" } },
      properties: { modern: { $ref: "#/$defs/Foo" }, legacy: { $ref: "#/definitions/Foo" } },
    } as unknown as SpecJsonSchemaRoot;

    const { schema: result } = normalizeArbitrarySchema(schema);
    expect(result.definitions!.Foo).toMatchObject({ type: "string" });
    expect(result.definitions!.Foo2).toMatchObject({ type: "number" });
    expect(result.properties!.modern).toEqual({ $ref: "#/definitions/Foo2" });
    expect(result.properties!.legacy).toEqual({ $ref: "#/definitions/Foo" });
  });

  it("adds a missing object type at the schema root", () => {
    const schema = { title: "Root", properties: { value: { type: "string" } } } as unknown as SpecJsonSchemaRoot;

    const { schema: result } = normalizeArbitrarySchema(schema);
    expect(result.type).toBe("object");
  });

  it("promotes deep local references to named definitions", () => {
    const schema = {
      type: "object",
      properties: { shared: { $ref: "#/definitions/Container/properties/value" } },
      definitions: {
        Container: { type: "object", properties: { value: { type: "string", title: "Shared Value" } } },
      },
    } as unknown as SpecJsonSchemaRoot;

    const { schema: result } = normalizeArbitrarySchema(schema);
    expect(result.properties!.shared).toEqual({ $ref: "#/definitions/SharedValue" });
    expect(result.definitions!.SharedValue).toMatchObject({ type: "string", title: "Shared Value" });
  });

  it("removes only dangling association targets", () => {
    const schema = {
      type: "object",
      properties: {
        packageId: {
          type: "string",
          "x-association-target": ["#/definitions/Package/id", "#/definitions/Missing/id"],
        },
      },
      definitions: { Package: { type: "object", properties: { id: { type: "string" } } } },
    } as unknown as SpecJsonSchemaRoot;

    const { schema: result } = normalizeArbitrarySchema(schema);
    expect(result.properties!.packageId["x-association-target"]).toEqual(["#/definitions/Package/id"]);
  });

  it("warns instead of failing strict mode for dangling association targets", () => {
    const schema = {
      type: "object",
      properties: {
        packageId: {
          type: "string",
          "x-association-target": ["#/definitions/Missing/id"],
        },
      },
    } as unknown as SpecJsonSchemaRoot;

    const { schema: result, warnings } = normalizeArbitrarySchema(schema, { strict: true });

    expect(result.properties!.packageId["x-association-target"]).toBeUndefined();
    expect(warnings).toEqual([expect.stringContaining("dangling x-association-target")]);
  });

  it("accepts object-level required-only anyOf constraints in strict mode", () => {
    const schema = {
      type: "object",
      properties: { a: { type: "string" }, b: { type: "string" } },
      anyOf: [{ required: ["a"] }, { required: ["b"] }],
    } as unknown as SpecJsonSchemaRoot;

    const { schema: result, warnings } = normalizeArbitrarySchema(schema, { strict: true });

    expect(result.anyOf).toEqual([{ required: ["a"] }, { required: ["b"] }]);
    expect(warnings).toHaveLength(0);
  });

  it("does not mutate the input schema", () => {
    const schema = {
      type: "object",
      title: "Root",
      properties: { metadata: { type: "object", properties: { name: { type: "string" } } } },
    } as unknown as SpecJsonSchemaRoot;
    const snapshot = JSON.parse(JSON.stringify(schema));

    normalizeArbitrarySchema(schema);
    expect(schema).toEqual(snapshot);
  });

  it("passes a convention-clean schema through without warnings", () => {
    const schema = {
      type: "object",
      title: "Root",
      properties: { metadata: { $ref: "#/definitions/Metadata" } },
      definitions: { Metadata: { type: "object", title: "Metadata", properties: { name: { type: "string" } } } },
    } as unknown as SpecJsonSchemaRoot;

    const { warnings } = normalizeArbitrarySchema(schema);
    expect(warnings).toHaveLength(0);
  });

  it("rejects convention violations in strict mode", () => {
    const schema = {
      type: "object",
      title: "Root",
      properties: { metadata: { type: "object", properties: { name: { type: "string" } } } },
    } as unknown as SpecJsonSchemaRoot;

    expect(() => normalizeArbitrarySchema(schema, { strict: true })).toThrow(
      'Strict schema mode rejected 1 unsupported schema construct(s). Set "generalConfig.schemaMode" to "tolerant"',
    );
  });

  it.each([
    {
      name: "a primitive composition branch",
      property: { oneOf: [{ type: "string" }, { type: "number" }] },
    },
    {
      name: "a conditional constraint branch",
      // biome-ignore lint/suspicious/noThenProperty: `then` is a JSON Schema keyword, not a promise method.
      property: { allOf: [{ if: { const: "x" }, then: { required: ["value"] } }] },
    },
    { name: "a free-form node", property: { description: "No renderable construct" } },
    { name: "a standalone const without a type", property: { const: "value" } },
    { name: "a standalone enum without a type", property: { enum: ["value"] } },
  ])("rejects $name in strict mode", ({ property }) => {
    const schema = {
      type: "object",
      title: "Root",
      properties: { value: property },
    } as unknown as SpecJsonSchemaRoot;

    expect(() => normalizeArbitrarySchema(schema, { strict: true })).toThrow("Strict schema mode rejected");
  });
});
