import { log } from "../../util/log.js";
import { UmsPluginConfig } from "./configModel.js";
import { SpecJsonSchemaRootWithUmsSupport, SpecJsonSchemaWithUmsSupport } from "./types.js";

export type DocumentId = string;
export type EntityId = string;
export type PropertyId = string;

/**
 * Path to the currently focused schema object
 *
 * Components:
 * 1. Document ID
 * 2. Entity ID (optional)
 * 3. Property ID (optional)
 * 4...n Further sub-path, e.g. for compositions (optional)
 */
export type ContextPath = [DocumentId, EntityId?, PropertyId?, ...string[]];

export interface Context {
  document: SpecJsonSchemaRootWithUmsSupport;
  config: UmsPluginConfig;
  path: ContextPath;
}

/**
 * Detects whether this is an "extensible" enum where the enum values are described via `anyOf`
 *
 * TODO: Reconsider how to do this best and complement with validation
 *
 * @see https://github.com/zalando/restful-api-guidelines/issues/412
 */
export function isExtensibleEnum(jsonSchemaObject: SpecJsonSchemaWithUmsSupport): boolean {
  const schema = jsonSchemaObject.items || jsonSchemaObject;
  if (!schema.anyOf) {
    return false;
  }
  let anyOfWithConst = 0;
  let anyOfWithStringType = 0;

  // Count how often const was used
  for (const anyOf of schema.anyOf) {
    if (anyOf.const) {
      anyOfWithConst++;
    } else if (anyOf.type === "string") {
      anyOfWithStringType++;
    }
  }

  if (anyOfWithConst && anyOfWithStringType) {
    return true;
  }
  return false;
}

/**
 * Detects whether this is a "complex" enum where the enum values are described via `oneOf` and `const` values
 *
 * @see https://github.com/json-schema-org/json-schema-spec/issues/57#issuecomment-247861695
 */
export function isComplexEnum(jsonSchemaObject: SpecJsonSchemaWithUmsSupport): boolean {
  const schema = jsonSchemaObject.items || jsonSchemaObject;
  if (!schema.oneOf) {
    return false;
  }
  let oneOfWithConst = 0;

  // Count how often const was used in the oneOf items
  for (const oneOfItem of schema.oneOf) {
    if (oneOfItem.const) {
      oneOfWithConst++;
    }
  }

  if (oneOfWithConst === schema.oneOf.length) {
    return true;
  }
  return false;
}

/**
 * Detects whether this is a polymorphic composition, realized as oneOf pointer to multiple other schemas
 */
export function isPolymorphicComposition(jsonSchemaObject: SpecJsonSchemaWithUmsSupport): boolean {
  const schema = jsonSchemaObject.items || jsonSchemaObject;
  const options = schema.oneOf || schema.anyOf;
  if (!options) {
    return false;
  }
  let oneOfWithRef = 0;

  // Count how often const was used in the oneOf items
  for (const oneOfItem of options) {
    if (oneOfItem.$ref) {
      oneOfWithRef++;
    }
  }

  if (oneOfWithRef === options.length) {
    return true;
  }
  return false;
}

/**
 * Returns the stringified path from a context (for logging)
 */
export function getPath(context: Context): string {
  return `[${context.path.join(".")}]`;
}

/**
 * Gets a new context object, with path append
 */
export function getContext(context: Context, appendPath: string): Context {
  const path = [...context.path, appendPath] as ContextPath;
  return {
    ...context,
    path: path,
  };
}

export function checkForUnsupportedFeatures(schema: SpecJsonSchemaWithUmsSupport, context: Context): void {
  for (const propertyName in schema.properties) {
    const property = schema.properties[propertyName];
    const newContext = getContext(context, propertyName);

    // FIRST, add some checks to warn or error log about unsupported features at the moment.
    // TODO: Clean this up later
    // TODO: For this converter it is only necessary to detect polymorphic compositions, which are complex type
    // All other cases are simple metadata properties (enums) OR unsupported (should not affect ORD at least)
    if (property.oneOf || property.items?.oneOf) {
      if (!isComplexEnum(property) && !isExtensibleEnum(property)) {
        log.error(
          `${getPath(newContext)}: Unsupported oneOf detected: Must be either complex enum or polymorphic composition`,
          property,
        );
      }
    }
    if (property.anyOf || property.items?.anyOf) {
      if (!isExtensibleEnum(property) && !isPolymorphicComposition(property)) {
        log.error(
          `${getPath(newContext)}: Unsupported anyOf detected: Must be extensible enum or polymorphic composition`,
          property,
        );
      }
    }
    if (property.allOf || property.items?.allOf) {
      log.warn(`${getPath(newContext)}: Unsupported allOf detected`, property);
    }
  }
}

/**
 * Returns the references target schema
 *
 * TODO: support oneOf / allOf -> polymorphic associations, needing abstract intersection type
 */
export function getReferenceTarget(
  property: SpecJsonSchemaWithUmsSupport,
  context: Context,
): SpecJsonSchemaWithUmsSupport {
  const ref = property.$ref || property.items?.$ref;
  if (ref) {
    return getReferenceTargetFromRef(ref, context);
  } else {
    log.error(`${getPath(context)}: Could find $ref in given property`);
    throw new Error(`${getPath(context)}: Could find $ref in given property`);
  }
}

/**
 * Returns the references target (object) name
 *
 * TODO: support oneOf / allOf -> polymorphic associations, needing abstract intersection type
 */
export function getReferenceName(property: SpecJsonSchemaWithUmsSupport): string | undefined {
  const ref = property.$ref || property.items?.$ref;
  if (ref) {
    return ref.replace("#/definitions/", "");
  } else {
    return undefined;
  }
}

/**
 * Returns the union type of a polymorphic composition, realized as oneOf pointer to multiple other schemas
 * Input is expected to be an object that contains the `oneOf` or `anyOf` list of $ref pointers
 */
export function getUnionType(
  schemaObject: SpecJsonSchemaWithUmsSupport,
  context: Context,
): SpecJsonSchemaWithUmsSupport {
  if (!isPolymorphicComposition(schemaObject)) {
    throw new Error(`Expected ${getPath(context)} to be a polymorphic composition`);
  }
  const schema = schemaObject.items || schemaObject;
  const options = schema.oneOf || schema.anyOf || [];
  const schemas = options.map((el) => {
    const target = getReferenceTarget(el, context);
    if (!target) {
      throw new Error(`Could not find reference target for ${getPath(context)}`);
    }
    return target;
  });

  const union = calculateJsonSchemaUnion(schemas);
  if (schemaObject.description) {
    union.description = schemaObject.description;
  }

  return union;
}

/**
 * Get $ref target object from a reference string
 * Supports $ref to definitions and properties
 *
 * @example `'#/definitions/ApiResource'` for object references
 * @example `'#/definitions/ApiResource/ordId'` for property references
 */
export function getReferenceTargetFromRef(ref: string, context: Context): SpecJsonSchemaWithUmsSupport {
  const refArray = ref.replace("#/definitions/", "").split("/");
  if (!refArray[0]) {
    log.error(`${getPath(context)}: Could not resolve $ref="${ref}"`);
    throw new Error(`${getPath(context)}: Could not resolve $ref="${ref}"`);
  }
  const targetObject = context.document.definitions[refArray[0]];

  if (!targetObject) {
    log.error(`${getPath(context)}: Could not find target object for $ref="${ref}"`);
    throw new Error(`${getPath(context)}: Could not find target object for $ref="${ref}"`);
  }

  if (refArray.length === 1) {
    return targetObject;
  } else if (refArray.length === 2) {
    if (!targetObject.properties || !targetObject.properties[refArray[1]]) {
      log.error(`${getPath(context)}: Could not find target property for $ref="${ref}"`);
      throw new Error(`${getPath(context)}: Could not find target property for $ref="${ref}"`);
    }
    return targetObject.properties[refArray[1]];
  } else {
    log.error(`${getPath(context)}: Unsupported $ref="${ref}"`);
    throw new Error(`${getPath(context)}: Unsupported $ref="${ref}"`);
  }
}

/**
 * Converts a $ref pointing to a property to a $ref pointing to the object containing the property
 */
export function convertPropertyRefToObjectRef(ref: string): string {
  const refArray = ref.split("/");
  refArray.pop();
  return refArray.join("/");
}

/**
 * Returns a technical ID / name for the document (root schema) with fallbacks
 */
export function getDocumentId(schema: SpecJsonSchemaRootWithUmsSupport): DocumentId {
  let id = schema.$id || schema.title || "Unknown";
  if (id.startsWith("http")) {
    id = id.split("/").pop() || id;
    id = id.replace(".schema.json", "");
    id = id.replace(".json", "");
    id = id.replace("#", "");
  }
  return id;
}

/**
 * Detects whether this is an association (simple or polymorphic), realized with "x-association-target"
 */
export function isAssociation(jsonSchemaObject: SpecJsonSchemaWithUmsSupport): boolean {
  const schema = jsonSchemaObject.items || jsonSchemaObject;
  return !!schema["x-association-target"];
}

/**
 * Create a union type of two or more JSON Schema objects, combined into a single schema object.
 * This is necessary for polymorphic compositions, e.g. in `EventResource.entityTypeMappings.entityTypeTargets`
 */
export function calculateJsonSchemaUnion(schemas: SpecJsonSchemaWithUmsSupport[]): SpecJsonSchemaWithUmsSupport {
  const mergedSchema: SpecJsonSchemaWithUmsSupport = {
    type: "object",
    properties: {},
    required: [],
  };
  const requiredProperties: { [propertyName: string]: number } = {};

  for (const schema of schemas) {
    for (const propertyName in schema.properties) {
      const property = schema.properties[propertyName];
      // Merge Properties
      if (!mergedSchema.properties![propertyName]) {
        mergedSchema.properties![propertyName] = property;
      } else if (property.enum) {
        mergedSchema.properties![propertyName].enum = mergedSchema.properties![propertyName].enum || [];
        mergedSchema.properties![propertyName].enum?.push(...property.enum);
      }
      // Calculate required properties
      if (schema.required) {
        requiredProperties[propertyName] = requiredProperties[propertyName] || 0;
        requiredProperties[propertyName]++;
      }
    }

    for (const propertyName in requiredProperties) {
      if (requiredProperties[propertyName] === schemas.length) {
        mergedSchema.required!.push(propertyName);
      }
    }

    if (schema.examples) {
      mergedSchema.examples = mergedSchema.examples || [];
      mergedSchema.examples.push(...schema.examples);
    }
    // TODO: Merge x-annotations and other properties? Or warn if they are skipped / in conflict.
    // For this converter script it is unnecessary anyway.
  }

  return mergedSchema;
}
