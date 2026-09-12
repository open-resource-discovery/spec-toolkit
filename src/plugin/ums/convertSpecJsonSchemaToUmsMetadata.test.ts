import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, test } from "../../testHelpers/nodeTest.js";
import { convertSpecJsonSchemaToUmsMetadata } from "./convertSpecJsonSchemaToUmsMetadata.js";
import type { SpecJsonSchemaRootWithUmsSupport } from "./types.js";
import { isUmsMetadataType } from "./umsMetadataTypes.js";

describe("convertSpecJsonSchemaToUmsMetadata", () => {
  test("converts an ORD-style association and its reverse relation", () => {
    const document = {
      $id: "https://open-resource-discovery.org/spec-v1/Document.schema.json#",
      title: "ORD Document",
      type: "object",
      properties: {},
      definitions: {
        Vendor: {
          type: "object",
          "x-ums-type": "root",
          properties: {
            ordId: { type: "string" },
          },
          required: ["ordId"],
        },
        ApiResource: {
          type: "object",
          "x-ums-type": "root",
          properties: {
            ordId: { type: "string" },
            vendor: {
              type: "string",
              "x-association-target": ["#/definitions/Vendor/ordId"],
              "x-ums-reverse-relationship": {
                propertyName: "apiResources",
                description: "API resources published by this vendor.",
              },
            },
          },
          required: ["ordId", "vendor"],
        },
      },
    } as unknown as SpecJsonSchemaRootWithUmsSupport;

    const result = convertSpecJsonSchemaToUmsMetadata([document], {
      metadataPath: "/sap/core/ucl/metadata/ord/v1",
    });
    const metadataTypes = result.filter(isUmsMetadataType);
    const apiResource = metadataTypes.find((metadata) => metadata.spec.typeName === "ApiResource");
    const vendor = metadataTypes.find((metadata) => metadata.spec.typeName === "Vendor");

    expect(metadataTypes).toHaveLength(2);
    expect(apiResource).toBeDefined();
    expect(vendor).toBeDefined();
    expect(apiResource?.spec.metadataProperties).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "ordId", type: "string", mandatory: true }),
        expect.objectContaining({ name: "vendor_ID", type: "guid", mandatory: true }),
      ]),
    );
    expect(apiResource?.spec.metadataRelations).toContainEqual(
      expect.objectContaining({
        propertyName: "vendor",
        relatedTypeName: "Vendor",
        relatedTypeNamespace: "/sap/core/ucl/metadata/ord/v1",
        propertyBased: true,
        managedByProperty: "vendor_ID",
        mandatory: true,
        reverseRelation: { relationPropertyName: "apiResources" },
      }),
    );
    expect(vendor?.spec.metadataRelations).toContainEqual(
      expect.objectContaining({
        propertyName: "apiResources",
        relatedTypeName: "ApiResource",
        description: "API resources published by this vendor.",
      }),
    );
  });

  test("merges nested overrides and named array entries without replacing existing values", () => {
    const document = {
      $id: "https://example.com/document.schema.json",
      title: "Example document",
      type: "object",
      properties: {},
      definitions: {
        Entity: {
          type: "object",
          "x-ums-type": "root",
          properties: { ordId: { type: "string" } },
          required: ["ordId"],
        },
      },
    } as unknown as SpecJsonSchemaRootWithUmsSupport;
    const config = {
      metadataPath: "/example/metadata/v1",
      labels: { existing: "preserved" },
    };
    const baseline = convertSpecJsonSchemaToUmsMetadata([document], config);
    const entity = baseline.find(isUmsMetadataType);
    expect(entity).toBeDefined();

    const temporaryDirectory = mkdtempSync(path.join(tmpdir(), "spec-toolkit-overrides-"));
    const overridePath = path.join(temporaryDirectory, "overrides.json");
    writeFileSync(
      overridePath,
      JSON.stringify({
        umsMetadataOverride: "0.1",
        overrides: [
          {
            apiVersion: entity!.apiVersion,
            type: entity!.type,
            metadata: { name: entity!.metadata.name, labels: { added: "override" } },
            spec: {
              visibility: "internal",
              metadataProperties: [{ name: "ordId", description: "Overridden description" }],
            },
          },
          {
            apiVersion: entity!.apiVersion,
            type: entity!.type,
            metadata: { name: entity!.metadata.name },
            spec: { metadataProperties: [{ name: "added", type: "boolean" }] },
          },
        ],
      }),
    );

    try {
      const result = convertSpecJsonSchemaToUmsMetadata([document], { ...config, overrides: [overridePath] });
      const overriddenEntity = result.find(isUmsMetadataType);
      const ordIdProperty = overriddenEntity?.spec.metadataProperties.find((property) => property.name === "ordId");

      expect(overriddenEntity?.metadata.labels).toEqual({ existing: "preserved", added: "override" });
      expect(overriddenEntity?.metadata.path).toBe("/example/metadata/v1");
      expect(overriddenEntity?.spec.visibility).toBe("internal");
      expect(ordIdProperty).toEqual({
        name: "ordId",
        type: "string",
        mandatory: true,
        description: "Overridden description",
      });
      expect(overriddenEntity?.spec.metadataProperties).toContainEqual({ name: "added", type: "boolean" });
    } finally {
      rmSync(temporaryDirectory, { recursive: true, force: true });
    }
  });
});
