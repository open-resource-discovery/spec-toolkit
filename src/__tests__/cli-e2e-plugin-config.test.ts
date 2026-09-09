import path from "node:path";
import spawnAsync from "@expo/spawn-async";
import fs from "fs-extra";
import * as yaml from "js-yaml";
import type { SpecToolkitConfigurationDocument } from "../generated/spec-toolkit-config/spec-v1/types/spec-toolkit-config.js";
import { expectTypeScriptToCompile } from "../testHelpers/expectTypeScriptToCompile.js";
import { afterAll, beforeAll, describe, expect, test } from "../testHelpers/nodeTest.js";

describe("CLI plugin config tests", () => {
  const cliBin = "node";
  const cliScriptPath = "./dist/cli.js";
  const tmpTestDataName = "tmpTestData-cli-e2e-plugin-config";
  const tmpTestOutputName = "tmpTestOutput-cli-e2e-plugin-config";
  const tmpTestData = path.join(process.cwd(), "src", "__tests__", tmpTestDataName);
  const tmpTestOutput = path.join(process.cwd(), "src", "__tests__", tmpTestOutputName);

  beforeAll(() => {
    // Create test directories and write a valid JSON schema for Person
    fs.ensureDirSync(tmpTestOutput);
    fs.ensureDirSync(tmpTestData);
    const schema = {
      $schema: "http://json-schema.org/draft-07/schema#",
      title: "Person",
      type: "object",
      properties: {
        firstName: { type: "string" },
        lastName: { type: "string" },
      },
      required: ["firstName", "lastName"],
    };
    const schemaPath = path.join(tmpTestData, "person.schema.yaml");
    fs.writeFileSync(schemaPath, yaml.dump(schema), "utf8");
  });

  afterAll(() => {
    fs.removeSync(tmpTestOutput);
    fs.removeSync(tmpTestData);
  });

  describe("Test the plugin config", () => {
    describe("plugin packageName", () => {
      test("should successfully register and execute a plugin if configured", async () => {
        const config: SpecToolkitConfigurationDocument = {
          $schema: "https://open-resource-discovery.github.io/spec-toolkit/spec-v1/spec-toolkit-config.schema.json#",
          plugins: [
            {
              packageName: "./src/plugin/tabular/index.ts",
            },
          ],
          outputPath: `src/__tests__/${tmpTestOutputName}`,
          docsConfig: [
            {
              type: "spec",
              id: "my-spec",
              sourceFilePath: `./src/__tests__/${tmpTestDataName}/person.schema.yaml`,
            },
          ],
        };
        const configFilePath = tmpTestData.concat("/config.json");
        fs.writeFileSync(configFilePath, JSON.stringify(config), "utf8");

        const cliArguments = [cliScriptPath, "-c", `./src/__tests__/${tmpTestDataName}/config.json`];

        const resultPromise = spawnAsync(cliBin, cliArguments);

        try {
          const { stdout, stderr } = await resultPromise;

          expect(stdout).toContain(
            `SUCCESS: Documentation successfully generated to src/__tests__/${tmpTestOutputName}`,
          );
          // Check that stderr is empty
          expect(stderr).toEqual("");

          // Read output files and check their content
          const tabularPluginGeneratedContent = fs.readdirSync(`src/__tests__/${tmpTestOutputName}/plugin/tabular`);

          expect(tabularPluginGeneratedContent.length).toEqual(2);
        } catch (e) {
          expect(e).toEqual("expect this to never happen because above code should not throw an error");
        }
      });

      test("should successfully preserve plugin specific x- properties in the output JSON schema if configured", async () => {
        const schemaWithxUmsPropertyToPreserve = {
          $schema: "http://json-schema.org/draft-07/schema#",
          title: "Person",
          type: "object",
          "x-ums-type": "root",
          properties: {
            firstName: { type: "string" },
            lastName: { type: "string" },
          },
          required: ["firstName", "lastName"],
        };
        const schemaPath = path.join(tmpTestData, "personWithXUmsProperty.schema.yaml");
        fs.writeFileSync(schemaPath, yaml.dump(schemaWithxUmsPropertyToPreserve), "utf8");
        const config: SpecToolkitConfigurationDocument = {
          $schema: "https://open-resource-discovery.github.io/spec-toolkit/spec-v1/spec-toolkit-config.schema.json#",
          plugins: [
            {
              packageName: "./src/plugin/ums/index.ts",
              options: {
                preservedPluginSpecificXProperties: ["x-ums-type"],
              },
            },
          ],
          outputPath: `src/__tests__/${tmpTestOutputName}`,
          docsConfig: [
            {
              type: "spec",
              id: "my-spec",
              sourceFilePath: `./src/__tests__/${tmpTestDataName}/personWithXUmsProperty.schema.yaml`,
            },
          ],
        };
        const configFilePath = tmpTestData.concat("/config.json");
        fs.writeFileSync(configFilePath, JSON.stringify(config), "utf8");

        const cliArguments = [cliScriptPath, "-c", `./src/__tests__/${tmpTestDataName}/config.json`];

        const resultPromise = spawnAsync(cliBin, cliArguments);

        try {
          const { stdout, stderr } = await resultPromise;

          expect(stdout).toContain(
            `SUCCESS: Documentation successfully generated to src/__tests__/${tmpTestOutputName}`,
          );
          // Check that stderr is empty
          expect(stderr).toEqual("");

          // Read output files and check their content
          const schemaContent = fs
            .readFileSync(`src/__tests__/${tmpTestOutputName}/schemas/my-spec.schema.json`)
            .toString();

          expect(schemaContent).toMatchSnapshot();
        } catch (e) {
          expect(e).toEqual("expect this to never happen because above code should not throw an error");
        }
      });

      test("should generate every ORD-style artifact, including a UMS metadata type", async () => {
        const ordDocumentSchema = {
          $schema: "http://json-schema.org/draft-07/schema#",
          $id: "https://open-resource-discovery.org/spec-v1/Document.schema.json#",
          title: "ORD Document",
          type: "object",
          "x-ums-type": "ignore",
          properties: {
            apiResources: {
              type: "array",
              items: { $ref: "#/definitions/ApiResource" },
            },
          },
          definitions: {
            OrdResource: {
              title: "ORD Resource",
              type: "object",
              "x-abstract": true,
              "x-ums-type": "root",
              properties: { ordId: { type: "string" } },
              required: ["ordId"],
            },
            ApiResource: {
              title: "API Resource",
              type: "object",
              "x-ums-type": "root",
              "x-ums-implements": "#/definitions/OrdResource",
              properties: {
                ordId: { type: "string" },
                title: { type: "string" },
              },
              required: ["ordId", "title"],
            },
          },
        };
        const ordOverlaySchema = {
          $schema: "http://json-schema.org/draft-07/schema#",
          $id: "https://open-resource-discovery.org/spec-v1/OrdOverlay.schema.json#",
          title: "ORD Overlay",
          description: "A compact regression fixture based on the ORD Overlay specification.",
          type: "object",
          "x-ums-type": "root",
          properties: {
            ordId: {
              type: "string",
              description: "The globally unique ORD identifier.",
              pattern: "^[a-z0-9.]+:overlay:[a-zA-Z0-9._-]+:v[0-9]+$",
            },
            title: { type: "string", minLength: 1, maxLength: 255 },
            active: { type: "boolean" },
            tags: { type: "array", items: { type: "string" } },
          },
          required: ["ordId", "title"],
          additionalProperties: false,
        };
        const documentSchemaPath = path.join(tmpTestData, "ord-document.schema.yaml");
        const schemaPath = path.join(tmpTestData, "ord-overlay.schema.yaml");
        fs.writeFileSync(documentSchemaPath, yaml.dump(ordDocumentSchema), "utf8");
        fs.writeFileSync(schemaPath, yaml.dump(ordOverlaySchema), "utf8");

        const config: SpecToolkitConfigurationDocument = {
          $schema: "https://open-resource-discovery.github.io/spec-toolkit/spec-v1/spec-toolkit-config.schema.json#",
          generalConfig: {
            tsTypeExportExcludeJsFileExtension: true,
          },
          plugins: [
            {
              packageName: "./src/plugin/ums/index.ts",
              options: {
                metadataPath: "/sap/core/ucl/metadata/ord/v1",
                preservedPluginSpecificXProperties: ["x-ums-type"],
              },
            },
          ],
          outputPath: `src/__tests__/${tmpTestOutputName}`,
          docsConfig: [
            {
              type: "spec",
              id: "ord-document",
              sourceFilePath: `./src/__tests__/${tmpTestDataName}/ord-document.schema.yaml`,
            },
            {
              type: "spec",
              id: "ord-overlay",
              sourceFilePath: `./src/__tests__/${tmpTestDataName}/ord-overlay.schema.yaml`,
            },
          ],
        };
        const configFilePath = path.join(tmpTestData, "ord-overlay.config.json");
        fs.writeFileSync(configFilePath, JSON.stringify(config), "utf8");

        const { stdout, stderr } = await spawnAsync(cliBin, [
          cliScriptPath,
          "-c",
          `./src/__tests__/${tmpTestDataName}/ord-overlay.config.json`,
        ]).catch((error) => {
          throw new Error((error as spawnAsync.SpawnResult).stderr);
        });

        expect(stdout).toContain(`SUCCESS: Documentation successfully generated to src/__tests__/${tmpTestOutputName}`);
        expect(stderr).toEqual("");

        const docs = fs.readFileSync(path.join(tmpTestOutput, "docs/ord-overlay.md"), "utf8");
        const documentDocs = fs.readFileSync(path.join(tmpTestOutput, "docs/ord-document.md"), "utf8");
        const generatedDocumentSchema = JSON.parse(
          fs.readFileSync(path.join(tmpTestOutput, "schemas/ord-document.schema.json"), "utf8"),
        ) as typeof ordDocumentSchema;
        const generatedSchema = JSON.parse(
          fs.readFileSync(path.join(tmpTestOutput, "schemas/ord-overlay.schema.json"), "utf8"),
        ) as typeof ordOverlaySchema;
        const types = fs.readFileSync(path.join(tmpTestOutput, "types/ord-overlay.ts"), "utf8");
        const documentTypes = fs.readFileSync(path.join(tmpTestOutput, "types/ord-document.ts"), "utf8");
        const typeIndex = fs.readFileSync(path.join(tmpTestOutput, "types/index.ts"), "utf8");
        const umsType = yaml.load(
          fs.readFileSync(path.join(tmpTestOutput, "plugin/ums/MetadataType/ordoverlay.yaml"), "utf8"),
        ) as {
          type: string;
          metadata: { name: string; path: string };
          spec: {
            typeName: string;
            key: string[];
            metadataProperties: Array<{ name: string; type: string; mandatory?: boolean; array?: boolean }>;
          };
        };
        const abstractType = yaml.load(
          fs.readFileSync(path.join(tmpTestOutput, "plugin/ums/AbstractMetadataType/ordresource.yaml"), "utf8"),
        ) as { type: string; spec: { typeName: string } };
        const abstractTypeMapping = yaml.load(
          fs.readFileSync(path.join(tmpTestOutput, "plugin/ums/AbstractTypeMapping/ordresource.yaml"), "utf8"),
        ) as { spec: { includedTypes: Array<{ includedType: { name: string } }> } };
        const apiResourceType = yaml.load(
          fs.readFileSync(path.join(tmpTestOutput, "plugin/ums/MetadataType/apiresource.yaml"), "utf8"),
        ) as { type: string; spec: { typeName: string } };

        expect(docs).toContain("## ORD Overlay");
        expect(docs).toContain("The globally unique ORD identifier.");
        expect(documentDocs).toContain("## ORD Document");
        expect(generatedDocumentSchema.definitions.OrdResource["x-ums-type"]).toBe("root");
        expect(generatedDocumentSchema.definitions.ApiResource["x-ums-implements"]).toBeUndefined();
        expect(generatedSchema["x-ums-type"]).toBe("root");
        expect(generatedSchema.additionalProperties).toBe(false);
        expect(types).toContain("export interface ORDOverlay");
        expect(types).toContain("ordId: string;");
        expect(documentTypes).toContain("export interface ORDDocument");
        expect(documentTypes).toContain("apiResources?: APIResource[];");
        expect(typeIndex).toBe('export * from "./ord-document";\nexport * from "./ord-overlay";\n');
        await expectTypeScriptToCompile(
          path.join(tmpTestOutput, "types/ord-document.ts"),
          path.join(tmpTestOutput, "types/ord-overlay.ts"),
        );
        expect(umsType).toMatchObject({
          type: "MetadataType",
          metadata: {
            name: "ordoverlay",
            path: "/sap/core/ucl/metadata/ord/v1",
          },
          spec: {
            typeName: "ORDOverlay",
            key: ["id"],
          },
        });
        expect(umsType.spec.metadataProperties).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ name: "id", type: "guid", mandatory: true }),
            expect.objectContaining({ name: "ordId", type: "string", mandatory: true }),
            expect.objectContaining({ name: "tags", type: "string", array: true }),
          ]),
        );
        expect(abstractType).toMatchObject({ type: "AbstractMetadataType", spec: { typeName: "OrdResource" } });
        expect(abstractTypeMapping.spec.includedTypes).toContainEqual({
          includedType: {
            name: "ApiResource",
            namespace: "/sap/core/ucl/metadata/ord/v1",
          },
        });
        expect(apiResourceType).toMatchObject({ type: "MetadataType", spec: { typeName: "ApiResource" } });
      });
    });
  });
});
