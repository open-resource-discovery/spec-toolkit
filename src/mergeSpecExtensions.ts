import fs from "fs-extra";
import * as yaml from "js-yaml";
import { log } from "./util/log.js";
import { SpecExtensionJsonSchema, SpecJsonSchemaRoot } from "./generated/spec/spec-v1/types/index.js";
import { validateSpecJsonSchema } from "./util/validation.js";
import { writeSpecJsonSchemaFiles } from "./generateInterfaceDocumentation.js";
import { SpecToolkitConfigurationDocument } from "./generated/spec-toolkit-config/spec-v1/types/index.js";
import path from "path";
import { schemasOutputFolderName } from "./generate.js";

export function mergeSpecExtensions(configData: SpecToolkitConfigurationDocument): void {
  for (const docConfig1 of configData.docsConfig) {
    if (docConfig1.type === "spec") {
      const targetDocumentFilePath = `${configData.outputPath}/${schemasOutputFolderName}/${docConfig1.id}.schema.json`;
      const jsonSchemaFile = fs.readFileSync(path.join(process.cwd(), targetDocumentFilePath)).toString();
      const targetDocument = yaml.load(jsonSchemaFile) as SpecJsonSchemaRoot;

      const specExtensions: string[] = [];
      for (const docConfig2 of configData.docsConfig) {
        if (docConfig2.type === "specExtension" && docConfig2.targetDocumentId === docConfig1.id) {
          specExtensions.push(docConfig2.sourceFilePath);
        }
      }

      log.info("Detecting Extension Points in target document");
      // Preparation: Detect and remember extension points
      // key: Extension Point Name
      // value: Array<Definition name in JSON Schema>
      const extensionPointsMap: { [extensionPointName: string]: string[] } = {};

      for (const definitionName in targetDocument.definitions) {
        const definition = targetDocument.definitions[definitionName];

        if (definition["x-extension-points"]) {
          for (const extensionPoint of definition["x-extension-points"]) {
            if (!extensionPointsMap[extensionPoint]) {
              extensionPointsMap[extensionPoint] = [definitionName];
            } else {
              if (!extensionPointsMap[extensionPoint].includes(definitionName)) {
                extensionPointsMap[extensionPoint].push(definitionName);
              }
            }
          }
        }
      }

      for (const specExtensionFile of specExtensions) {
        log.info(`Merging ${specExtensionFile}`);

        const fileText = fs.readFileSync(specExtensionFile).toString();
        const specExtension = yaml.load(fileText) as SpecJsonSchemaRoot;

        // Replace x-ref-to-doc with real $ref links
        for (const definitionName in specExtension.definitions) {
          const definition = specExtension.definitions[definitionName];
          const castedDefinition = definition as SpecExtensionJsonSchema;
          if (castedDefinition["x-ref-to-doc"]) {
            definition.$ref = castedDefinition["x-ref-to-doc"].ref;
          }
        }

        // Now merge the JSON Schema definitions
        for (const definitionName in specExtension.definitions) {
          const definition = specExtension.definitions[definitionName];

          if (targetDocument.definitions[definitionName]) {
            throw new Error(`Cannot merge spec extension definition ${definitionName} as the name is already taken.`);
          }

          targetDocument.definitions[definitionName] = definition;
        }

        // Create the $refs in the extension points to the extensions
        for (const definitionName in specExtension.definitions) {
          const definition = specExtension.definitions[definitionName];

          const castedDefinition = definition as SpecExtensionJsonSchema;
          if (castedDefinition["x-extension-targets"]) {
            for (const extensionTarget of castedDefinition["x-extension-targets"]) {
              if (!extensionPointsMap[extensionTarget]) {
                throw new Error(`Extension Point "${extensionTarget}" is not defined in target document`);
              }

              for (const targetDefinition of extensionPointsMap[extensionTarget]) {
                if (!targetDocument.definitions[targetDefinition].properties) {
                  throw new Error(
                    `Definition "${targetDefinition}" in target document must be an object with properties`,
                  );
                }
                if (targetDocument.definitions[targetDefinition].properties[definitionName]) {
                  throw new Error(
                    `Definition "${targetDefinition}" in target document already has property "${definitionName}"`,
                  );
                }
                targetDocument.definitions[targetDefinition].properties[definitionName] = {
                  $ref: `#/definitions/${definitionName}`,
                };
              }
            }
          }
        }
      }

      // Validate resulting JSON Schema document
      validateSpecJsonSchema(targetDocument, docConfig1.sourceFilePath);

      writeSpecJsonSchemaFiles(targetDocumentFilePath, targetDocument, true);

      log.info(`Written: ${targetDocumentFilePath}`);
    }
  }
}
