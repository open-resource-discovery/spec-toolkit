import fs from "fs-extra";
import type { JSONSchema4 } from "json-schema";
import { compile as jsonSchemaToTypeScript } from "json-schema-to-typescript";
import { schemasOutputFolderName, typesOutputFolderName } from "./generate.js";
import type { SpecJsonSchemaRoot } from "./generated/spec/spec-v1/types/index.js";
import type { SpecToolkitConfigurationDocument } from "./generated/spec-toolkit-config/spec-v1/types/index.js";
import {
  convertAllOfWithIfThenDiscriminatorToOneOf,
  convertAnyOfEnum,
  convertOneOfEnum,
  convertRefToDocToStandardRef,
  removeAllExtensionProperties,
  removeDescriptionsFromRefPointers,
} from "./util/jsonSchemaConversion.js";
import { log } from "./util/log.js";
import { loadYaml } from "./util/yaml.js";

export async function generateTypeScriptDefinitions(configData: SpecToolkitConfigurationDocument): Promise<void> {
  let indexExportStatements = "";

  for (const docConfig of configData.docsConfig) {
    // typescript types will be generated only for spec documents
    // because specExtension documents are just fragments that will be merged into the bigger spec document
    // it does not make sense to have typescript types generated out of fragment files
    if (docConfig.type === "spec") {
      const xSchemaFileName = `${docConfig.id}.schema.json`.split(".json").join(".x.json");
      const xSchemaFilePath = `${configData.outputPath}/${schemasOutputFolderName}/${xSchemaFileName}`;
      let schema = loadYaml(fs.readFileSync(`${xSchemaFilePath}`).toString()) as SpecJsonSchemaRoot;

      schema = convertRefToDocToStandardRef(schema);
      schema = convertOneOfEnum(schema);
      schema = convertAnyOfEnum(schema);
      schema = convertAllOfWithIfThenDiscriminatorToOneOf(schema);

      // Schema cleaned up
      schema = removeDescriptionsFromRefPointers(schema);
      const allCustomPropertiesTypescriptTypes = schema["x-custom-typescript-types"];

      // Remove x- properties that are not relevant for end spec consumers
      // But if this is the case when spec-toolkit self documents it's own spec schema,
      // we want to keep all x- properties as part of the generated documentation
      if (!schema.$id?.includes("spec.schema.json") && !schema.title?.includes("Spec Json Schema Root")) {
        schema = removeAllExtensionProperties(schema);
      }

      // json-schema-to-typescript v16 formats tsType before returning the generated source.
      // Our marker is intentionally not valid TypeScript because it carries the desired index-key
      // type in a comment, so replace it with valid syntax before compiling and restore the key
      // types in the resulting declarations below.
      const keyTypeMarkers: string[] = [];
      const replaceKeyTypeMarkers = (value: unknown): void => {
        if (Array.isArray(value)) {
          for (const item of value) {
            replaceKeyTypeMarkers(item);
          }
          return;
        }
        if (!value || typeof value !== "object") {
          return;
        }
        for (const [key, child] of Object.entries(value)) {
          if (key === "tsType" && typeof child === "string") {
            const marker = child.match(/^unknown \/\/ replaceKeyType_\{([^}]+)\}$/);
            if (marker) {
              keyTypeMarkers.push(marker[1]);
              (value as Record<string, unknown>)[key] = "unknown";
            }
          } else {
            replaceKeyTypeMarkers(child);
          }
        }
      };
      replaceKeyTypeMarkers(schema);

      const convertedDocumentSchema = schema as unknown as JSONSchema4;
      const typesFile = `${process.cwd()}/${configData.outputPath}/${typesOutputFolderName}/${docConfig.id}.ts`;
      let definitions: string;
      try {
        definitions = await jsonSchemaToTypeScript(convertedDocumentSchema, `${docConfig.id}`, {
          unknownAny: true,
          bannerComment: "// AUTO-GENERATED definition files. Do not modify directly.\n\n",
          strictIndexSignatures: false,
          declareExternallyReferenced: true,
          inferStringEnumKeysFromValues: false,
        });
      } catch (err) {
        if ((configData.generalConfig?.schemaMode ?? "strict") === "strict") throw err;
        // Tolerant mode: TypeScript type generation via json-schema-to-typescript
        // cannot always handle arbitrary JSON Schema (e.g. inline if/then/else
        // conditionals). Warn and skip the TS types for this schema rather than
        // aborting the whole run — the Markdown interface docs (already written)
        // are the primary artifact and are unaffected.
        log.warn(
          `Skipping TypeScript type generation for "${docConfig.id}": ${(err as Error).message}. The Markdown documentation was still generated.`,
        );
        // Best-effort cleanup of temporary and stale outputs.
        try {
          if (fs.existsSync(xSchemaFilePath)) fs.unlinkSync(xSchemaFilePath);
          if (fs.existsSync(typesFile)) fs.unlinkSync(typesFile);
        } catch {
          // ignore
        }
        continue;
      }

      // Clean up unnecessary "This interface was referenced..." mentions
      definitions = definitions.replace(/ {3}\*\n {3}\* This interface was referenced by (.*)\n(.*)\n/gm, "");

      // Add export of custom defined x-custom-typescript-types
      if (allCustomPropertiesTypescriptTypes) {
        for (const xPatternPropertiesTypescriptTypes of allCustomPropertiesTypescriptTypes) {
          definitions +=
            `\nexport type ${xPatternPropertiesTypescriptTypes.typeName} = ` +
            `${xPatternPropertiesTypescriptTypes.typeValue}` +
            `;\n`;
        }
      }

      for (const keyType of keyTypeMarkers) {
        definitions = definitions.replace("[k: string]: unknown", `[k: ${keyType}]: unknown`);
      }

      fs.unlinkSync(xSchemaFilePath);
      log.info(`Cleanup temporary file ${xSchemaFilePath}`);

      await fs.outputFile(typesFile, definitions);
      log.info(`Result: ${typesFile}`);
      if (configData.generalConfig?.tsTypeExportExcludeJsFileExtension) {
        indexExportStatements += `export * from "./${docConfig.id}";\n`;
      } else {
        indexExportStatements += `export * from "./${docConfig.id}.js";\n`;
      }
    }
  }

  const indexFilePath = `${process.cwd()}/${configData.outputPath}/${typesOutputFolderName}/index.ts`;
  fs.outputFileSync(indexFilePath, indexExportStatements);
}
