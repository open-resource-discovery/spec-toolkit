import fs from "fs-extra";
import type { SpecExtensionJsonSchema, SpecJsonSchemaRoot } from "./generated/spec/spec-v1/types/index.js";
import type {
  SpecConfig,
  SpecExtensionConfig,
  SpecToolkitConfigurationDocument,
} from "./generated/spec-toolkit-config/spec-v1/types/index.js";
import { writeSpecJsonSchemaFiles } from "./generateInterfaceDocumentation.js";
import { createGenerationContext, type GenerationContext, schemasOutputFolderName } from "./generationContext.js";
import { log, logWritten } from "./util/log.js";
import { validateSpecJsonSchema } from "./util/validation.js";
import { loadYaml } from "./util/yaml.js";

type ExtensionPoints = Record<string, string[]>;

export function findSpecExtensions(
  docsConfig: SpecToolkitConfigurationDocument["docsConfig"],
  targetDocumentId: string,
): SpecExtensionConfig[] {
  return docsConfig.filter(
    (docConfig): docConfig is SpecExtensionConfig =>
      docConfig.type === "specExtension" && docConfig.targetDocumentId === targetDocumentId,
  );
}

export function findExtensionPoints(targetDocument: SpecJsonSchemaRoot): ExtensionPoints {
  const extensionPoints: ExtensionPoints = {};

  for (const [definitionName, definition] of Object.entries(targetDocument.definitions)) {
    for (const extensionPoint of definition["x-extension-points"] ?? []) {
      const definitions = extensionPoints[extensionPoint] ?? [];
      if (!definitions.includes(definitionName)) {
        definitions.push(definitionName);
      }
      extensionPoints[extensionPoint] = definitions;
    }
  }

  return extensionPoints;
}

export function mergeExtension(
  targetDocument: SpecJsonSchemaRoot,
  specExtension: SpecJsonSchemaRoot,
  extensionPoints: ExtensionPoints,
): void {
  for (const [definitionName, definition] of Object.entries(specExtension.definitions)) {
    const extensionDefinition = definition as SpecExtensionJsonSchema;
    if (extensionDefinition["x-ref-to-doc"]) {
      definition.$ref = extensionDefinition["x-ref-to-doc"].ref;
    }

    if (targetDocument.definitions[definitionName]) {
      throw new Error(`Cannot merge spec extension definition ${definitionName} as the name is already taken.`);
    }
    targetDocument.definitions[definitionName] = definition;
  }

  for (const [definitionName, definition] of Object.entries(specExtension.definitions)) {
    const extensionDefinition = definition as SpecExtensionJsonSchema;
    for (const extensionTarget of extensionDefinition["x-extension-targets"] ?? []) {
      const targetDefinitions = extensionPoints[extensionTarget];
      if (!targetDefinitions) {
        throw new Error(`Extension Point "${extensionTarget}" is not defined in target document`);
      }

      for (const targetDefinitionName of targetDefinitions) {
        const properties = targetDocument.definitions[targetDefinitionName].properties;
        if (!properties) {
          throw new Error(`Definition "${targetDefinitionName}" in target document must be an object with properties`);
        }
        if (properties[definitionName]) {
          throw new Error(
            `Definition "${targetDefinitionName}" in target document already has property "${definitionName}"`,
          );
        }
        properties[definitionName] = { $ref: `#/definitions/${definitionName}` };
      }
    }
  }
}

function mergeExtensionsIntoDocument(
  configData: SpecToolkitConfigurationDocument,
  docConfig: SpecConfig,
  context: GenerationContext,
): void {
  const targetDocumentFilePath = context.outputPath(schemasOutputFolderName, `${docConfig.id}.schema.json`);
  const targetDocument = loadYaml(fs.readFileSync(targetDocumentFilePath).toString()) as SpecJsonSchemaRoot;
  const extensionPoints = findExtensionPoints(targetDocument);

  log.info(`Detected ${Object.keys(extensionPoints).length} extension point(s) in ${docConfig.id}.`);
  for (const specExtensionConfig of findSpecExtensions(configData.docsConfig, docConfig.id)) {
    log.info(`Merging extension: ${specExtensionConfig.sourceFilePath}`);
    const fileText = fs.readFileSync(context.resolvePath(specExtensionConfig.sourceFilePath)).toString();
    mergeExtension(targetDocument, loadYaml(fileText) as SpecJsonSchemaRoot, extensionPoints);
  }

  validateSpecJsonSchema(targetDocument, docConfig.sourceFilePath, context.validation);
  writeSpecJsonSchemaFiles(
    targetDocumentFilePath,
    targetDocument,
    configData.generalConfig?.preservedCoreSpecificXProperties,
    true,
    context.displayPath(targetDocumentFilePath),
    context.preservedPluginSpecificXProperties,
  );
  logWritten(context.displayPath(targetDocumentFilePath));
}

export function mergeSpecExtensions(
  configData: SpecToolkitConfigurationDocument,
  context: GenerationContext = createGenerationContext(configData),
): void {
  for (const docConfig of configData.docsConfig) {
    if (docConfig.type === "spec") {
      mergeExtensionsIntoDocument(configData, docConfig, context);
    }
  }
}
