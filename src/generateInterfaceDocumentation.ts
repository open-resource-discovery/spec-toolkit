#!/usr/bin/env node

// The documentation how this script works and it's constraints
// can be found at the jsonSchemaToDocumentation() function definition

/**
 * Refactoring Ideas / TODOs:
 * * Share same code to generate descriptions for schemas inside AND outside of an object table
 * * Add **Type**: consistently for non-object Definition entries
 */

import { readTextFromFile } from "./model/config.js";
import { SpecJsonSchemaRoot } from "./generated/spec/spec-v1/types/index.js";
import { SpecToolkitConfigurationDocument } from "./generated/spec-toolkit-config/spec-v1/types/index.js";
import { getMarkdownFrontMatter } from "./util/markdownTextHelper.js";
import { validateSpecJsonSchema } from "./util/validation.js";
import {
  preprocessSpecJsonSchema,
  removeDescriptionsFromRefPointers,
  removeSomeExtensionProperties,
  convertRefToDocToStandardRef,
} from "./util/jsonSchemaConversion.js";

import _ from "lodash";
import fs from "fs-extra";
import { log } from "./util/log.js";
import path from "path";
import yaml from "js-yaml";
import {
  documentationExtensionsOutputFolderName,
  documentationOutputFolderName,
  getOutputPath,
  schemasOutputFolderName,
} from "./generate.js";
import { generateMarkdown, SpecTarget } from "./markdown/index.js";

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
export function jsonSchemaToDocumentation(configData: SpecToolkitConfigurationDocument): void {
  // Iterate the files and generate the documentation
  for (const docConfig of configData.docsConfig) {
    // Read JSON File
    const jsonSchemaFile = fs.readFileSync(path.join(process.cwd(), docConfig.sourceFilePath)).toString();
    // TODO: validate here before casting it as SpecJsonSchemaRoot, or probably even better validate outside of the for loop
    const jsonSchemaFileParsed = yaml.load(jsonSchemaFile) as SpecJsonSchemaRoot;

    // The Spec JSON Schema based Specification
    const jsonSchemaRoot = preprocessSpecJsonSchema(jsonSchemaFileParsed);
    log.info(`${docConfig.sourceFilePath} loaded and prepared.`);

    // Read extension target file if given
    let specTarget: SpecTarget | undefined = undefined;
    if (docConfig.type === "specExtension") {
      const target = configData.docsConfig.find((config) => config.id === docConfig.targetDocumentId);
      if (target) {
        const file = fs.readFileSync(target.sourceFilePath).toString();
        specTarget = {
          extensionTarget: yaml.load(file) as SpecJsonSchemaRoot,
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
      filePath = getOutputPath() + `/${documentationOutputFolderName}/${docConfig.id}.md`;
    } else if (docConfig.type === "specExtension") {
      filePath = getOutputPath() + `/${documentationExtensionsOutputFolderName}/${docConfig.id}.md`;
    }
    fs.outputFileSync(filePath, text);
    log.info(`Written: ${filePath}`);

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
  isMainSchema?: boolean,
): void {
  const refConvertedJsonSchema = convertRefToDocToStandardRef(jsonSchema);

  // NOTE: only for "main" schemas we remove the spec-toolkit specific x- properties and write the cleaned-up version to file system
  // all other auto-generated "extensions" schemas will keep all the x- properties
  // as they cannot be understood by readers without them
  if (isMainSchema) {
    // Clean up the JSON Schema from everything spec specific
    const jsonSchema1 = removeDescriptionsFromRefPointers(refConvertedJsonSchema);
    const jsonSchema2 = removeSomeExtensionProperties(jsonSchema1);

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
