import { SpecJsonSchema } from "../generated/spec/spec-v1/types/index.js";
import { getAnchorLinkFromTitle } from "./markdownTextHelper.js";
export function getTitleFromSchemaObject(jsonSchemaObject: SpecJsonSchema): string {
  if (!jsonSchemaObject.title) {
    throw new Error(`Schema Object must have a "title" keyword!\n ${JSON.stringify(jsonSchemaObject, null, 2)}`);
  }
  return jsonSchemaObject.title;
}

/** returns a sanitized ID for the schema object / thing */
export function getIdForSchema(jsonSchemaObject: SpecJsonSchema): string {
  if (!jsonSchemaObject.title) {
    throw new Error(`Schema Object must have a "title" keyword!\n ${JSON.stringify(jsonSchemaObject, null, 2)}`);
  }
  // TODO: Fix this. The title shouldn't have the anchor tag hashtag link
  return getAnchorLinkFromTitle(jsonSchemaObject.title.replace("#", ""));
}

export function getHashIdForProperty(schemaObjectId: string, propertyName: string): string {
  return `${schemaObjectId}_${propertyName}`.toLowerCase().replace("#", "");
}
