import * as staticSpecToolkitConfigSchemaSchema from "./generated/spec-toolkit-config/spec-v1/schemas/spec-toolkit-config.schema.json" with { type: "json" };
import { SpecJsonSchemaRoot } from "./generated/spec/spec-v1/types/index.js";

export * from "./generated/spec-toolkit-config/spec-v1/types/index.js";
export * from "./generated/spec/spec-v1/types/index.js";

export const schemas = {
  specToolkitConfigSchema: staticSpecToolkitConfigSchemaSchema as unknown as SpecJsonSchemaRoot,
};
