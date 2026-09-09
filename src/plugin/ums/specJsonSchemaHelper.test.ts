import { describe, expect, it } from "../../testHelpers/nodeTest.js";
import { isObjectLevelAnyOfRequired } from "./specJsonSchemaHelper.js";
import type { SpecJsonSchemaWithUmsSupport } from "./types.js";

describe("isObjectLevelAnyOfRequired", () => {
  it("returns true when every anyOf branch requires exactly one property", () => {
    const schema = {
      type: "object",
      anyOf: [{ required: ["ordId"] }, { required: ["url"] }, { required: ["correlationIds"] }],
    } as SpecJsonSchemaWithUmsSupport;

    expect(isObjectLevelAnyOfRequired(schema)).toBe(true);
  });

  it("returns false when anyOf is absent", () => {
    const schema = { type: "object" } as SpecJsonSchemaWithUmsSupport;

    expect(isObjectLevelAnyOfRequired(schema)).toBe(false);
  });

  it("returns false for an empty anyOf array", () => {
    const schema = { type: "object", anyOf: [] } as SpecJsonSchemaWithUmsSupport;

    expect(isObjectLevelAnyOfRequired(schema)).toBe(false);
  });

  it("returns false when a branch mixes required with other keywords", () => {
    // A $ref/type/const alongside required is a composition branch, not the
    // "at least one of these properties" pattern. It must keep rendering via the
    // existing "Any of the following" path, so this predicate must reject it.
    const schema = {
      type: "object",
      anyOf: [{ required: ["ordId"] }, { required: ["url"], type: "object" }],
    } as SpecJsonSchemaWithUmsSupport;

    expect(isObjectLevelAnyOfRequired(schema)).toBe(false);
  });

  it("returns false when a branch has an empty required array", () => {
    const schema = {
      type: "object",
      anyOf: [{ required: ["ordId"] }, { required: [] }],
    } as SpecJsonSchemaWithUmsSupport;

    expect(isObjectLevelAnyOfRequired(schema)).toBe(false);
  });

  it("returns false when a branch requires multiple properties", () => {
    const schema = {
      type: "object",
      anyOf: [{ required: ["ordId", "url"] }, { required: ["correlationIds"] }],
    } as SpecJsonSchemaWithUmsSupport;

    expect(isObjectLevelAnyOfRequired(schema)).toBe(false);
  });

  it("returns false when a branch is a $ref composition", () => {
    const schema = {
      type: "object",
      anyOf: [{ $ref: "#/definitions/A" }, { $ref: "#/definitions/B" }],
    } as SpecJsonSchemaWithUmsSupport;

    expect(isObjectLevelAnyOfRequired(schema)).toBe(false);
  });
});
