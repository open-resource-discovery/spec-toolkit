import type { SpecJsonSchemaRoot } from "../generated/spec/spec-v1/types/index.js";
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
      allOf: [{ if: { properties: { a: { const: "x" } } }, then: { required: ["b"] } }],
      anyOf: [{ required: ["a"] }, { required: ["b"] }],
    } as unknown as SpecJsonSchemaRoot;

    const { schema: result } = normalizeArbitrarySchema(schema);
    // The if/then and required-only branches must NOT be hoisted into definitions.
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
    expect((result as Record<string, unknown>).$defs).toBeUndefined();
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
});
