import {
  convertAllOfWithIfThenDiscriminatorToOneOf,
  convertAnyOfEnum,
  convertOneOfEnum,
  convertRefToDocToStandardRef,
  removeDescriptionsFromRefPointers,
  removeAllExtensionProperties,
} from "./util/jsonSchemaConversion.js";

import { JSONSchema4 } from "json-schema";
import { SpecJsonSchemaRoot } from "./generated/spec/spec-v1/types/index.js";
import fs from "fs-extra";
import { compile as jsonSchemaToTypeScript } from "json-schema-to-typescript";
import { log } from "./util/log.js";
import yaml from "js-yaml";
import { SpecToolkitConfigurationDocument } from "./generated/spec-toolkit-config/spec-v1/types/index.js";
import { schemasOutputFolderName, typesOutputFolderName } from "./generate.js";

export async function generateTypeScriptDefinitions(configData: SpecToolkitConfigurationDocument): Promise<void> {
  let indexExportStatements = "";

  for (const docConfig of configData.docsConfig) {
    // typescript types will be generated only for spec documents
    // because specExtension documents are just fragments that will be merged into the bigger spec document
    // it does not make sense to have typescript types generated out of fragment files
    if (docConfig.type === "spec") {
      const xSchemaFileName = `${docConfig.id}.schema.json`.split(".json").join(".x.json");
      const xSchemaFilePath = `${configData.outputPath}/${schemasOutputFolderName}/${xSchemaFileName}`;
      let schema = yaml.load(fs.readFileSync(`${xSchemaFilePath}`).toString()) as SpecJsonSchemaRoot;

      schema = convertRefToDocToStandardRef(schema);
      schema = convertOneOfEnum(schema);
      schema = convertAnyOfEnum(schema);
      schema = convertAllOfWithIfThenDiscriminatorToOneOf(schema);

      // Schema cleaned up
      schema = removeDescriptionsFromRefPointers(schema);
      const allCustomPropertiesTypescriptTypes = schema["x-custom-typescript-types"];

      // Remove x-properties that are not relevant for end spec consumers
      // But if this is the case when spec-toolkit self documents it's own spec schema,
      // we want to keep all x-properties as part of the generated documentation
      if (!schema.$id?.includes("spec.schema.json") && !schema.title?.includes("Spec Json Schema Root")) {
        schema = removeAllExtensionProperties(schema);
      }

      const convertedDocumentSchema = schema as unknown as JSONSchema4;

      let definitions = await jsonSchemaToTypeScript(convertedDocumentSchema, `${docConfig.id}`, {
        unknownAny: true,
        bannerComment: "// AUTO-GENERATED definition files. Do not modify directly.\n\n",
        strictIndexSignatures: true,
        declareExternallyReferenced: true,
        inferStringEnumKeysFromValues: false,
      });

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

      // Post processing for all tsType "// replaceKeyType_" markings
      const allPostProcessingReplacements: { oldValue: string; newValue: string }[] = [];
      const allPostProcessingReplacementMatches = [...definitions.matchAll(/.*replaceKeyType_{(.*)}/gm)];
      for (const match of allPostProcessingReplacementMatches) {
        const replacementNewValue = match[0].replace("string", match[1]).split(";")[0] + ";";
        const indexStart = match.index;
        const indexEnd = match.index + match[0].length;
        allPostProcessingReplacements.push({
          oldValue: definitions.substring(indexStart, indexEnd),
          newValue: replacementNewValue,
        });
      }
      for (const replacement of allPostProcessingReplacements) {
        definitions = definitions.replace(replacement.oldValue, replacement.newValue);
      }

      fs.unlinkSync(xSchemaFilePath);
      log.info(`Cleanup temporary file ${xSchemaFilePath}`);

      const typesFile = `${process.cwd()}/${configData.outputPath}/${typesOutputFolderName}/${docConfig.id}.ts`;
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
