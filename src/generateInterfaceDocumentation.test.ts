import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { SpecJsonSchemaRoot } from "./generated/spec/spec-v1/types/index.js";
import { loadSpecJsonSchema } from "./generateInterfaceDocumentation.js";
import { afterEach, beforeEach, describe, expect, it, mock } from "./testHelpers/nodeTest.js";

function collectRefs(node: unknown, refs: string[] = []): string[] {
  if (!node || typeof node !== "object") return refs;
  const value = node as Record<string, unknown>;
  if (typeof value.$ref === "string") refs.push(value.$ref);
  for (const child of Object.values(value)) collectRefs(child, refs);
  return refs;
}

function rootSchema(reference: string): SpecJsonSchemaRoot {
  return {
    $schema: "http://json-schema.org/draft-07/schema#",
    title: "Root",
    type: "object",
    properties: { imported: { $ref: "#/definitions/Imported" } },
    definitions: { Imported: { $ref: reference } },
  } as SpecJsonSchemaRoot;
}

describe("loadSpecJsonSchema", () => {
  let testDirectory: string;

  beforeEach(() => {
    testDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "spec-toolkit-refs-"));
  });

  afterEach(() => {
    fs.rmSync(testDirectory, { recursive: true, force: true });
  });

  it("bundles references to local schema files", async () => {
    const externalPath = path.join(testDirectory, "external.json");
    const rootPath = path.join(testDirectory, "root.json");
    fs.writeFileSync(
      externalPath,
      JSON.stringify({ definitions: { External: { title: "External", type: "string", minLength: 1 } } }),
    );
    fs.writeFileSync(rootPath, JSON.stringify(rootSchema("./external.json#/definitions/External")));

    const result = await loadSpecJsonSchema(rootPath);

    expect(result.definitions!.Imported).toMatchObject({ title: "External", type: "string", minLength: 1 });
    expect(collectRefs(result).every((ref) => ref.startsWith("#"))).toBe(true);
  });

  it("bundles references fetched over HTTP", async () => {
    const externalSchema = JSON.stringify({
      definitions: { External: { title: "External", type: "string", minLength: 1, "x-ums-type": "custom" } },
    });
    const fetchSpy = mock.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(externalSchema, {
        status: 200,
        headers: { "Content-Type": "application/schema+json" },
      }),
    );

    try {
      const rootPath = path.join(testDirectory, "root.json");
      fs.writeFileSync(rootPath, JSON.stringify(rootSchema("https://example.com/external.json#/definitions/External")));

      const result = await loadSpecJsonSchema(rootPath);

      expect(result.definitions!.Imported).toMatchObject({ title: "External", type: "string", minLength: 1 });
      expect(result.definitions!.Imported).toHaveProperty("x-ums-type", "custom");
      expect(collectRefs(result).every((ref) => ref.startsWith("#"))).toBe(true);
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.objectContaining({ href: "https://example.com/external.json" }),
        expect.objectContaining({ method: "GET" }),
      );
    } finally {
      fetchSpy.mockRestore();
    }
  });

  it("hoists an external reference inlined at a property into #/definitions", async () => {
    // When the external reference is first reached from a property (not from
    // within `definitions`), ref-parser inlines the object in place. The result
    // must be hoisted so every remaining $ref is a `#/definitions/<Name>` pointer
    // the renderer and validator understand.
    const externalPath = path.join(testDirectory, "external.json");
    const rootPath = path.join(testDirectory, "root.json");
    fs.writeFileSync(
      externalPath,
      JSON.stringify({
        definitions: { External: { title: "External", type: "object", properties: { name: { type: "string" } } } },
      }),
    );
    fs.writeFileSync(
      rootPath,
      JSON.stringify({
        $schema: "http://json-schema.org/draft-07/schema#",
        title: "Root",
        type: "object",
        properties: { imported: { $ref: "./external.json#/definitions/External" } },
        definitions: {},
      }),
    );

    const result = await loadSpecJsonSchema(rootPath);

    // The inlined object is hoisted; the property now points at a named definition.
    expect(result.properties!.imported).toMatchObject({ $ref: "#/definitions/External" });
    expect(result.definitions!.External).toMatchObject({ type: "object" });
    expect(collectRefs(result).every((ref) => ref.startsWith("#/definitions/"))).toBe(true);
  });

  it("rewrites duplicate references to the same external target into #/definitions", async () => {
    // Two properties referencing the same external target make ref-parser emit a
    // second $ref pointing at the first occurrence (e.g. `#/properties/a`). Both
    // must end up pointing at a `#/definitions/<Name>` entry.
    const externalPath = path.join(testDirectory, "external.json");
    const rootPath = path.join(testDirectory, "root.json");
    fs.writeFileSync(
      externalPath,
      JSON.stringify({
        definitions: { External: { title: "External", type: "object", properties: { name: { type: "string" } } } },
      }),
    );
    fs.writeFileSync(
      rootPath,
      JSON.stringify({
        $schema: "http://json-schema.org/draft-07/schema#",
        title: "Root",
        type: "object",
        properties: {
          a: { $ref: "./external.json#/definitions/External" },
          b: { $ref: "./external.json#/definitions/External" },
        },
        definitions: {},
      }),
    );

    const result = await loadSpecJsonSchema(rootPath);

    expect(result.properties!.a).toMatchObject({ $ref: "#/definitions/External" });
    expect(result.properties!.b).toMatchObject({ $ref: "#/definitions/External" });
    expect(collectRefs(result).every((ref) => ref.startsWith("#/definitions/"))).toBe(true);
  });

  it("reports the source file when bundling an unreachable reference fails", async () => {
    const rootPath = path.join(testDirectory, "root.json");
    fs.writeFileSync(rootPath, JSON.stringify(rootSchema("./does-not-exist.json#/definitions/External")));

    await expect(loadSpecJsonSchema(rootPath)).rejects.toThrow(/Failed to bundle external references of .*root\.json/);
  });

  it("does not let bundling conceal an authored strict-mode violation", async () => {
    const externalPath = path.join(testDirectory, "external.json");
    const rootPath = path.join(testDirectory, "root.json");
    fs.writeFileSync(externalPath, JSON.stringify({ title: "External", type: "string" }));
    fs.writeFileSync(
      rootPath,
      JSON.stringify({
        title: "Root",
        type: "object",
        properties: {
          imported: { $ref: "./external.json" },
          authoredInline: { type: "object", properties: { value: { type: "string" } } },
        },
        definitions: {},
      }),
    );

    await expect(loadSpecJsonSchema(rootPath)).rejects.toThrow("Strict schema mode rejected");
  });
});
