import type { SpecJsonSchemaRoot } from "../generated/spec/spec-v1/types/index.js";
import { getJsonSchemaValidator } from "./validation.js";

describe("getJsonSchemaValidator", () => {
  it("accepts annotation keywords inherited from external schemas", () => {
    const schema = {
      type: "object",
      title: "Root",
      "x-external-annotation": "retained for documentation",
    } as unknown as SpecJsonSchemaRoot;

    const validate = getJsonSchemaValidator(schema);

    expect(validate({})).toBe(true);
  });
});
