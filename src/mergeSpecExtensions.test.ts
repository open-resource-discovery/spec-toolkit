import type { SpecJsonSchemaRoot } from "./generated/spec/spec-v1/types/index.js";
import type { SpecToolkitConfigurationDocument } from "./generated/spec-toolkit-config/spec-v1/types/index.js";
import { findExtensionPoints, findSpecExtensions, mergeExtension } from "./mergeSpecExtensions.js";
import { describe, expect, test } from "./testHelpers/nodeTest.js";

function schema(definitions: SpecJsonSchemaRoot["definitions"]): SpecJsonSchemaRoot {
  return {
    title: "Test schema",
    type: "object",
    definitions,
  };
}

describe("spec extension merging", () => {
  test("selects only extensions for the requested document", () => {
    const docsConfig: SpecToolkitConfigurationDocument["docsConfig"] = [
      { type: "spec", id: "core", sourceFilePath: "core.yaml" },
      { type: "specExtension", id: "first", sourceFilePath: "first.yaml", targetDocumentId: "core" },
      { type: "specExtension", id: "second", sourceFilePath: "second.yaml", targetDocumentId: "other" },
    ];

    expect(findSpecExtensions(docsConfig, "core").map((extension) => extension.id)).toEqual(["first"]);
  });

  test("indexes extension points without duplicate definition names", () => {
    const target = schema({
      Resource: {
        title: "Resource",
        type: "object",
        properties: {},
        "x-extension-points": ["resource", "common", "common"],
      },
      Other: {
        title: "Other",
        type: "object",
        properties: {},
        "x-extension-points": ["common"],
      },
    });

    expect(findExtensionPoints(target)).toEqual({
      resource: ["Resource"],
      common: ["Resource", "Other"],
    });
  });

  test("merges definitions, external references, and target properties", () => {
    const target = schema({
      Resource: { title: "Resource", type: "object", properties: {}, "x-extension-points": ["resource"] },
    });
    const extension = schema({
      "@Example.value": {
        title: "Example",
        type: "string",
        "x-extension-targets": ["resource"],
        "x-ref-to-doc": { title: "External", ref: "#/definitions/External" },
      },
    });

    mergeExtension(target, extension, findExtensionPoints(target));

    expect(target.definitions["@Example.value"].$ref).toBe("#/definitions/External");
    expect(target.definitions.Resource.properties?.["@Example.value"]).toEqual({
      $ref: "#/definitions/@Example.value",
    });
  });

  test("rejects duplicate definition names", () => {
    const target = schema({ Duplicate: { title: "Duplicate", type: "string" } });
    const extension = schema({ Duplicate: { title: "Duplicate extension", type: "string" } });

    expect(() => mergeExtension(target, extension, {})).toThrow("name is already taken");
  });

  test("rejects unknown extension points", () => {
    const target = schema({ Resource: { title: "Resource", type: "object", properties: {} } });
    const extension = schema({
      Extension: { title: "Extension", type: "string", "x-extension-targets": ["missing"] },
    });

    expect(() => mergeExtension(target, extension, {})).toThrow(
      'Extension Point "missing" is not defined in target document',
    );
  });
});
