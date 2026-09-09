#!/usr/bin/env node

// The documentation how this script works and it's constraints
// can be found at the jsonSchemaToDocumentation() function definition

/**
 * Refactoring Ideas / TODOs:
 * * Share same code to generate descriptions for schemas inside AND outside of an object table
 * * Add **Type**: consistently for non-object Definition entries
 */

import path from "node:path";
import { $RefParser } from "@apidevtools/json-schema-ref-parser";
import fs from "fs-extra";
import {
  documentationExtensionsOutputFolderName,
  documentationOutputFolderName,
  getOutputPath,
  schemasOutputFolderName,
} from "./generate.js";
import type { SpecJsonSchemaRoot } from "./generated/spec/spec-v1/types/index.js";
import type { SpecToolkitConfigurationDocument } from "./generated/spec-toolkit-config/spec-v1/types/index.js";
import { generateMarkdown, type SpecTarget } from "./markdown/index.js";
import { readTextFromFile } from "./model/config.js";
import {
  convertRefToDocToStandardRef,
  preprocessSpecJsonSchema,
  removeDescriptionsFromRefPointers,
  removeSomeExtensionProperties,
} from "./util/jsonSchemaConversion.js";
import { log } from "./util/log.js";
import { getMarkdownFrontMatter } from "./util/markdownTextHelper.js";
import { normalizeArbitrarySchema } from "./util/normalizeArbitrarySchema.js";
import { validateSpecJsonSchema } from "./util/validation.js";
import { loadYaml } from "./util/yaml.js";

////////////////////////////////////////////////////////////
// JSON SCHEMA TO MARKDOWN                                //
////////////////////////////////////////////////////////////

export interface DocumentationResult {
  /** The generated markdown documentation */
  markdown: string;
  /** The converted JSON Schema that does not make use of generator specific features anymore */
  jsonSchema: SpecJsonSchemaRoot;
}

//----------------------------------------------------------
// -- Functions for JSON Schema build
//----------------------------------------------------------

/**
 * This is a very rudimentary JSON Schema to text documentation generator
 * It returns both the generated markdown and a converted JSON Schema that
 * is adjusted and simplified for general purpose use
 *
 * This script only works under certain given assumptions of the JSON Schema structure!
 * * The JSON Schema does never nest objects into objects directly
 *   If this is necessary, create a new object in the #/definitions section and use $ref
 *   Structuring a JSON Schema like this may be a good idea for other reasons as well
 * * The JSON Schema does not contain: not conditions
 * * The JSON Schema only uses oneOf for expressing documented enums
 *   * In this case, every oneOf item MUST contain a `const`
 *   * This will be converted back to a regular enum
 * * The JSON Schema root schema object is a "Object"
 *
 */
export async function loadSpecJsonSchema(sourceFilePath: string, strictMode = true): Promise<SpecJsonSchemaRoot> {
  const resolvedSourceFilePath = path.resolve(process.cwd(), sourceFilePath);
  const parsedSchema = loadYaml(fs.readFileSync(resolvedSourceFilePath).toString()) as SpecJsonSchemaRoot;
  if (!hasNonLocalReferences(parsedSchema)) {
    return parsedSchema;
  }

  // Validate the authored schema before bundling. Otherwise, the normalization
  // needed for inlined external references could also normalize unrelated
  // authored constructs and conceal a strict-mode violation.
  if (strictMode) normalizeArbitrarySchema(parsedSchema, { strict: true });

  let bundledSchema: SpecJsonSchemaRoot;
  try {
    bundledSchema = (await $RefParser.bundle(resolvedSourceFilePath)) as unknown as SpecJsonSchemaRoot;
  } catch (err) {
    // A single unreachable/invalid external reference would otherwise abort the
    // whole run with a raw ref-parser stack. Point at the offending file instead.
    throw new Error(`Failed to bundle external references of "${resolvedSourceFilePath}": ${(err as Error).message}`);
  }

  // `$RefParser.bundle` inlines external content at the referencing location and
  // rewrites further references to that JSON Pointer (e.g. `#/properties/...`),
  // rather than minting `#/definitions/<Name>` entries. The renderer, validator
  // and TypeScript generator only understand `#/definitions/<Name>`, so hoist the
  // bundled artifacts into definitions here. This normalization only rewrites the
  // structures bundling itself introduced; it does not relax strict-mode
  // validation of the authored schema, which still runs on the result.
  const { schema, warnings } = normalizeArbitrarySchema(bundledSchema, { strict: false });
  if (warnings.length > 0) {
    log.info(`${sourceFilePath}: ${warnings.length} bundled reference(s) hoisted into #/definitions.`);
  }
  log.info(`${sourceFilePath} external references resolved and bundled.`);
  return schema;
}

function hasNonLocalReferences(node: unknown): boolean {
  if (!node || typeof node !== "object") return false;
  const value = node as Record<string, unknown>;
  if (typeof value.$ref === "string" && !value.$ref.startsWith("#")) return true;
  return Object.values(value).some(hasNonLocalReferences);
}

export async function jsonSchemaToDocumentation(configData: SpecToolkitConfigurationDocument): Promise<void> {
  // Iterate the files and generate the documentation
  for (const docConfig of configData.docsConfig) {
    const strictMode = (configData.generalConfig?.schemaMode ?? "strict") === "strict";
    // Read JSON File. path.resolve honors an absolute sourceFilePath as-is; a
    // relative one still resolves against the current working directory.
    const jsonSchemaFileParsed = await loadSpecJsonSchema(docConfig.sourceFilePath, strictMode);

    // The Spec JSON Schema based Specification
    let jsonSchemaRoot = preprocessSpecJsonSchema(jsonSchemaFileParsed);

    // Tolerant mode: normalize arbitrary JSON Schemas into the shape the
    // renderer and validator expect (hoist inline objects and inline
    // composition branches into #/definitions, add missing object `type`),
    // warning on each rewrite instead of rejecting the schema. Schemas already
    // authored to the conventions pass through unchanged.
    const normalized = normalizeArbitrarySchema(jsonSchemaRoot, { strict: strictMode });
    if (!strictMode) jsonSchemaRoot = normalized.schema;
    if (normalized.warnings.length > 0) {
      log.warn(
        `${docConfig.sourceFilePath}: ${normalized.warnings.length} schema normalization(s) applied for documentation generation (see warnings above).`,
      );
    }
    log.info(`${docConfig.sourceFilePath} loaded and prepared.`);

    // Read extension target file if given
    let specTarget: SpecTarget | undefined;
    if (docConfig.type === "specExtension") {
      const target = configData.docsConfig.find((config) => config.id === docConfig.targetDocumentId);
      if (target) {
        const file = fs.readFileSync(target.sourceFilePath).toString();
        specTarget = {
          extensionTarget: loadYaml(file) as SpecJsonSchemaRoot,
          targetDocumentId: docConfig.targetDocumentId,
        };
      } else {
        log.error(
          `Spec extensions are merged into main specs, but there was no valid "targetDocumentId" defined for specExtension with "id": ${docConfig.id}`,
        );
      }
    }

    // Validate JSON Schema to be a valid JSON Schema document
    validateSpecJsonSchema(jsonSchemaRoot, docConfig.sourceFilePath);

    const mdFrontmatter = getMarkdownFrontMatter(docConfig.mdFrontmatter);
    const introText = readTextFromFile(docConfig.sourceIntroFilePath);
    const outroText = readTextFromFile(docConfig.sourceOutroFilePath);
    const text = generateMarkdown(
      jsonSchemaRoot,
      docConfig.id,
      docConfig.type,
      specTarget,
      mdFrontmatter,
      introText,
      outroText,
    );

    // Write Markdown Documentation
    let filePath = "";
    if (docConfig.type === "spec") {
      filePath = `${getOutputPath()}/${documentationOutputFolderName}/${docConfig.id}.md`;
    } else if (docConfig.type === "specExtension") {
      filePath = `${getOutputPath()}/${documentationExtensionsOutputFolderName}/${docConfig.id}.md`;
    }
    fs.outputFileSync(filePath, text);
    log.info(`Written: ${filePath}`);

    // Missing object types are inferred only to help the documentation renderer.
    // Remove them before writing the generated schema so its validation semantics stay unchanged.
    for (const node of normalized.inferredObjectNodes) delete node.type;

    writeSpecJsonSchemaFiles(
      `${getOutputPath()}/${schemasOutputFolderName}/${docConfig.id}.schema.json`,
      jsonSchemaRoot,
    );

    log.info("--------------------------------------------------------------------------");
  }
}

////////////////////////////////////////////////////////////
// ------------------ Output Functions - ------------------
////////////////////////////////////////////////////////////

export function writeSpecJsonSchemaFiles(
  filePath: string,
  jsonSchema: SpecJsonSchemaRoot,
  preservedCoreSpecificXProperties: string[] = [],
  isMainSchema?: boolean,
): void {
  const refConvertedJsonSchema = convertRefToDocToStandardRef(jsonSchema);

  // NOTE: only for "main" schemas we remove the spec-toolkit specific x- properties and write the cleaned-up version to file system
  // all other auto-generated "extensions" schemas will keep all the x- properties
  // as they cannot be understood by readers without them
  if (isMainSchema) {
    // Clean up the JSON Schema from everything spec specific
    const jsonSchema1 = removeDescriptionsFromRefPointers(refConvertedJsonSchema);
    const jsonSchema2 = removeSomeExtensionProperties(jsonSchema1, preservedCoreSpecificXProperties);

    // write it as schema file that does not include all the x- extensions
    fs.outputFileSync(filePath, JSON.stringify(jsonSchema2, null, 2));

    // temporary write it as schema file that includes all the x- extensions to filesystem
    // needed for the typescript types generation and the file will be deleted afterwards
    const xSchemaFileName = filePath.split(".json").join(".x.json");
    fs.outputFileSync(
      xSchemaFileName,
      JSON.stringify(
        {
          description: "JSON Schema with custom (x-) properties",
          ...refConvertedJsonSchema,
        },
        null,
        2,
      ),
    );
    log.info(`Write to file system temporary file ${xSchemaFileName}`);
  } else {
    // write it as schema file that includes all the x- extensions
    fs.outputFileSync(
      filePath,
      JSON.stringify(
        {
          description: "JSON Schema with custom (x-) properties",
          ...refConvertedJsonSchema,
        },
        null,
        2,
      ),
    );
  }
}
