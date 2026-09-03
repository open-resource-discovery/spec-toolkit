import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { jest } from "@jest/globals";
import type { SpecJsonSchemaRoot } from "./generated/spec/spec-v1/types/index.js";
import { loadSpecJsonSchema } from "./generateInterfaceDocumentation.js";

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
    const fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue(
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
});
