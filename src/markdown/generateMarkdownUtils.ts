import _ from "lodash";
import { SpecExtensionJsonSchema, SpecJsonSchema, SpecJsonSchemaRoot } from "../generated/spec/spec-v1/types/index.js";
import { log } from "../util/log.js";
import { SpecTarget } from "./index.js";
import { checkRequiredPropertiesExist, validateDefault, validateExamples } from "../util/validation.js";
import { documentationOutputFolderName, extensionFolderDiffToOutputFolderName, getOutputPath } from "../generate.js";
import assert from "assert";
import GfmEscape from "gfm-escape";
const escaper = new GfmEscape({ table: true });

/**
 * Converts a Spec JSON Schema to markdown documentation
 *
 * For JSON Objects, it will choose a table renderer
 */
export function jsonSchemaToMd(
  jsonSchemaObject: SpecJsonSchema,
  jsonSchemaRoot: SpecJsonSchemaRoot,
  specTarget: SpecTarget | undefined,
): string {
  let text = "";

  if (jsonSchemaObject["x-abstract"]) {
    return text;
  }

  jsonSchemaObject = _.cloneDeep(jsonSchemaObject);

  const title = getTitleFromSchemaObject(jsonSchemaObject);

  const headerLevelNumber = jsonSchemaObject["x-header-level"];
  if (headerLevelNumber) {
    const mdHeaderLevel = "#".repeat(headerLevelNumber);
    text += `\n${mdHeaderLevel} ${title}\n\n`;
  } else {
    text += `\n### ${title}\n\n`;
  }

  // is this an object currently in development?
  if (jsonSchemaObject["x-feature-status"]) {
    const status = jsonSchemaObject["x-feature-status"];
    text += `<span className="feature-status-${status}" title="This feature is ${status.toUpperCase()} status and subject to potential changes.">${status.toUpperCase()}</span> \n\n`;
  }

  // add introduction text of the object
  if (jsonSchemaObject.description) {
    text += `${jsonSchemaObject.description.trim()}\n\n`;
  }
  const castedJsonSchemaObject = jsonSchemaObject as SpecExtensionJsonSchema;
  // Distinction if this is an object or a simple type
  if (
    !jsonSchemaObject.type &&
    !jsonSchemaObject.oneOf &&
    !jsonSchemaObject.anyOf &&
    !castedJsonSchemaObject["x-ref-to-doc"]
  ) {
    throw new Error(`Schema Object must have a "type" keyword! ${JSON.stringify(jsonSchemaObject, null, 2)}`);
  }

  // Document extensions towards other target documents
  if (castedJsonSchemaObject["x-extension-targets"] && specTarget) {
    text += `**Scope:** ${castedJsonSchemaObject["x-extension-targets"].join(", ")}<br/>\n`;
    text += `**Extending:** `;

    for (const extensionPoint of castedJsonSchemaObject["x-extension-targets"]) {
      let found = 0;
      // Find extension point
      for (const definitionName in specTarget.extensionTarget.definitions) {
        const definition = specTarget.extensionTarget.definitions[definitionName];
        if (
          definition["x-extension-points"] &&
          definition["x-extension-points"].includes(extensionPoint) &&
          specTarget.targetDocumentId
        ) {
          text += `[${definitionName}](${extensionFolderDiffToOutputFolderName + specTarget.targetDocumentId}${getAnchorLinkFromTitle(definition.title)}), `;
          found++;
        }
      }
      if (!found) {
        throw new Error(`Could not find extension point "${extensionPoint}" in extension target file.`);
      }
    }
    text = text.substring(0, text.length - 2) + "<br/>\n";
  }

  // is this an object with a reference to core?
  // TODO: not sure if I understand this code. Consider refactoring here
  const refToDoc =
    typeof jsonSchemaObject === "object" && "x-ref-to-doc" in jsonSchemaObject ? jsonSchemaObject["x-ref-to-doc"] : "";
  if (jsonSchemaObject.type === "object" && !refToDoc) {
    text += getObjectDescriptionTable(
      jsonSchemaObject,
      jsonSchemaRoot,
      specTarget ? specTarget.targetDocumentId : undefined,
    );
  } else {
    text += generatePrimitiveTypeDescription(
      jsonSchemaObject,
      jsonSchemaRoot,
      specTarget ? specTarget.targetDocumentId : undefined,
    );
  }
  return text;
}

//----------------------------------------------------------------------------------------------
// ------------ Functions to Calculate certain Texts for MD ------------------------------------
//----------------------------------------------------------------------------------------------

function handleRefToCore(jsonSchemaObject: SpecJsonSchema): string {
  //Resolve RefToCores
  const refToDoc =
    typeof jsonSchemaObject === "object" && "x-ref-to-doc" in jsonSchemaObject ? jsonSchemaObject["x-ref-to-doc"] : "";
  if (refToDoc) {
    let refToDocTitle = "";
    let refToDocDocId = "";
    let refToDocDoc = "";
    if (typeof refToDoc === "object" && refToDoc !== undefined) {
      refToDocTitle = "title" in refToDoc ? refToDoc.title + "" : ""; // TODO: Simplify this
      refToDocDocId = "$refDoc" in refToDoc ? refToDoc.$refDoc + "" : ""; // TODO: Simplify this
      refToDocDoc = `${getOutputPath()}/${documentationOutputFolderName}/${refToDocDocId}.md`;
    }
    //TODO: Calculate RefToCore from Document Title?
    //TODO: remove calculation, use general function
    return `[${refToDocTitle}](${refToDocDoc}#${refToDocTitle.toLowerCase().replace(/ /g, "-").replace("#/definitions/", "")})`;
  } else return "";
}
//Calculates the Text for the "Type Column Entry"
function getTypeColumnText(
  jsonSchemaObject: SpecJsonSchema,
  jsonSchemaRoot: SpecJsonSchemaRoot,
  targetDocumentId: string | undefined,
): string {
  const castedJsonSchemaObject = jsonSchemaObject as SpecExtensionJsonSchema;

  // in case of an Array: Array< Type of ArrayItems>
  if (jsonSchemaObject && jsonSchemaObject.type === "array") {
    return escapeHtmlChars(
      `Array<${getTypeColumnText(jsonSchemaObject.items as SpecJsonSchema, jsonSchemaRoot, targetDocumentId)}>`,
    );
  }
  // in case of a reference link to the reference object
  else if (jsonSchemaObject && jsonSchemaObject.$ref) {
    return getMdLinkFromRef(jsonSchemaObject.$ref, jsonSchemaObject, jsonSchemaRoot);
  }
  // in case it is an object through an error that $ ref should be used!
  else if (jsonSchemaObject && jsonSchemaObject.type === "object") {
    // Check if we have a reference to another file
    const text = handleRefToCore(jsonSchemaObject);
    if (text) {
      return text;
    } else {
      throw new Error(
        `ERROR: Objects nested in objects are not supported. Please move the inline object to #/definitions and use $ref! Currently at ${JSON.stringify(
          jsonSchemaObject,
          null,
          2,
        )}`,
      );
    }
  }
  //in case it is a primitive type just return it
  else if (castedJsonSchemaObject["x-ref-to-doc"]) {
    return `[${castedJsonSchemaObject["x-ref-to-doc"].title}](${extensionFolderDiffToOutputFolderName + targetDocumentId}${getAnchorLinkFromTitle(castedJsonSchemaObject["x-ref-to-doc"].title)})`;
  }
  // if its referencing to an interface in another document, create a cross-page link:
  else if (jsonSchemaObject && jsonSchemaObject.type) {
    return jsonSchemaObject.type as string;
  }
  //in case it is a anyOf: option 1 | option 2 | option 3 ...
  else if (jsonSchemaObject && jsonSchemaObject.anyOf) {
    const anyOfReferences: string[] = [];
    for (const anyOf of jsonSchemaObject.anyOf) {
      if (!anyOf.$ref) {
        throw new Error("anyOf needs to use $refs");
      }
      anyOfReferences.push(getMdLinkFromRef(anyOf.$ref, jsonSchemaObject, jsonSchemaRoot));
    }
    return anyOfReferences.join(" \\| ");
  }
  //in case it is a oneOf: option 1 | option 2 | option 3 ...
  //TODO: the syntax is exactly the same as anyOf - Is this correct?
  else if (jsonSchemaObject && jsonSchemaObject.oneOf) {
    return oneOfReferenceHandling(jsonSchemaObject, jsonSchemaRoot);
  } else if (jsonSchemaObject && jsonSchemaObject.allOf) {
    return allOfReferenceHandling(jsonSchemaObject, jsonSchemaRoot);
  } else {
    //Check if we have a reference to another file
    const text = handleRefToCore(jsonSchemaObject);
    if (text) {
      return text;
    } else {
      //in no other case than we do not support the type
      throw new Error(`Could not determine type for\n ${JSON.stringify(jsonSchemaObject, null, 2)}`);
    }
  }
}

function oneOfReferenceHandling(jsonSchemaObject: SpecJsonSchema, jsonSchemaRoot: SpecJsonSchemaRoot): string {
  const oneOfReferences: string[] = [];
  if (jsonSchemaObject.oneOf) {
    for (const oneOf of jsonSchemaObject.oneOf) {
      if (!oneOf.$ref) {
        throw new Error("oneOf needs to use $refs");
      }
      oneOfReferences.push(getMdLinkFromRef(oneOf.$ref, jsonSchemaObject, jsonSchemaRoot));
    }
    return oneOfReferences.join(" \\| ");
  }
  return "";
}

function allOfReferenceHandling(jsonSchemaObject: SpecJsonSchema, jsonSchemaRoot: SpecJsonSchemaRoot): string {
  const allOfReferences: string[] = [];
  if (jsonSchemaObject.allOf) {
    for (const allOf of jsonSchemaObject.allOf) {
      if (allOf.$ref) {
        allOfReferences.push(getMdLinkFromRef(allOf.$ref, jsonSchemaObject, jsonSchemaRoot));
      } else if (allOf.if && allOf.then && allOf.then.$ref) {
        allOfReferences.push(getMdLinkFromRef(allOf.then.$ref, jsonSchemaObject, jsonSchemaRoot));
      } else {
        throw new Error("allOf needs to use $refs or if/then with $ref");
      }
    }
    return allOfReferences.join(" \\| ");
  }
  return "";
}

//-- Calculates Text for the first column "Property" including Property Name, mandatory/optional/recommended as well as the anchor link
function getObjectPropertyEntryText(
  jsonSchemaObject: SpecJsonSchema,
  property: SpecJsonSchema,
  propertyName: string,
  propertyId: string,
): string {
  //Get Property Required Entry
  const required = getRequired(jsonSchemaObject, propertyName);

  //First Entry in Property Text is Name
  let propertyText = `${propertyName}`;
  //Decide for the "mandatory, recommended,..." entry

  if (required === "mandatory") {
    propertyText += '<br/><span className="mandatory">MANDATORY</span>';
  } else if (required === "recommended") {
    propertyText += '<br/><span className="recommended">RECOMMENDED</span>';
  } else {
    propertyText += '<br/><span className="optional">OPTIONAL</span>';
  }

  if (property["x-deprecation-text"]) {
    propertyText += `${escapeMdInTable(`<br/><span className="deprecated" title="${property["x-deprecation-text"]}">DEPRECATED</span>`)}`;
  }

  //add comment if Property is still in "development"
  if (property["x-feature-status"]) {
    const status = property["x-feature-status"];
    propertyText += ` <span className="feature-status-${status}" title="This feature is ${status.toUpperCase()} status and subject to potential changes.">${status.toUpperCase()}</span>`;
  }

  // Add anchor tag link
  log.info(propertyId);
  const link = getAnchorLinkFromTitle(propertyId);
  propertyText += `<a className="hash-link" href="${link}" title="${link}"></a>`;
  return propertyText;
}

//-- Calculates the text for the entries of the properties
function getPropertiesTableEntryText(
  jsonSchemaObject: SpecJsonSchema,
  jsonSchemaRoot: SpecJsonSchemaRoot,
  targetDocumentId: string | undefined,
): string {
  let text = "";
  // Iterate the Properties to fill the table
  if (jsonSchemaObject.properties) {
    //get properties
    const properties = Object.keys(jsonSchemaObject.properties);

    for (const propertyName of properties) {
      // get Property to hand over to functions
      const property = jsonSchemaObject.properties[propertyName];

      if (property["x-hide-property"]) {
        continue;
      }

      // Get Information of the Properties
      const type = getTypeColumnText(property, jsonSchemaRoot, targetDocumentId);
      let description = getDescriptionWithinTable(property, jsonSchemaRoot);

      if (!description) {
        if (property.$ref) {
          const referencedSchema = getReferencedSchema(
            property.$ref,
            jsonSchemaRoot,
            `${jsonSchemaObject.title} > ${propertyName}`,
          );
          if (referencedSchema && referencedSchema.description) {
            description = escapeMdInTable(referencedSchema.description);
            log.debug(`Inheriting description for ${jsonSchemaObject.title} > ${propertyName}`);
          } else {
            log.warn(`Missing description for ${jsonSchemaObject.title} > ${propertyName}`);
          }
        }
      }

      // TODO: Properly handle propertyId, without getting an anchor tag first and then removing it again.
      const propertyId = getHashIdForProperty(getSchemaObjectId(jsonSchemaObject), propertyName);

      //Get the text of the property
      const propertyText = getObjectPropertyEntryText(jsonSchemaObject, property, propertyName, propertyId);

      //Build Text of the Table
      text += `|<div className="interface-property-name anchor" id="${propertyId}">${propertyText}</div>`;
      text += `|<div className="interface-property-type">${type}</div>`;
      text += `|<div className="interface-property-description">${description}</div>|\n`;
    }
  }
  return text;
}

//-- Calculates the text for the entries of the pattern properties
function getPatternPropertiesTableEntryText(
  jsonSchemaObject: SpecJsonSchema,
  jsonSchemaRoot: SpecJsonSchemaRoot,
): string {
  let text = "";
  //Iterate the pattern Properties and add them to the table (optional)
  if (jsonSchemaObject.patternProperties) {
    for (const pattern in jsonSchemaObject.patternProperties) {
      //get the Pattern
      const value = jsonSchemaObject.patternProperties[pattern];
      const valueItems = value.items as SpecJsonSchema;

      //calculate the value Type(s) of the Pattern
      let valueType = value.type?.toString() || "string";
      if (Array.isArray(value.type)) {
        valueType = value.type.join(" \\| ");
      }
      if (valueItems && valueItems.type) {
        valueType = escapeHtmlChars(`${valueType}<${valueItems.type}>`);
      }

      // Support direct (singular) $ref
      if (value.$ref) {
        valueType = getMdLinkFromRef(value.$ref, value, jsonSchemaRoot);
      }

      // Support oneOf (multiple) $refs
      if (value.oneOf) {
        const links: string[] = [];
        for (const oneOf of value.oneOf) {
          if (oneOf.$ref) {
            links.push(getMdLinkFromRef(oneOf.$ref, value, jsonSchemaRoot));
          } else {
            log.error(`Unsupported patternProperties oneOf without $ref`, value);
          }
        }
        valueType = links.join(" \\| ");
      }

      //// Support if/then/else
      // TODO: code is actually there and works but there is no use case yet in the schema
      // if (value.if && value.then && value.else) {
      //   const links: string[] = [];
      //   if (value.then.$ref) {
      //     links.push(getMdLinkFromRef(value.then.$ref, value, definitions));
      //   } else {
      //     log.error(`Unsupported patternProperties oneOf without $ref`, value);
      //   }
      //   if (value.else.$ref) {
      //     links.push(getMdLinkFromRef(value.else.$ref, value, definitions));
      //   } else {
      //     log.error(`Unsupported patternProperties if/else/then without $ref`, value);
      //   }
      //   valueType = links.join(" \\| ");
      // }

      text += `| Additional Properties<br/><i>${escapeRegexpInTable(pattern)}</i><br/><span className="optional">OPTIONAL</span>`;

      if (jsonSchemaObject["x-pattern-properties-description"]) {
        text += `<p>${jsonSchemaObject["x-pattern-properties-description"]}</p>`;
      }
      text += ` | ${valueType} | `;
      if (value.description) {
        text += `${escapeMdInTable(value.description.trim())}`;
        text += `<br/><br/><i>Additional properties MUST follow key name regexp pattern</i>: ${escapeRegexpInTable(pattern)}`;
      } else {
        text += `<i>Additional properties MUST follow key name regexp pattern</i>: ${escapeRegexpInTable(pattern)}`;
      }
      text += " |\n";
    }
  }
  return text;
}

/**
 * Adds default value
 * Will also validate that the default value matches the jsonSchemaObject type
 */
export function getJsonSchemaObjectDefault(
  jsonSchemaObject: SpecJsonSchema,
  jsonSchemaRoot: SpecJsonSchemaRoot,
): string {
  if (jsonSchemaObject.default !== undefined) {
    // Validate default before adding it
    validateDefault(jsonSchemaObject, jsonSchemaRoot);
    if (jsonSchemaObject["x-extension-targets"]) {
      log.info("empty title");
    }
    return `**Default Value**: ${escapeTextInTable(jsonSchemaObject.default, false)}`;
  }
  return "";
}

/**
 * Adds example values
 * Will also validate that the examples match the jsonSchemaObject type
 */
export function getJsonSchemaObjectExamples(
  jsonSchemaObject: SpecJsonSchema,
  jsonSchemaRoot: SpecJsonSchemaRoot,
  resultAs: "htmlListTag" | "jsCodeBlock",
): string {
  let text = "";

  if (jsonSchemaObject.examples && Array.isArray(jsonSchemaObject.examples)) {
    // Validate Examples before adding them
    validateExamples(jsonSchemaObject, jsonSchemaRoot);

    // Add all Examples to Text
    for (const example of jsonSchemaObject.examples) {
      if (resultAs === "htmlListTag") {
        text += `<li>${escapeTextInTable(example)}</li>`;
      } else {
        text += "\n\n```js\n";
        text += JSON.stringify(example, null, 2);
        text += "\n```\n";
      }
    }

    return text;
  }
  return "";
}

/**
 * Documents a JSON Object as a Table
 * Properties will be table rows.
 *
 * Documentation stops at associations and composition of other objects ($ref)
 * Array of primitive type is allowed, so are oneOf / anyOf with simple types or references.
 */
export function getObjectDescriptionTable(
  jsonSchemaObject: SpecJsonSchema,
  jsonSchemaRoot: SpecJsonSchemaRoot,
  targetDocumentId: string | undefined,
): string {
  let text = "";

  if (jsonSchemaObject.allOf) {
    // we write "One of the following" in the generated UI because we use allOf with discriminator "kind"
    // and don't want to confuse the end users with terms like "All of the following"
    // text += "**One of the following**: \n";
    text += "**Type**: \n";
    text += allOfReferenceHandling(jsonSchemaObject, jsonSchemaRoot);
    text += "<br/>\n";
  }

  if (!jsonSchemaObject["x-hide-properties"]) {
    if (jsonSchemaObject.properties || jsonSchemaObject.patternProperties) {
      // Add overview type
      // TODO: Consider making this an option. Maybe dependent on how many properties there are?
      if (jsonSchemaObject.properties) {
        // Filter our hidden properties
        const objectProperties = [];
        for (const propertyName in jsonSchemaObject.properties) {
          if (!jsonSchemaObject.properties[propertyName]["x-hide-property"]) {
            objectProperties.push(propertyName);
          }
        }
        const propertiesList = objectProperties.map((propertyName) => {
          const propertyId = getHashIdForProperty(getSchemaObjectId(jsonSchemaObject), propertyName);
          return `<a href="#${propertyId}">${propertyName}</a>`;
        });
        text += `**Type**: Object(${propertiesList.join(", ")})\n\n`;
      }

      //create object table header
      text += "| Property | Type | Description |\n";
      text += "| -------- | ---- | ----------- |\n";

      //Object does have to have properties for the following
      //Remark: Root Object (definitions) does not have properties
      //TODO: is it possible that an entry can also have only "Pattern Properties?"
      if (jsonSchemaObject.properties) {
        //Check if Required Properties exist
        checkRequiredPropertiesExist(jsonSchemaObject);

        //Add Properties
        text += getPropertiesTableEntryText(jsonSchemaObject, jsonSchemaRoot, targetDocumentId);
      }

      //Add Pattern Properties
      text += getPatternPropertiesTableEntryText(jsonSchemaObject, jsonSchemaRoot);

      //Add information about additional properties
      if (jsonSchemaObject.additionalProperties) {
        text += "| <i>*</i> | | <i>Additional, unspecified properties MAY be added to the object</i>. |\n";
      }
      text += "\n";
    } else {
      // TODO: log filename in which the error occurred
      // log.error(`Error in file ${specConfig.sourceFilePath}`);
      throw new Error(
        `Expected object with title "${jsonSchemaObject.title}" to have either "properties" or "patternProperties" defined.`,
      );
    }
  }

  if (jsonSchemaObject.oneOf) {
    text += "One of the following: \n";
    text += oneOfReferenceHandling(jsonSchemaObject, jsonSchemaRoot);
    text += "<br/>\n";
  }

  if (jsonSchemaObject.examples && Array.isArray(jsonSchemaObject.examples)) {
    text += `\n###### Example Values:\n`;
    text += getJsonSchemaObjectExamples(jsonSchemaObject, jsonSchemaRoot, "jsCodeBlock");
    text += "\n";
  }

  return text;
}

export function getExtensionOverviewTable(jsonSchema: SpecJsonSchemaRoot): string {
  let text = "\n### Annotations Overview\n\n";

  text += "| Annotation | Scope | Description |\n";
  text += "| -------- | ---- | ----------- |\n";

  for (const definitionName in jsonSchema.definitions) {
    const definition = jsonSchema.definitions[definitionName];
    // Only document the definition which have extension target(s)
    const castedDefinition = definition as SpecExtensionJsonSchema;
    if (castedDefinition["x-extension-targets"]) {
      text += `| [${definitionName}](${getAnchorLinkFromTitle(definitionName)}) | ${castedDefinition["x-extension-targets"].join(", ")} | ${escapeMdInTable(definition.description)} |\n`;
    }
  }
  return text;
}

/**
 * Creates an entry for primitive types that are not inline described in a table (of Objects)
 *
 * TODO: Refactor this to share code with the type descriptions in the Table
 * TODO: Refactor to always just pass the full "root JSON Schema and take definitions from there"
 */
function generatePrimitiveTypeDescription(
  jsonSchemaObject: SpecJsonSchema,
  jsonSchemaRoot: SpecJsonSchemaRoot,
  targetDocumentId: string | undefined,
): string {
  let text = "";

  const type = getTypeColumnText(jsonSchemaObject, jsonSchemaRoot, targetDocumentId);

  if (jsonSchemaObject.type !== undefined) {
    text += `**Type:** ${type}<br/>\n`;
  }

  if (jsonSchemaObject.format !== undefined) {
    text += `**JSON Schema Format**: \`${jsonSchemaObject.format}\`<br/>\n`;
  }

  if (jsonSchemaObject["x-association-target"]) {
    const links = jsonSchemaObject["x-association-target"]
      .map((el) => {
        return getMdLinkFromRef(el, jsonSchemaObject, jsonSchemaRoot);
      })
      .join(" \\| ");
    text += `**Association Target**: ${links}<br/>\n`;
  }

  if (jsonSchemaObject.default !== undefined) {
    text += getJsonSchemaObjectDefault(jsonSchemaObject, jsonSchemaRoot);
    text += "<br/>\n";
  }

  if (jsonSchemaObject.const !== undefined) {
    text += `**Constant Value**: \`${jsonSchemaObject.const}\`<br/>\n`;
  }

  if (jsonSchemaObject.pattern) {
    text += `**Regex Pattern**: ${escapeRegexpInTable(jsonSchemaObject.pattern)}<br/>\n`;
  }
  if (jsonSchemaObject.minLength !== undefined) {
    text += `**Minimum Length**: \`${jsonSchemaObject.minLength}\`<br/>\n`;
  }
  if (jsonSchemaObject.maxLength !== undefined) {
    text += `**Maximum Length**: \`${jsonSchemaObject.maxLength}\`<br/>\n`;
  }

  // Array constraints
  if (jsonSchemaObject.minItems !== undefined) {
    text += `**Array Constraint**: MUST have at least ${jsonSchemaObject.minItems} items<br/>\n`;
  }
  if (jsonSchemaObject.maxItems !== undefined) {
    text += `**Array Constraint**: MUST have at most ${jsonSchemaObject.maxItems} items<br/>\n`;
  }

  // Number constraints
  if (jsonSchemaObject.minimum !== undefined) {
    text += `**Number Constraint**: MUST have a minimum value of ${jsonSchemaObject.minimum}<br/>\n`;
  }
  if (jsonSchemaObject.maximum !== undefined) {
    text += `**Number Constraint**: MUST have a maximum value of ${jsonSchemaObject.maximum}<br/>\n`;
  }
  if (jsonSchemaObject.exclusiveMinimum !== undefined) {
    text += `**Number Constraint**: MUST have an exclusive minimum value of ${jsonSchemaObject.exclusiveMinimum}<br/>\n`;
  }
  if (jsonSchemaObject.exclusiveMaximum !== undefined) {
    text += `**Number Constraint**: MUST have an exclusive maximum value of ${jsonSchemaObject.exclusiveMaximum}<br/>\n`;
  }

  // jsonSchemaObject.definitions = definitions || jsonSchemaObject.definitions

  // List allowed enum values
  if (jsonSchemaObject.enum) {
    text += "**Allowed Values**: <ul>";
    for (const value of jsonSchemaObject.enum) {
      text += `<li>${escapeTextInTable(value, false)}</li>`;
    }
    text += "</ul><br/>\n";
  }
  // Support enums defined as oneOf const
  // See https://github.com/json-schema-org/json-schema-spec/issues/57#issuecomment-247861695
  if (detectOneOfEnum(jsonSchemaObject)) {
    text += getOneOfEnumDescription(jsonSchemaObject) + "\n";
  }

  if (detectOneOfRef(jsonSchemaObject)) {
    text += getOneOfRefDescription(jsonSchemaObject, jsonSchemaRoot) + "\n";
  }

  // Support extensible enums defined as anyOf[] const
  // See https://github.com/json-schema-org/json-schema-spec/issues/57#issuecomment-247861695
  if (detectExtensibleEnum(jsonSchemaObject)) {
    text += getAnyOfDescription(jsonSchemaObject, jsonSchemaRoot, targetDocumentId) + "\n";
  }

  if (jsonSchemaObject["x-introduced-in-version"]) {
    text += `<strong>Introduced in Version</strong>: ${jsonSchemaObject["x-introduced-in-version"]}<br/>\n`;
  }

  if (jsonSchemaObject["x-deprecated-in-version"]) {
    text = addVerticalSeparator(text);
    text += `<strong>Deprecated in Version</strong>: ${jsonSchemaObject["x-deprecated-in-version"]}`;
  }

  const castedJsonSchemaObject = jsonSchemaObject as SpecExtensionJsonSchema;
  if (castedJsonSchemaObject["x-ref-to-doc"]) {
    text += `**External Type**: [${castedJsonSchemaObject["x-ref-to-doc"].title}](${extensionFolderDiffToOutputFolderName + targetDocumentId}${getAnchorLinkFromTitle(castedJsonSchemaObject["x-ref-to-doc"].title)}) <br/>\n`;
  }

  if (text.endsWith("<br/>\n")) {
    text = text.substring(0, text.length - 6) + "\n";
  }

  if (jsonSchemaObject.examples && Array.isArray(jsonSchemaObject.examples)) {
    text += `\n###### Example Values:\n`;
    text += getJsonSchemaObjectExamples(jsonSchemaObject, jsonSchemaRoot, "jsCodeBlock");
    text += "\n";
  }

  text += "\n";

  return text;
}

function getRequired(jsonSchemaObject: SpecJsonSchema, propertyName: string): "mandatory" | "recommended" | "optional" {
  if (jsonSchemaObject.required && jsonSchemaObject.required.includes(propertyName)) {
    return "mandatory";
  } else if (jsonSchemaObject["x-recommended"] && jsonSchemaObject["x-recommended"].includes(propertyName)) {
    return "recommended";
  } else {
    return "optional";
  }
}

function getDescriptionWithinTable(jsonSchemaObject: SpecJsonSchema, jsonSchemaRoot: SpecJsonSchemaRoot): string {
  let result = "";

  if (jsonSchemaObject["x-deprecation-text"]) {
    result += `${escapeMdInTable(
      `<span class="deprecated">DEPRECATION-TEXT</span>: ${jsonSchemaObject["x-deprecation-text"]}`,
    )}<hr/>`;
  }

  if (jsonSchemaObject.title) {
    result += `${escapeMdInTable(jsonSchemaObject.title)}<br/><br/>`;
  }

  if (jsonSchemaObject.description) {
    result += `${escapeMdInTable(jsonSchemaObject.description)}`;
  }

  if (jsonSchemaObject.format) {
    result = addVerticalSeparator(result);
    result += `**JSON Schema Format**: ${escapeTextInTable(jsonSchemaObject.format, false)}`;
  }

  if (jsonSchemaObject["x-association-target"]) {
    const links = jsonSchemaObject["x-association-target"]
      .map((el) => {
        return getMdLinkFromRef(el, jsonSchemaObject, jsonSchemaRoot);
      })
      .join(" \\| ");
    result = addVerticalSeparator(result);
    result += `**Association Target**: ${links}`;
  }

  if (jsonSchemaObject.default !== undefined) {
    result = addVerticalSeparator(result);
    result += getJsonSchemaObjectDefault(jsonSchemaObject, jsonSchemaRoot);
  }

  if (jsonSchemaObject.const !== undefined) {
    result = addVerticalSeparator(result);
    result += `**Constant Value**: ${escapeTextInTable(jsonSchemaObject.const, false)}`;
  }

  if (jsonSchemaObject.pattern) {
    result = addVerticalSeparator(result);
    result += `**Regex Pattern**: ${escapeRegexpInTable(jsonSchemaObject.pattern)}`;
  }
  if (jsonSchemaObject.minLength !== undefined) {
    result = addVerticalSeparator(result);
    result += `**Minimum Length**: ${escapeTextInTable(jsonSchemaObject.minLength, false)}`;
  }
  if (jsonSchemaObject.maxLength !== undefined) {
    result = addVerticalSeparator(result);
    result += `**Maximum Length**: ${escapeTextInTable(jsonSchemaObject.maxLength, false)}`;
  }

  // Array constraints
  if (jsonSchemaObject.minItems !== undefined) {
    result = addVerticalSeparator(result);
    result += `**Array Constraint**: MUST have at least ${jsonSchemaObject.minItems} items`;
  }
  if (jsonSchemaObject.maxItems !== undefined) {
    result = addVerticalSeparator(result);
    result += `**Array Constraint**: MUST have at most ${jsonSchemaObject.maxItems} items`;
  }

  // Number constraints
  if (jsonSchemaObject.minimum !== undefined) {
    result = addVerticalSeparator(result);
    result += `**Number Constraint**: MUST have a minimum value of ${jsonSchemaObject.minimum}`;
  }
  if (jsonSchemaObject.maximum !== undefined) {
    result = addVerticalSeparator(result);
    result += `**Number Constraint**: MUST have a maximum value of ${jsonSchemaObject.maximum}`;
  }
  if (jsonSchemaObject.exclusiveMinimum !== undefined) {
    result = addVerticalSeparator(result);
    result += `**Number Constraint**: MUST have an exclusive minimum value of ${jsonSchemaObject.exclusiveMinimum}`;
  }
  if (jsonSchemaObject.exclusiveMaximum !== undefined) {
    result = addVerticalSeparator(result);
    result += `**Number Constraint**: MUST have an exclusive maximum value of ${jsonSchemaObject.exclusiveMaximum}`;
  }

  if (jsonSchemaObject.items) {
    const items = jsonSchemaObject.items;

    // TODO: This covers just some basic cases of what can be defined within items
    // TODO: Ideally, this would reuse the same logic as above, just nested for array items

    if (items["x-association-target"]) {
      const links = items["x-association-target"]
        .map((el: string) => {
          return getMdLinkFromRef(el, items, jsonSchemaRoot);
        })
        .join(" \\| ");
      result = addVerticalSeparator(result);
      result += `**Array Item Association Target**: ${links}`;
    }

    if (items.format) {
      result = addVerticalSeparator(result);
      result += `**Array Item Format**: ${escapeTextInTable(items.format, false)}`;
    }

    if (items.pattern) {
      result = addVerticalSeparator(result);
      result += `**Array Item Regex Pattern**: ${escapeRegexpInTable(items.pattern)}`;
    }

    if (detectOneOfEnum(jsonSchemaObject.items)) {
      result = addVerticalSeparator(result);
      result += getOneOfEnumDescription(jsonSchemaObject.items, "Array Item Allowed Values");
    }

    if (detectExtensibleEnum(jsonSchemaObject.items)) {
      result = addVerticalSeparator(result);
      result += getAnyOfDescription(jsonSchemaObject.items, jsonSchemaRoot, undefined, "Array Item Allowed Values");
    }
  }

  // TODO: Check if we really don't need this
  // jsonSchemaObject.definitions = definitions || jsonSchemaObject.definitions

  // List allowed enum values
  if (jsonSchemaObject.enum) {
    result = addVerticalSeparator(result);
    result += "**Allowed Values**: <ul>";
    for (const value of jsonSchemaObject.enum) {
      result += `<li>${escapeTextInTable(value)}</li>`;
    }
    result += "</ul>";
  }

  // Support enums defined as oneOf const
  // See https://github.com/json-schema-org/json-schema-spec/issues/57#issuecomment-247861695
  if (detectOneOfEnum(jsonSchemaObject)) {
    result = addVerticalSeparator(result);
    result += getOneOfEnumDescription(jsonSchemaObject);
  }

  if (detectOneOfRef(jsonSchemaObject)) {
    result = addVerticalSeparator(result);
    result += getOneOfRefDescription(jsonSchemaObject, jsonSchemaRoot);
  }

  if (jsonSchemaObject.allOf) {
    result = addVerticalSeparator(result);
    result += getAllOfRefDescription(jsonSchemaObject, jsonSchemaRoot);
  }

  // Support extensible enums defined as anyOf[] const
  // See https://github.com/json-schema-org/json-schema-spec/issues/57#issuecomment-247861695
  if (detectExtensibleEnum(jsonSchemaObject)) {
    result = addVerticalSeparator(result);
    result += getAnyOfDescription(jsonSchemaObject, jsonSchemaRoot, undefined, "Array Item Allowed Values");
  }

  if (jsonSchemaObject["x-introduced-in-version"]) {
    result = addVerticalSeparator(result);
    result += `<strong>Introduced in Version</strong>: ${jsonSchemaObject["x-introduced-in-version"]}`;
  }

  if (jsonSchemaObject["x-deprecated-in-version"]) {
    result = addVerticalSeparator(result);
    result += `<strong>Deprecated in Version</strong>: ${jsonSchemaObject["x-deprecated-in-version"]}`;
  }

  // Add examples
  if (jsonSchemaObject.examples && Array.isArray(jsonSchemaObject.examples)) {
    result = addVerticalSeparator(result);
    result += '**Example Values**: <ul className="examples">';
    result += getJsonSchemaObjectExamples(jsonSchemaObject, jsonSchemaRoot, "htmlListTag");
    result += "</ul>";
  }

  return result;
}

/**
 * Detects whether the oneOf is used to
 * * describe an enum (with additional descriptions)
 * * or is used in other, more generic ways
 *
 * @see https://github.com/json-schema-org/json-schema-spec/issues/57#issuecomment-247861695
 */
export function detectOneOfEnum(jsonSchemaObject: SpecJsonSchema): boolean {
  if (!jsonSchemaObject.oneOf) {
    return false;
  }
  let oneOfWithConst = 0;

  // Count how often const was used in the oneOf items
  for (const oneOfItem of jsonSchemaObject.oneOf) {
    if (oneOfItem.const) {
      oneOfWithConst++;
    }
  }

  if (oneOfWithConst === jsonSchemaObject.oneOf.length) {
    return true;
  }
  return false;
}

/**
 * Detects whether the oneOf is used to
 * * describe an enum (with additional descriptions)
 * * or is used in other, more generic ways
 *
 * @see https://github.com/json-schema-org/json-schema-spec/issues/57#issuecomment-247861695
 */
export function detectOneOfRef(jsonSchemaObject: SpecJsonSchema): boolean {
  if (!jsonSchemaObject.oneOf) {
    return false;
  }
  let oneOfWithRef = 0;

  // Count how often const was used in the oneOf items
  for (const oneOfItem of jsonSchemaObject.oneOf) {
    if (oneOfItem.$ref) {
      oneOfWithRef++;
    }
  }

  if (oneOfWithRef === jsonSchemaObject.oneOf.length) {
    return true;
  }
  return false;
}

/**
 * Detects whether the anyOf is used to
 * * describe an extensible enum
 * * or is used in other, more generic ways (like anyOf $ref links)
 *
 * @see https://github.com/zalando/restful-api-guidelines/issues/412
 */
export function detectExtensibleEnum(jsonSchemaObject: SpecJsonSchema): boolean {
  if (!jsonSchemaObject.anyOf) {
    return false;
  }
  let anyOfWithConst = 0;
  let anyOfWithStringType = 0;

  // Count how often const was used in the oneOf items
  for (const anyOfItem of jsonSchemaObject.anyOf) {
    if (anyOfItem.const) {
      anyOfWithConst++;
    } else if (anyOfItem.type === "string") {
      anyOfWithStringType++;
    }
  }

  if (anyOfWithConst && anyOfWithStringType) {
    // If there is at least one const value entry (enum) and at least one that has a string type, we treat it as extensible enum
    return true;
  } else {
    // FIXME: Here we forgot about anyOf where all the entries are a $ref
    // This function needs to be refactored to either also care about this or change its scope
    return false;
  }
}

export function getReferencedSchema(
  $ref: string,
  jsonSchemaRoot: SpecJsonSchemaRoot,
  location: string,
): SpecJsonSchema {
  // In this case there is no direct object in the JSON Schema root
  // We'll look up the main level $ref to see which one is considered the Root
  const refName = $ref.replace("#/definitions/", "");
  if (!jsonSchemaRoot.definitions[refName]) {
    throw new Error(`Could not find $ref ${$ref} in the definitions of ${location}!`);
  }
  return jsonSchemaRoot.definitions[refName];
}

/**
 * Created description of a oneOf enum that has `const` values and optionally description attached to it
 */
export function getOneOfEnumDescription(jsonSchemaObject: SpecJsonSchema, title = "Allowed Values"): string {
  let result = "";

  const oneOfEnum = detectOneOfEnum(jsonSchemaObject);
  if (oneOfEnum) {
    result += `**${title}**: <ul>`;
    for (const oneOfItem of jsonSchemaObject.oneOf!) {
      if (oneOfItem.description && oneOfItem.description) {
        let suffix = "";
        if (oneOfItem["x-feature-status"]) {
          const status = oneOfItem["x-feature-status"] as string;
          suffix += `\n<strong>Feature Status</strong>: <span className="feature-status-${status}" title="This feature is ${status.toUpperCase()} status and subject to potential changes.">${status.toUpperCase()}</span>`;
        }
        if (oneOfItem["x-introduced-in-version"]) {
          const version = oneOfItem["x-introduced-in-version"];
          suffix += `\n<strong>Introduced in Version</strong>: ${version}`;
        }
        if (oneOfItem["x-deprecated-in-version"]) {
          const version = oneOfItem["x-deprecated-in-version"];
          suffix += `\n<strong>Deprecated in Version</strong>: ${version}`;
        }
        result += `<li><p>${escapeTextInTable(oneOfItem.const)}: ${escapeMdInTable(
          `${oneOfItem.description}${suffix}`,
        )}</p></li>`;
      } else {
        result += `<li><p>${escapeTextInTable(oneOfItem.const)}</p></li>`;
      }
    }
    result += "</ul>";
  } else {
    log.error("Currently the documentation generator only supports oneOf for const values (documented enums)");
    log.warn(`Ignoring ${JSON.stringify(jsonSchemaObject.title, null, 2)}`);
  }

  return result;
}

/**
 * Created description of a oneOf enum that has `const` values and optionally description attached to it
 */
export function getOneOfRefDescription(
  jsonSchemaObject: SpecJsonSchema,
  jsonSchemaRoot: SpecJsonSchemaRoot,
  title = "One of",
): string {
  let result = "";

  const oneOfRef = detectOneOfRef(jsonSchemaObject);
  if (oneOfRef) {
    result += `**${title}**: <ul>`;
    for (const oneOfItem of jsonSchemaObject.oneOf!) {
      let suffix = "";
      // TODO: Make this reused
      if (oneOfItem["x-feature-status"]) {
        const status = oneOfItem["x-feature-status"] as string;
        suffix += `\n<strong>Feature Status</strong>: <span className="feature-status-${status}" title="This feature is ${status.toUpperCase()} status and subject to potential changes.">${status.toUpperCase()}</span>`;
      }
      // TODO: Make this reused
      if (oneOfItem["x-introduced-in-version"]) {
        const version = oneOfItem["x-introduced-in-version"];
        suffix += `\n<strong>Introduced in Version</strong>: ${version}`;
      }
      if (oneOfItem["x-deprecated-in-version"]) {
        const version = oneOfItem["x-deprecated-in-version"];
        suffix += `\n<strong>Deprecated in Version</strong>: ${version}`;
      }
      if (oneOfItem.$ref) {
        result += `<li><p>${getMdLinkFromRef(oneOfItem.$ref, jsonSchemaObject, jsonSchemaRoot)}</p></li>`;
      } else {
        throw new Error(`Expected $ref on oneOf item ${JSON.stringify(jsonSchemaObject, null, 2)}`);
      }
      result += suffix;
    }
    result += "</ul>";
  } else {
    log.error("Currently the documentation generator only supports oneOf for const values (documented enums)");
    log.warn(`Ignoring ${JSON.stringify(jsonSchemaObject.title, null, 2)}`);
  }

  return result;
}

export function getAllOfRefDescription(jsonSchemaObject: SpecJsonSchema, jsonSchemaRoot: SpecJsonSchemaRoot): string {
  let result = "";
  if (jsonSchemaObject.allOf) {
    result += `**All of**: <ul>`;
    for (const allOfItem of jsonSchemaObject.allOf) {
      if (allOfItem.$ref) {
        result += `<li><p>${getMdLinkFromRef(allOfItem.$ref, jsonSchemaObject, jsonSchemaRoot)}</p></li>`;
      } else {
        throw new Error(`Expected $ref on allOf item ${JSON.stringify(jsonSchemaObject, null, 2)}`);
      }
    }
    result += "</ul>";
  }

  return result;
}

export function getAnyOfDescription(
  jsonSchemaObject: SpecJsonSchema,
  jsonSchemaRoot: SpecJsonSchemaRoot,
  targetDocumentId: string | undefined,
  title = "Allowed Values",
): string {
  let result = "";

  const anyOfEnum = detectExtensibleEnum(jsonSchemaObject);
  if (anyOfEnum) {
    result += `**${title} (extensible)**: <ul>`;
    for (const anyOfItem of jsonSchemaObject.anyOf!) {
      if (anyOfItem.const) {
        // Const for fixed enum values
        if (anyOfItem.description) {
          result += `<li>${escapeTextInTable(anyOfItem.const)}: ${escapeMdInTable(anyOfItem.description)}</li>`;
        } else {
          result += `<li>${escapeTextInTable(anyOfItem.const)}</li>`;
        }
      } else {
        // Fallback type(s), for extensible enums
        assert(anyOfItem.type, "anyOf that has no const MUST have a type at least");

        const type = getTypeColumnText(anyOfItem, jsonSchemaRoot, targetDocumentId);
        const format = anyOfItem.format ? ` of format \`${anyOfItem.format}\`` : "";
        if (anyOfItem.description) {
          result += `<li><em>Any</em> ${type}${format}: ${escapeMdInTable(anyOfItem.description)}</li>`;
        } else {
          result += `<li><em>Any</em> ${type}${format}</li>`;
        }
      }
    }
    result += "</ul>";
  } else {
    log.error(
      `Currently the documentation generator only supports anyOf for const values (documented extensible enums) ${jsonSchemaObject.title || jsonSchemaObject.$id}`,
    );
  }

  return result;
}

function getTitleFromSchemaObject(jsonSchemaObject: SpecJsonSchema): string {
  if (!jsonSchemaObject.title) {
    throw new Error(`Schema Object must have a "title" keyword!\n ${JSON.stringify(jsonSchemaObject, null, 2)}`);
  }
  return jsonSchemaObject.title;
}

/**
 * Calculate Anchor Links removing special characters
 */
export function getAnchorLinkFromTitle(link: string | undefined): string {
  if (!link) {
    throw new Error(`Cannot create anchor link for undefined target`);
  }
  let cleanLink = `#${link.toLowerCase().split(" ").join("-")}`;
  cleanLink = cleanLink.replace(/@/g, "");
  cleanLink = cleanLink.replace(/\./g, "");
  cleanLink = cleanLink.replace(/\(/g, "");
  cleanLink = cleanLink.replace(/\)/g, "");
  cleanLink = cleanLink.replace(/\*/g, "");
  //cleanLink = cleanLink.replace(/-/g,'')
  return cleanLink;
}

function escapeHtmlChars(input: string): string {
  input = input.replace(/&/g, "&amp;");
  input = input.replace(/</g, "&lt;");
  input = input.replace(/>/g, "&gt;");
  return input;
}

function escapeMdInTable(md: string = ""): string {
  // TODO: Improve this by not making every linebreak a <br>, just two line-breaks should become a paragraph
  // This will be easier once we convert the markdown table to an HTML table
  return md.split("\n").join("<br/>");
}

function getHashIdForProperty(schemaObjectId: string, propertyName: string): string {
  return `${schemaObjectId}_${propertyName}`.toLowerCase().replace("#", "");
}

function escapeRegexpInTable(text: string): string {
  const escapedRegexp = text
    .split("\\")
    .join(`\\\\`)
    .split("|")
    .join(`\\|`)
    .split("{")
    .join(`\\{`)
    .split("}")
    .join(`\\}`)
    .split(":")
    .join(`\\:`)
    .split("*")
    .join(`\\*`);
  return `<code className="regex">${escapedRegexp}</code>`;
}

function addVerticalSeparator(result: string): string {
  if (!result.includes("<hr/>")) {
    result += "<hr/>";
  } else {
    result += "<br/>";
  }
  return result;
}

/**
 * Escapes text input to work within markdown tables
 * @see https://www.npmjs.com/package/gfm-escape
 *
 * TODO: Simplify this, e.g. only take text. Use separate function to escape code.
 */
function escapeTextInTable(text: string | string[] | unknown, jsonStringify = true, inlineCode = true): string {
  let result = text || "";

  // Convert this to a string. Either use JSON.stringify or string casting
  if (jsonStringify) {
    result = JSON.stringify(result);
  } else {
    result = `${text}`; // cast to text

    result = escaper.escape(result, { inTable: true });
  }

  if (inlineCode) {
    result = `\`${result}\``;
  }
  return result as string;
}

/**
 * Takes a $ref link and returns a markdown link
 */
function getMdLinkFromRef($ref: string, context: SpecJsonSchema, rootJsonSchema: SpecJsonSchemaRoot): string {
  const split = $ref.split("/");
  const entityName = split[2];
  const propertyName = split[3] || undefined;

  const referencedSchema = rootJsonSchema.definitions[entityName];

  if (!referencedSchema) {
    throw new Error(`Could not resolve $ref "${$ref}" for \n ${JSON.stringify(context, null, 2)}`);
  }

  if (!referencedSchema.title) {
    referencedSchema.title = propertyName || entityName;
    log.warn(`Referenced Schema is missing the title property. Falling back to property name from $ref: ${$ref}`);
    if (!referencedSchema.title) {
      throw new Error(
        `Referenced Schema is missing the title property:\n ${JSON.stringify(referencedSchema, null, 2)}`,
      );
    }
  }

  let link = `[${referencedSchema.title}](${getAnchorLinkFromTitle(referencedSchema.title)})`;

  if (propertyName) {
    if (!referencedSchema.properties || !referencedSchema.properties[propertyName]) {
      throw new Error(`Could not resolve $ref "${$ref}" for\n ${JSON.stringify(context, null, 2)}`);
    }
    link = `[${propertyName}](${getAnchorLinkFromTitle(referencedSchema.title)}_${propertyName.toLowerCase()}))`;
  }
  return link;
}

/** returns a sanitized ID for the schema object / thing */
function getSchemaObjectId(jsonSchemaObject: SpecJsonSchema): string {
  if (!jsonSchemaObject.title) {
    throw new Error(`Schema Object must have a "title" keyword!\n ${JSON.stringify(jsonSchemaObject, null, 2)}`);
  }
  // TODO: Fix this. The title shouldn't have the anchor tag hashtag link
  return getAnchorLinkFromTitle(jsonSchemaObject.title.replace("#", ""));
}
