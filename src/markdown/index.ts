import _ from "lodash";
import { SpecJsonSchemaRoot } from "../generated/spec/spec-v1/types/index.js";
import { extensionFolderDiffToOutputFolderName } from "../generate.js";
import {
  getAnchorLinkFromTitle,
  getExtensionOverviewTable,
  getObjectDescriptionTable,
  getJsonSchemaExamples,
  jsonSchemaToMd,
} from "./generateMarkdownUtils.js";

export type SpecTarget = {
  targetDocumentId: string;
  extensionTarget: SpecJsonSchemaRoot;
};

/**
 * Generate Markdown file content documentation from a JSON Schema.
 *
 * @param jsonSchemaRoot
 * @param specId
 * @param specType - "spec" | "specExtension"
 * @param specTarget - when specType is "specExtension", specTarget must be defined, when specType is "spec" specTarget must be undefined
 * @param mdFrontmatter
 * @param sourceIntroContent
 * @param sourceOutroContent
 * @returns
 */
export function generateMarkdown(
  jsonSchemaRoot: SpecJsonSchemaRoot,
  specId: string,
  specType: "spec" | "specExtension",
  specTarget: SpecTarget | undefined,
  mdFrontmatter?: string,
  sourceIntroContent?: string,
  sourceOutroContent?: string,
): string {
  // Write Header Information
  let text = mdFrontmatter ? mdFrontmatter : "";

  // Write Intro Text
  text += sourceIntroContent ? sourceIntroContent : "";

  text += "\n\n## Schema Definitions\n\n";

  if (specType === "specExtension") {
    text += `* This is an extension vocabulary for [${specTarget?.extensionTarget.title}](${extensionFolderDiffToOutputFolderName + specTarget?.targetDocumentId}).\n`;
  } else if (specType === "spec") {
    if (jsonSchemaRoot.title) {
      const link = getAnchorLinkFromTitle(jsonSchemaRoot.title);
      text += `* The root schema of the document is [${jsonSchemaRoot.title}](${link})\n`;
    } else {
      throw new Error(
        `Every JSON Schema object need to have a title. Problem: ${JSON.stringify(jsonSchemaRoot, null, 2)}`,
      );
    }
  }

  if (jsonSchemaRoot.$id) {
    // TODO: Add those links depending on config
    // text += `* Example files can be found [here](/spec-v1/examples/${title.toLocaleLowerCase()}).\n`
    // text += `* Visual diagrams can be found here: [ORD ${title} Class Diagram](/spec-v1/diagrams/${title}.md).\n`
    text += `* The interface is available as JSON Schema: [${specId}.schema.json](${jsonSchemaRoot.$id}).\n`;
    // text += `* A high-level overview can also be exported as [Excel](/spec-v1/interfaces/${docConfig.title}.xlsx) and [CSV](/spec-v1/interfaces/${docConfig.title}.csv) file.\n`
  }

  // If main spec: Create root document entry point
  if (specType === "spec") {
    text += `\n\n### ${jsonSchemaRoot.title}\n\n`;
    text += getObjectDescriptionTable(jsonSchemaRoot, jsonSchemaRoot, undefined);
  }
  // If extension: Create extension property overview table
  else if (specType === "specExtension") {
    text += getExtensionOverviewTable(jsonSchemaRoot);
  }

  // Document definitions block
  if (jsonSchemaRoot.definitions) {
    const definitionEntries = Object.keys(jsonSchemaRoot.definitions);
    const propertyOrder = jsonSchemaRoot["x-property-order"] || [];

    const finalPropertyOrder = _.union(propertyOrder, definitionEntries);

    // Refactor: Loop within jsonSchemaToMd, then we don't have to pass definition name
    for (const definitionName of finalPropertyOrder) {
      const definition = jsonSchemaRoot.definitions[definitionName];
      if (definition) {
        text += jsonSchemaToMd(definition, jsonSchemaRoot, specType === "specExtension" ? specTarget : undefined);
      } else {
        throw new Error(
          `Array item definition "${definitionName}" used in x-property-order was not found in the existing definitions block of the JSON Schema.`,
        );
      }
    }
  }

  if (jsonSchemaRoot.examples && Array.isArray(jsonSchemaRoot.examples)) {
    text += "\n## Complete Examples\n";
    text += getJsonSchemaExamples(jsonSchemaRoot, jsonSchemaRoot, "jsCodeBlock");
    text += "\n";
  }

  // Write Outro Text
  text += sourceOutroContent ? sourceOutroContent : "";

  return text;
}
