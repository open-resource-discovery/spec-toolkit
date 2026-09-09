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
});
