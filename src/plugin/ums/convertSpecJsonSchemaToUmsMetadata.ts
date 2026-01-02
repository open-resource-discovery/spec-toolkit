// TODO List:
// TODO: Support unique for IDs (ORD ID, Group Type ID, etc.), or should only `id` be unique ?
// # TODO: Add ID properties from composite parent root (e.g. apiResourceId, eventResourceId)
// # TODO: Add ID for the Consumption Bundle (metadata relation)

import { UmsMetadataOverrides, UmsPluginConfig } from "./configModel.js";
import {
  MetadataRelation,
  MetadataProperty,
  UmsMetadataType,
  UmsType,
  CustomTypeDefinition,
  CommonAttributes,
  Constraints,
  UmsAbstractTypeMapping,
  UmsMetadata,
  isUmsMetadataType,
  isUmsMetadataTypeOrAbstractMetadataType,
} from "./umsMetadataTypes.js";
import {
  isExtensibleEnum,
  isComplexEnum,
  isPolymorphicComposition,
  getPath,
  Context,
  getContext,
  checkForUnsupportedFeatures,
  getReferenceTarget,
  getReferenceName,
  getUnionType,
  getReferenceTargetFromRef,
  convertPropertyRefToObjectRef,
  getDocumentId,
  isAssociation,
} from "./specJsonSchemaHelper.js";
import { validateUmsMetadata } from "./validateUmsMetadata.js";
import _ from "lodash";
import { log } from "../../util/log.js";
import { SpecJsonSchemaRootWithUmsSupport, SpecJsonSchemaWithUmsSupport, supportedUmsTypes } from "./types.js";
import yaml from "js-yaml";
import fs from "fs-extra";

export type MetadataType =
  | "MetadataProperty"
  | "MetadataRelation"
  | "EmbeddedType"
  // | "MetadataRelationWithProperties"
  | "CustomType";

/**
 * Result interface for the functions that return more than one type and do this recursively
 * E.g. metadataProperties can also create corresponding customTypeDefinitions
 */
export interface MetadataResult {
  metadataProperties: MetadataProperty[];
  customTypeDefinitions: CustomTypeDefinition[];
  metadataRelations: MetadataRelation[];
  embeddedTypes?: UmsMetadataType[];
  typeMappingMetadata?: UmsAbstractTypeMapping[];
}

/**
 * Converts Spec JSON Schema file to UMS Metadata
 *
 * Each JSON Schema object that has has the "x-ums-type": "root" will be converted to a UMS Metadata YAML document.
 * Without this annotation the function would return an empty array.
 *
 * TODO: For UMS we need to be able to deal with multiple documents as inputs, including associations across documents.
 */
export function convertSpecJsonSchemaToUmsMetadata(
  documents: SpecJsonSchemaRootWithUmsSupport[],
  config: UmsPluginConfig,
): UmsMetadata[] {
  let results: UmsMetadata[] = [];
  for (const document of documents) {
    // Set config defaults
    config.idPropertySuffix = config.idPropertySuffix || "Id";
    const documentId = getDocumentId(document);
    const context: Context = {
      config: config,
      document: document,
      path: [documentId],
    };

    validatePreconditions(document, context);

    log.info(` ${getPath(context)}`);
    log.info("--------------------------------------------------------------------------");

    for (const entityName in document.definitions) {
      const definition = document.definitions[entityName];
      const newContext = getContext(context, entityName);

      // Skip entities that are marked as "x-ums-type": "ignore"
      if (definition["x-ums-type"] && definition["x-ums-type"] === "ignore") {
        continue;
      }
      // Skip entities that are marked as "x-ums-type": "custom-type" (will be embedded in parent)
      if (definition["x-ums-type"] && definition["x-ums-type"] === "custom") {
        continue;
      }

      // Now only root entities and embedded entities are left:
      results.push(...jsonSchemaObjectToUmsMetadata(definition, newContext));
    }

    // Now add reverse relations to the UMS model
    addReverseRelations(results, document, context);
  }

  const validationResult = validateUmsMetadata(results);

  if (validationResult.error > 0) {
    throw new Error(`Validation of UMS Metadata failed with ${validationResult.error} errors.`);
  }

  results = applyOverrides(results, config);

  return results;
}

export function jsonSchemaObjectToUmsMetadata(schema: SpecJsonSchemaWithUmsSupport, context: Context): UmsMetadata[] {
  const results: UmsMetadata[] = [];

  if (schema["x-ums-type"] === "ignore") {
    log.debug(` ${getPath(context)}: Skipping entity with "x-ums-type": "ignore"`);
    return results;
  }

  // Second item of path is the technical name of the metadata type
  const name = context.path[1];
  if (!name) {
    throw new Error(`${getPath(context)}: Could not infer technical name for metadata type.`);
  }
  if (!context.config.metadataPath) {
    throw new Error(`${getPath(context)}: Missing metadataPath config value.`);
  }
  const mainFile: UmsMetadataType = {
    apiVersion: "metadata-service.resource.api.sap/v6alpha1",
    type: "MetadataType",
    metadata: {
      name: name.split(" ").join("-").toLowerCase(),
      path: context.config.metadataPath,
      labels: context.config.labels || {},
    },
    spec: {
      typeName: name.split(" ").join(""),
      // We always create an `id` property which is owned by UMS and not part of the ORD interface
      // This ID is actually globally unique in UMS, while ORD IDs are not globally unique without tenant ID or isolation context in addition
      key: ["id"],
      visibility: schema["x-ums-visibility"] === "internal" ? "internal" : "public",
      embedded: !(schema["x-ums-type"] === "root"),
      ...(schema.description && { description: schema.description }),
      metadataProperties: [
        // Every root entity starts with an `id` property which is the primary key in UMS
        {
          name: "id",
          type: "guid",
          mandatory: true,
          unique: true,
          description: "UMS ID (globally unique), used for relations.",
        },
      ],
      customTypeDefinitions: [],
      metadataRelations: [],
    },
  };

  log.info(` ${getPath(context)}`);

  if (schema["x-abstract"]) {
    mainFile.type = "AbstractMetadataType";
    const umsTypeMappingMetadata: UmsAbstractTypeMapping = {
      apiVersion: "metadata-service.resource.api.sap/v6alpha1",
      type: "AbstractTypeMapping",
      metadata: {
        name: mainFile.metadata.name,
        path: mainFile.metadata.path,
      },
      spec: {
        abstractType: {
          name: mainFile.spec.typeName,
          namespace: context.config.metadataPath,
        },
        includedTypes: [],
      },
    };

    // Add included types to the abstract type mapping (all entities that implement the abstract type)
    for (const entityName in context.document.definitions) {
      const entity = context.document.definitions[entityName];
      if (entity["x-ums-implements"] === `#/definitions/${mainFile.spec.typeName}`) {
        umsTypeMappingMetadata.spec.includedTypes!.push({
          includedType: {
            name: entityName,
            namespace: context.config.metadataPath,
          },
        });
      }
    }
    results.push(umsTypeMappingMetadata);
  }

  const metadata = jsonSchemaObjectToMetadata(schema, context);
  mainFile.spec.metadataProperties.push(...metadata.metadataProperties);
  mainFile.spec.customTypeDefinitions.push(...metadata.customTypeDefinitions);
  mainFile.spec.metadataRelations.push(...metadata.metadataRelations);

  log.info("--------------------------------------------------------------------------");

  results.push(mainFile);

  if (metadata.typeMappingMetadata) {
    results.push(...metadata.typeMappingMetadata);
  }
  return results;
}

/**
 * Convert JSON Schema Object to UMS Metadata Properties
 * Only the simple properties will be returned, relations and complex properties are skipped.
 */
export function jsonSchemaObjectToMetadata(schema: SpecJsonSchemaWithUmsSupport, context: Context): MetadataResult {
  const result: MetadataResult = {
    metadataProperties: [],
    customTypeDefinitions: [],
    metadataRelations: [], // Not filled in this function
    embeddedTypes: [],
    typeMappingMetadata: [],
  };

  checkForUnsupportedFeatures(schema, context);

  // If the schema has patternProperties, we treat it as a "freestyle" map
  // This means that we create metadata properties where key and value are provided as arbitrary string
  if (schema.patternProperties) {
    if (schema.properties && schema.properties.length) {
      throw new Error(
        `${getPath(context)}: Unsupported mix of patternProperties and properties. An with patternProperties cannot have properties and will be treated by UMS as dynamic key-value map.`,
      );
    } else {
      const analyze = Object.values(schema.patternProperties)[0].items || schema.patternProperties;
      if (analyze?.type !== "string") {
        log.error(schema.patternProperties, analyze);
        throw new Error(
          `${getPath(context)}: Unsupported additionalProperties type ${analyze?.type}. An object with patternProperties must have additionalProperties of type "string" or Array<string>.`,
        );
      }

      result.metadataProperties.push({
        name: "key",
        type: "string",
      });
      result.metadataProperties.push({
        name: "value",
        type: "string",
      });
    }
    log.debug(`${getPath(context)}: Detected patternProperties, treating as dynamic key-value map.`);
    return result;
  }

  for (const propertyName in schema.properties) {
    const property = schema.properties[propertyName];
    const newContext = getContext(context, propertyName);
    const category = getPropertyCategory(property, newContext);
    const analyze = property.items || property;

    if (category === "metadataProperty") {
      //////////////////////////////////////////
      // Simple Metadata Property             //
      //////////////////////////////////////////

      const metadataProperty: MetadataProperty = {
        name: propertyName,
        type: convertType(property, newContext),
        ...getArrayAttribute(schema, propertyName),
        ...getCommonAttributes(schema, propertyName),
        ...getConstraints(schema, propertyName, newContext),
      };
      result.metadataProperties.push(metadataProperty);
    } else if (category === "embeddedType") {
      //////////////////////////////////////////
      // Reference to Embedded Type           //
      //////////////////////////////////////////

      const target = analyze.$ref;
      if (isPolymorphicComposition(property)) {
        log.error(`${getPath(newContext)}: Polymorphic compositions to embedded types are not yet supported.`);
        continue;
      }
      if (!target) {
        throw new Error(`${getPath(newContext)}: Expected to have "$ref"`);
      }

      const targetParsed = target.split("/");

      const metadataRelation: MetadataRelation = {
        propertyName: propertyName,
        relatedTypeName: targetParsed[2],
        relatedTypeNamespace: newContext.config.metadataPath!,
        ...getCommonAttributes(schema, propertyName),
        ...getReverseRelation(property),
      };
      result.metadataRelations.push(metadataRelation);

      // Because this is a reference to an embedded type, we don't have to add the managed _ID metadataProperty
    } else if (category === "customType") {
      //////////////////////////////////////////
      // Custom Type Property                 //
      //////////////////////////////////////////

      let refTarget: SpecJsonSchemaWithUmsSupport | undefined;
      let refName: string | undefined;

      if (isPolymorphicComposition(property)) {
        const unionType = getUnionType(property, newContext);
        refTarget = unionType;
        refName = capitalizeFirstLetter(propertyName);
      } else {
        refTarget = getReferenceTarget(property, newContext);
        refName = getReferenceName(property);
      }

      if (!refTarget || !refName) {
        throw new Error(`${getPath(newContext)}: Could not find reference target for property`);
      }

      // First, create a metadata property of type "custom"
      const metadataProperty: MetadataProperty = {
        name: propertyName,
        type: "custom",
        customTypeName: refName,
        ...getArrayAttribute(schema, propertyName),
        ...getCommonAttributes(schema, propertyName),
        // No constraints here.
      };
      result.metadataProperties.push(metadataProperty);

      // Second, create the actual custom type definition
      const customTypeDefinition: CustomTypeDefinition = {
        name: refName,
        metadataProperties: [],
      };

      const r = jsonSchemaObjectToMetadata(refTarget, newContext);
      customTypeDefinition.metadataProperties = r.metadataProperties;
      result.customTypeDefinitions.push(customTypeDefinition);
      result.customTypeDefinitions.push(...r.customTypeDefinitions);
    } else if (category === "metadataRelation") {
      //////////////////////////////////////////
      // Simple Metadata Relation             //
      //////////////////////////////////////////

      const targets = property["x-association-target"] || property.items?.["x-association-target"];
      if (!targets) {
        throw new Error(`${getPath(newContext)}: Expected to have "x-association-target"`);
      }

      // Relations within relations or custom types are not supported and will be converted to simple "string" type
      if (context.path.length > 3) {
        log.warn(
          ` ${getPath(newContext)} Relations within custom types / relations are not supported, converting to "string" type.`,
        );
        const metadataProperty: MetadataProperty = {
          name: propertyName,
          type: "string",
          ...getArrayAttribute(schema, propertyName),
          ...getCommonAttributes(schema, propertyName),
          ...getConstraints(schema, propertyName, newContext),
        };
        result.metadataProperties.push(metadataProperty);
        // Don't add the relation to the metadataRelations array
        continue;
      }

      if (targets.length > 1) {
        const metadataRelation = getPolymorphicMetadataRelation(targets, propertyName, schema, newContext);
        result.metadataRelations.push(...metadataRelation);
      } else {
        const targetParsed = targets[0].split("/");

        const relatedTypeName = targetParsed[2];
        const relatedTypeManagedId = lowercaseFirstLetter(`${propertyName}_ID`);

        const metadataRelation: MetadataRelation = {
          propertyName: propertyName,
          relatedTypeName: relatedTypeName,
          relatedTypeNamespace: newContext.config.metadataPath!,

          propertyBased: true,
          managedByProperty: relatedTypeManagedId,
          ...getCommonAttributes(schema, propertyName),
          ...getReverseRelation(property),
        };

        result.metadataRelations.push(metadataRelation);

        // Automatically add the managed ID property as metadata property for all "simple" associations
        const metadataProperty: MetadataProperty = {
          name: relatedTypeManagedId,
          type: "guid",
          ...getArrayAttribute(schema, propertyName),
          ...getCommonAttributes(schema, propertyName),
          ...getConstraints(schema, propertyName, newContext),
        };
        result.metadataProperties.push(metadataProperty);
      }
    }
  }
  return result;
}

/**
 * Helper function to derive some common attributes from a JSON Schema property that are shared across MetadataRelations and MetadataProperties
 */
export function getCommonAttributes(schema: SpecJsonSchemaWithUmsSupport, propertyName: string): CommonAttributes {
  if (!schema.properties || !schema.properties[propertyName]) {
    throw new Error(`${getPath}: Expected input object to have property: ${propertyName}`);
  }
  const property = schema.properties[propertyName];
  const commonAttributes: CommonAttributes = {};
  if (property.description) {
    commonAttributes.description = property.description;
    if (commonAttributes.description.length > 2000) {
      throw new Error(`${getPath}: Description of ${propertyName} is more than 2000 characters.`);
    }
  }
  if (schema.required && schema.required.includes(propertyName)) {
    commonAttributes.mandatory = true;
  }
  return commonAttributes;
}

export function getArrayAttribute(
  schema: SpecJsonSchemaWithUmsSupport,
  propertyName: string,
): Partial<MetadataProperty> {
  if (!schema.properties || !schema.properties[propertyName]) {
    throw new Error(`${getPath}: Expected input object to have property: ${propertyName}`);
  }
  const property = schema.properties[propertyName];
  if (property.items) {
    return { array: true };
  }
  return {};
}
/**
 * Helper function to calculate the constraints for
 */
export function getConstraints(
  schema: SpecJsonSchemaWithUmsSupport,
  propertyName: string,
  context: Context,
): { constraints?: Constraints } {
  if (!schema.properties || !schema.properties[propertyName]) {
    throw new Error(`${getPath(context)}: Expected input object to have property: ${propertyName}`);
  }
  const property = schema.properties[propertyName];
  const constraints: { constraints: Constraints } = { constraints: {} };
  if (property.minLength) {
    constraints.constraints.minLength = property.minLength;
  }
  if (property.maxLength) {
    constraints.constraints.maxLength = property.maxLength;
  }
  if (property.minimum) {
    constraints.constraints.minimum = property.minimum;
  }
  if (property.maximum) {
    constraints.constraints.maximum = property.maximum;
  }
  if (property.pattern) {
    constraints.constraints.pattern = property.pattern;
  }

  if (Object.keys(constraints.constraints).length > 0) {
    return constraints;
  } else {
    return {};
  }
}

/**
 * Find out what UMS metadata "category" a JSON Schema property is
 */
function getPropertyCategory(
  property: SpecJsonSchemaWithUmsSupport,
  context: Context,
): "metadataProperty" | "embeddedType" | "customType" | "metadataRelation" {
  // Careful: Order of detection matters :)

  // TODO: Use x-ums-type more to simplify the detection? We can now rely on it.

  const analyze = property.items || property;

  if (isEmbeddedType(analyze, context)) {
    // log.debug(`${getPath(context)} is embeddedType`);
    return "embeddedType";
  }

  // Simple metadata relation
  if (property["x-association-target"] || property.items?.["x-association-target"]) {
    // log.debug(`${getPath(context)}: is metadataRelation`);
    return "metadataRelation";
  }

  // Composition -> Custom Type
  if (analyze.$ref) {
    return "customType";
  }

  // Its a polymorphic composition -> custom type (which will be a calculated union interface)
  if (isPolymorphicComposition(property)) {
    return "customType";
  }
  // TODO: In theory last two checks are not necessary, we can just fall back to metadataProperty
  if (isExtensibleEnum(property)) {
    // log.debug(`${getPath(context)} is anyOf enum`);
    return "metadataProperty"; // It's an enum, which we'll treat as simple string type
  }
  if (isComplexEnum(property)) {
    // log.debug(`${getPath(context)} is oneOf enum`);
    return "metadataProperty"; // It's an enum, which we'll treat as simple string type
  }
  return "metadataProperty";
}

function isEmbeddedType(property: SpecJsonSchemaWithUmsSupport, context: Context): boolean {
  if (property.items) {
    return isEmbeddedType(property.items, context);
  }
  if (property.$ref) {
    const refTarget = getReferenceTarget(property, context);

    if (refTarget["x-ums-type"] === "root") {
      return false;
    }
    if (refTarget["x-ums-type"] === "custom") {
      return false;
    }
    return true;
  }
  return false;
}

/**
 * Convert from JSON Schema types to UMS Types
 * UmsType = "string" | "integer" | "float" | "boolean" | "guid" | "date" | "datetime" | "custom";
 */
function convertType(property: SpecJsonSchemaWithUmsSupport, context: Context): UmsType {
  if (property.items) {
    return convertType(property.items, context);
  }

  if (property.format === "uuid") {
    return "guid";
  } else if (property.format === "date") {
    return "date";
  } else if (property.format === "datetime") {
    return "date";
  } else if (property.type === "string") {
    return "string";
  } else if (property.type === "integer") {
    return "integer";
  } else if (property.type === "number") {
    return "float";
  } else if (property.type === "boolean") {
    return "boolean";
  } else {
    log.error(property);
    throw new Error(`${getPath(context)}: Could not detect type for property`);
  }
}

/**
 * Helper function to capitalize the first letter of a string
 */
function capitalizeFirstLetter(string: string): string {
  return string.charAt(0).toUpperCase() + string.slice(1);
}
/**
 * Helper function to lowercase the first letter of a string
 */
function lowercaseFirstLetter(string: string): string {
  return string.charAt(0).toLowerCase() + string.slice(1);
}

function getPolymorphicMetadataRelation(
  targets: string[],
  propertyName: string,
  schema: SpecJsonSchemaWithUmsSupport,
  context: Context,
): MetadataRelation[] {
  const result: MetadataRelation[] = [];
  let abstractObject: string | undefined = undefined;
  for (const target of targets) {
    const objectRef = convertPropertyRefToObjectRef(target);
    const refTargetObject = getReferenceTargetFromRef(objectRef, context);
    const implementsRef = refTargetObject["x-ums-implements"];

    if (!implementsRef) {
      throw new Error(`${getPath(context)}: Missing "x-ums-implements" on polymorphic associations targets.`);
    }
    if (!abstractObject) {
      abstractObject = implementsRef;
    } else if (abstractObject !== implementsRef) {
      // TODO: We can look up the "x-ums-implements" chain to find a common parent that we share.
      //       Right now we don't need this for ORD, so it's not implemented.
      throw new Error(
        `${getPath(context)}: Polymorphic associations with different "x-ums-implements" are not yet supported.`,
      );
    }
  }
  const abstractTargetParsed = abstractObject!.split("/");
  const abstractTargetTypeName = abstractTargetParsed[2];

  log.debug(
    `${getPath(context)}: Polymorphic association to "${abstractTargetTypeName}" detected  (${JSON.stringify(targets)})`,
  );

  const metadataRelation: MetadataRelation = {
    propertyName: propertyName,
    relatedTypeName: abstractTargetTypeName,
    relatedTypeNamespace: context.config.metadataPath!,
    ...getCommonAttributes(schema, propertyName),
    correspondingRelationPropertyNames: [],
  };

  result.push(metadataRelation);

  // Add relations for each association type, which is not polymorphic
  // and correspondingRelationPropertyNames for each target type to the polymorphic / abstract relation
  for (const target of targets) {
    const targetParsed = target.split("/");
    const relationTypeName = lowercaseFirstLetter(`${targetParsed[2]}${capitalizeFirstLetter(targetParsed[3])}`);
    metadataRelation.correspondingRelationPropertyNames!.push(relationTypeName);

    const additionalMetadataRelation: MetadataRelation = {
      propertyName: relationTypeName,
      relatedTypeName: targetParsed[3],
      relatedTypeNamespace: context.config.metadataPath!,
      ...getCommonAttributes(schema, propertyName),
    };
    result.push(additionalMetadataRelation);
  }

  // TODO: Add correspondingRelationPropertyNames for polymorphic associations
  // TODO: Add relation properties for each target type

  return result;
}

/**
 * Validate that the input Spec JSON Schema fulfills are preconditions to be converted to UMS Models
 */
export function validatePreconditions(document: SpecJsonSchemaRootWithUmsSupport, context: Context): void {
  log.info(`${getPath(context)} Validate preconditions for UMS Model conversion`);

  for (const entityName in document.definitions) {
    const entity = document.definitions[entityName];
    const umsType = entity["x-ums-type"];
    const entityContext = getContext(context, entityName);

    if (!entity["x-ums-type"]) {
      throw new Error(
        `${getPath(entityContext)}: To convert to UMS model, all JSON Schema Objects MUST have "x-ums-type" defined`,
      );
    }

    if (entity["x-ums-type"] && !supportedUmsTypes.includes(entity["x-ums-type"])) {
      throw new Error(
        `${getPath(entityContext)}: Unknown "x-ums-type"="${entity["x-ums-type"]}". Must be one of ${supportedUmsTypes.join(", ")}.`,
      );
    }

    // Validate properties
    if (entity.properties) {
      // let associationCounter = 0;
      for (const propertyName in entity.properties) {
        const propertyContext = getContext(entityContext, propertyName);
        const property = entity.properties[propertyName];

        // if (isAssociation(property)) {
        //   associationCounter++;
        // }

        // Validate for limitations of custom type
        if (umsType === "custom") {
          if (isAssociation(property)) {
            log.warn(
              `${getPath(propertyContext)}: Associations within custom types are not supported and will be treated as strings.`,
            );
          }
        }
      }
    }
  }
  log.info("--------------------------------------------------------------------------");
}

/**
 * If given property has x-ums-reverse-relationship, the relevant metadata relation properties will be returned
 */
export function getReverseRelation(property: SpecJsonSchemaWithUmsSupport): Partial<MetadataRelation> {
  const reverseRelation = property["x-ums-reverse-relationship"];
  // eslint-disable-next-line eqeqeq
  if (reverseRelation == null) {
    return {};
  } else {
    return {
      reverseRelation: {
        relationPropertyName: reverseRelation.propertyName,
      },
    };
  }
}

/**
 * Adds reverse annotations ("x-ums-reverse-relationship") to the UMS model.
 * They are added as metadataRelations via mutations to the given umsModel
 */
export function addReverseRelations(
  umsModel: UmsMetadata[],
  specJsonSchema: SpecJsonSchemaRootWithUmsSupport,
  context: Context,
): void {
  for (const entityName in specJsonSchema.definitions) {
    const entity = specJsonSchema.definitions[entityName];
    const entityContext = getContext(context, entityName);
    for (const propertyName in entity.properties) {
      const property = entity.properties[propertyName];
      const propertyContext = getContext(entityContext, propertyName);
      const analyze = property.items || property;
      const reverseRelation = property["x-ums-reverse-relationship"];
      // eslint-disable-next-line eqeqeq
      if (reverseRelation != null) {
        const reverseMetadataRelation: MetadataRelation = {
          propertyName: reverseRelation.propertyName,
          relatedTypeName: entityName,
          relatedTypeNamespace: context.config.metadataPath!,
          description: reverseRelation.description || `Reverse relation for ${propertyName}`,
          mandatory: reverseRelation.min ? true : false,
        };

        const associationTargets = analyze["x-association-target"];
        if (!associationTargets) {
          throw new Error(
            `${getPath(propertyContext)}: property with "x-ums-reverse-relationship" MUST also have "x-association-target"`,
          );
        }

        for (const target of associationTargets) {
          const targetParsed = target.split("/");
          const targetTypeName = targetParsed[2];

          const model = umsModel
            .filter(isUmsMetadataTypeOrAbstractMetadataType)
            .find((ums) => ums.spec.typeName === targetTypeName);

          if (!model) {
            throw new Error(
              `${getPath(propertyContext)}: Could not find target type "${targetTypeName}" for reverse relation (can only link to root entities).`,
            );
          }

          for (const ums of umsModel) {
            if (isUmsMetadataType(ums) && ums.spec.typeName === targetTypeName) {
              ums.spec.metadataRelations.push(reverseMetadataRelation);
            }
          }
        }
      }
    }
  }
}

//////////////////////////////////////////
// OVERRIDE FUNCTIONALITY               //
//////////////////////////////////////////

/**
 * Applies UMS Metadata files overrides
 * This can be used to patch and extend the converter results, in case that some features are not supported
 * or custom content / additions need to be added.
 */
function applyOverrides(results: UmsMetadata[], config: UmsPluginConfig): UmsMetadata[] {
  if (config.overrides) {
    log.info(`Overrides detected.`);
    for (const overrideFile of config.overrides) {
      // TODO: validate file content before casting it as UmsMetadataOverrides
      const overrideFileContent = yaml.load(fs.readFileSync(overrideFile, "utf-8")) as UmsMetadataOverrides;

      for (const overrideContent of overrideFileContent.overrides) {
        const metadataType = overrideContent.type;
        const name = overrideContent.metadata.name;

        if (!name || !metadataType) {
          log.error(overrideContent);
          throw new Error(`UMS Metadata override is missing mandatory type and metadata.name.`);
        }

        let metadata = results.find((metadata) => {
          return metadata.metadata.name === name && metadata.type === metadataType;
        });

        if (metadata) {
          log.info(` Merging override for ${metadataType}: "${name}"`);
          metadata = _.mergeWith(metadata, overrideContent, customMerger);
        } else {
          log.info(` Appending override for ${metadataType}: "${name}"`);
          results.push(overrideContent as UmsMetadata);
        }
      }
    }
  }

  return results;
}

function customMerger(target: unknown, src: unknown): unknown | undefined {
  if (_.isArray(target)) {
    for (const srcItem of src as MetadataProperty[]) {
      const srcName = getName(srcItem);
      const targetEl = target.find((el) => {
        const elName = getName(el);
        return elName === srcName;
      });

      if (targetEl) {
        const targetName = getName(targetEl);
        log.debug(`Merging element: ${srcName} into ${targetName}`);

        // Merge the properties of the existing element with the new element
        _.mergeWith(targetEl, srcItem, customMerger);
        return target;
      } else {
        log.debug(`Adding new element: ${srcName}`);
        return target.concat(srcItem);
      }
    }
  }
  return undefined;
}

function getName(object: unknown): string {
  if (object && typeof object === "object" && "name" in object) {
    return (object as { name: string }).name;
  }
  if (object && typeof object === "object" && "propertyName" in object) {
    return (object as { propertyName: string }).propertyName;
  }
  throw new Error(`Expected object to have name property, but got ${JSON.stringify(object)}`);
}
