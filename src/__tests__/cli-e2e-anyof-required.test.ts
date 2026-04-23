import fs from "fs-extra";
import path from "path";
import spawnAsync from "@expo/spawn-async";
import yaml from "js-yaml";
import { SpecToolkitConfigurationDocument } from "../generated/spec-toolkit-config/spec-v1/types/spec-toolkit-config.js";

describe("CLI e2e: anyOf with required-only entries", () => {
  const cliBin = "node";
  const cliScriptPath = "./dist/cli.js";
  const tmpTestDataName = "tmpTestData-cli-e2e-anyof-required";
  const tmpTestOutputName = "tmpTestOutput-cli-e2e-anyof-required";
  const tmpTestData = path.join(process.cwd(), "src", "__tests__", tmpTestDataName);
  const tmpTestOutput = path.join(process.cwd(), "src", "__tests__", tmpTestOutputName);

  beforeAll(() => {
    fs.ensureDirSync(tmpTestOutput);
    fs.ensureDirSync(tmpTestData);

    const schema = {
      $schema: "http://json-schema.org/draft-07/schema#",
      title: "Overlay Spec",
      type: "object",
      properties: {
        overlays: {
          type: "array",
          items: { $ref: "#/definitions/Overlay" },
        },
      },
      definitions: {
        Overlay: {
          title: "Overlay",
          type: "object",
          properties: {
            description: { type: "string" },
            target: { $ref: "#/definitions/OverlayTarget" },
          },
          required: ["target"],
        },
        OverlayTarget: {
          title: "Overlay Target",
          type: "object",
          description: "Target of the overlay. At least one of ordId, url, or correlationIds MUST be provided.",
          additionalProperties: false,
          anyOf: [{ required: ["ordId"] }, { required: ["url"] }, { required: ["correlationIds"] }],
          properties: {
            ordId: {
              type: "string",
              description: "ORD ID of the target being patched.",
              pattern: "^([a-z0-9]+(?:[.][a-z0-9]+)*):([a-zA-Z0-9._\\-]+):([a-zA-Z0-9._\\-]+):(v0|v[1-9][0-9]*)$",
              maxLength: 255,
            },
            url: {
              type: "string",
              format: "uri-reference",
              description: "URL pointing directly to the file being patched.",
            },
            correlationIds: {
              type: "array",
              minItems: 1,
              description: "Correlation IDs referencing the target resource.",
              items: {
                type: "string",
                maxLength: 255,
              },
            },
          },
        },
      },
    };

    const schemaPath = path.join(tmpTestData, "overlay.schema.yaml");
    fs.writeFileSync(schemaPath, yaml.dump(schema), "utf8");
  });

  afterAll(() => {
    fs.removeSync(tmpTestOutput);
    fs.removeSync(tmpTestData);
  });

  test("should successfully generate documentation for a schema with object-level anyOf required-only entries", async () => {
    const config: SpecToolkitConfigurationDocument = {
      $schema: "https://open-resource-discovery.github.io/spec-toolkit/spec-v1/spec-toolkit-config.schema.json#",
      outputPath: `src/__tests__/${tmpTestOutputName}`,
      docsConfig: [
        {
          type: "spec",
          id: "overlay-spec",
          sourceFilePath: `./src/__tests__/${tmpTestDataName}/overlay.schema.yaml`,
        },
      ],
    };

    const configFilePath = path.join(tmpTestData, "config.json");
    fs.writeFileSync(configFilePath, JSON.stringify(config), "utf8");

    const cliArguments = [cliScriptPath, "-c", `./src/__tests__/${tmpTestDataName}/config.json`];

    try {
      const { stdout, stderr } = await spawnAsync(cliBin, cliArguments);

      expect(stdout).toContain(`SUCCESS: Documentation successfully generated to src/__tests__/${tmpTestOutputName}`);
      expect(stderr).toEqual("");

      // Verify generated markdown contains the anyOf properties
      const mdFileContent = fs.readFileSync(`src/__tests__/${tmpTestOutputName}/docs/overlay-spec.md`).toString();
      expect(mdFileContent).toContain("ordId");
      expect(mdFileContent).toContain("url");
      expect(mdFileContent).toContain("correlationIds");
      // Should NOT contain "Any of the following" since the required-only pattern is not a $ref composition
      expect(mdFileContent).not.toContain("Any of the following");

      // Verify generated JSON Schema preserves the anyOf structure
      const schemaFileContent = fs
        .readFileSync(`src/__tests__/${tmpTestOutputName}/schemas/overlay-spec.schema.json`)
        .toString();
      const outputSchema = JSON.parse(schemaFileContent);
      const overlayTarget = outputSchema.definitions.OverlayTarget;
      expect(overlayTarget.anyOf).toEqual([
        { required: ["ordId"] },
        { required: ["url"] },
        { required: ["correlationIds"] },
      ]);
      expect(overlayTarget.properties).toHaveProperty("ordId");
      expect(overlayTarget.properties).toHaveProperty("url");
      expect(overlayTarget.properties).toHaveProperty("correlationIds");
    } catch (e) {
      expect(e).toEqual("expect this to never happen because above code should not throw an error");
    }
  });
});
