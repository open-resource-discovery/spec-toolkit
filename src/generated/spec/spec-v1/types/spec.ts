// AUTO-GENERATED definition files. Do not modify directly.

export type SpecJsonSchemaVersion = string;
/**
 * Name of the type used in the Spec JSON Schema.
 * This is used to define the type of properties in the specification document.
 *
 */
export type SpecJsonSchemaTypeName = "string" | "number" | "integer" | "boolean" | "object" | "array" | "null";
/**
 * Array of type names used in the Spec JSON Schema.
 * This is used to define multiple types for a property in the specification document.
 *
 */
export type SpecJsonSchemaTypeNameArray = SpecJsonSchemaTypeName[];
/**
 * Primitive type.
 * @see https://tools.ietf.org/html/draft-handrews-json-schema-validation-01#section-6.1.1
 *
 */
export type SpecJsonSchemaType = string | number | boolean | SpecJsonSchema | SpecJsonSchemaArray | null;
/**
 * Example item used in the examples array.
 * This is used to provide an example of how the property can be used in practice.
 *
 */
export type Example =
  | {
      [k: string]: unknown | undefined;
    }
  | string
  | unknown[]
  | boolean;
/**
 * This interface was referenced by `JsonSchemaDefinitions`'s JSON-Schema definition
 * via the `patternProperty` "^(?![@]|__|\.|::).+$".
 */
export type JsonSchemaDefinition = SpecJsonSchema | SpecExtensionJsonSchema;

/**
 * This is the interface description of Spec v1.
 * Its purpose is to describe all properties allowed to be maintained in a specification document.
 */
export interface SpecJsonSchemaRoot {
  $id?: string;
  $schema?: SpecJsonSchemaVersion;
  /**
   * Descriptive title document text.
   */
  title?: string;
  description?: string;
  type?: SpecJsonSchemaTypeName | SpecJsonSchemaTypeNameArray;
  /**
   * Reference to another schema.
   * This is used to link to other schemas or definitions within the specification document.
   *
   */
  $ref?: string;
  properties?: Properties;
  patternProperties?: PatternProperties;
  definitions: JsonSchemaDefinitions;
  /**
   * Examples of the property value.
   * This is used to provide examples of how the property can be used in practice.
   *
   */
  examples?: Example[];
  /**
   * Required properties of the object.
   * This is used to define which properties are required in the specification document.
   *
   */
  required?: string[];
  /**
   * Allow additional properties in the object.
   * This is used to define whether additional properties are allowed in the specification document.
   *
   */
  additionalProperties?: boolean;
  "x-custom-typescript-types"?: XxPropertyCustomTypeScriptType[];
  /**
   * Optionally reorder an objects properties by this list. Unlisted properties will be appended in their original order.
   */
  "x-property-order"?: string[];
  /**
   * Mark properties as recommended (use like required).
   */
  "x-recommended"?: string[];
  /**
   * Spec Toolkit plugin specific x- properties.
   * MUST start with `x-<pluginName>-` and can be used to extend the specification document with additional properties.
   *
   */
  [k: SpecToolkitPluginXxPropertyKey]: unknown;
}
export interface Properties {
  [k: string]: SpecJsonSchema;
}
/**
 * The main object of the Spec JSON Schema, based on JSON Schema v7.
 * @see https://tools.ietf.org/html/draft-handrews-json-schema-validation-01
 *
 *
 * This interface was referenced by `Properties`'s JSON-Schema definition
 * via the `patternProperty` "^(?![@]|__|\.|::).+$".
 */
export interface SpecJsonSchema {
  $comment?: string;
  $ref?: string;
  type?: SpecJsonSchemaTypeName | SpecJsonSchemaTypeNameArray;
  enum?: SpecJsonSchemaType[];
  const?: SpecJsonSchemaType;
  maximum?: number;
  exclusiveMaximum?: number;
  minimum?: number;
  exclusiveMinimum?: number;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  items?: SpecJsonSchema;
  additionalItems?: SpecJsonSchema;
  maxItems?: number;
  minItems?: number;
  minProperties?: number;
  required?: string[];
  properties?: Properties;
  patternProperties?: PatternProperties;
  additionalProperties?: boolean;
  if?: SpecJsonSchema;
  then?: SpecJsonSchema;
  else?: SpecJsonSchema;
  allOf?: SpecJsonSchema[];
  anyOf?: SpecJsonSchema[];
  oneOf?: SpecJsonSchema[];
  /**
   * Format of the property value.
   * This is used to specify the expected format of the property value, such as date-time, email, etc.
   * @see https://tools.ietf.org/html/draft-handrews-json-schema-validation-01#section-7
   * @see https://datatracker.ietf.org/doc/html/draft-handrews-json-schema-validation-01#section-7.3
   *
   */
  format?:
    | "date-time"
    | "date"
    | "time"
    | "uri"
    | "uri-reference"
    | "uri-template"
    | "iri"
    | "iri-reference"
    | "email"
    | "hostname"
    | "idn-hostname"
    | "ipv4"
    | "ipv6"
    | "json-pointer"
    | "relative-json-pointer"
    | "regex"
    | string;
  title?: string;
  description?: string;
  default?: string | number | boolean;
  /**
   * Examples of the property value.
   * This is used to provide examples of how the property can be used in practice.
   *
   */
  examples?: Example[];
  /**
   * Mark properties as recommended (use like required).
   */
  "x-recommended"?: string[];
  /**
   * Version of the specification when this entity or property was introduced.
   */
  "x-introduced-in-version"?: string;
  /**
   * Version of the specification when this entity or property was deprecated.
   */
  "x-deprecated-in-version"?: string;
  /**
   * Text to be shown in the documentation when this property is deprecated.
   * Use this to provide a reason for deprecation and/or a migration suggestion.
   *
   */
  "x-deprecation-text"?: string;
  /**
   * Feature Status. Use this to mark something as alpha or beta.
   */
  "x-feature-status"?: "alpha" | "beta";
  /**
   * Add a human readable description for the patternProperties construct
   */
  "x-pattern-properties-description"?: string;
  /**
   * Optionally reorder an objects properties by this list. Unlisted properties will be appended in their original order.
   */
  "x-property-order"?: string[];
  /**
   * Point to the association target entity and optionally the property which is used as its ID.
   * Use a $ref pointer array as values
   *
   */
  "x-association-target"?: string[];
  /**
   * Hide property from generated documentation, but keep it in exported JSON Schema.
   */
  "x-hide-property"?: boolean;
  /**
   * Hide properties table from generated documentation, but keep it in exported JSON Schema.
   */
  "x-hide-properties"?: boolean;
  /**
   * Define extension points in the target document
   */
  "x-extension-points"?: string[];
  /**
   * Define the MD heading level in the target document. Default value: 3
   *
   */
  "x-header-level"?: number;
  /**
   * Marks JSON Schema object as abstract
   *
   * Entities marked as abstract will not be part of the final interface documentation
   * An abstract entity could indicate which properties are shared between multiple entities.
   * Abstract entities can be necessary for polymorphic association, e.g. for UMS model export they are mandatory.
   *
   */
  "x-abstract"?: boolean;
  /**
   * Overwrite the generated TypeScript Type.
   *
   * Used and defined by json-schema-to-typescript [tsType](https://github.com/bcherny/json-schema-to-typescript?tab=readme-ov-file#custom-schema-properties).
   * For advanced use cases where the json-schema-to-typescript library doesn't support to define the "key" type of patternProperties. Use `// replaceKeyType_` as workaround.
   * In the curly brackets you can combine multiple type names by the pipe/vertical bar character.
   *
   */
  tsType?: string;
  /**
   * Spec Toolkit plugin specific x- properties.
   * MUST start with `x-<pluginName>-` and can be used to extend the specification document with additional properties.
   *
   */
  [k: SpecToolkitPluginXxPropertyKey]: unknown;
}
export interface PatternProperties {
  [k: string]: SpecJsonSchema;
}
/**
 * Definitions of the specification document.
 */
export interface JsonSchemaDefinitions {
  [k: string]: JsonSchemaDefinition;
}
/**
 * The main object of the Spec Extension JSON Schema, based on JSON Schema v7.
 * @see https://tools.ietf.org/html/draft-handrews-json-schema-validation-01
 *
 */
export interface SpecExtensionJsonSchema {
  $comment?: string;
  $ref?: string;
  type?: SpecJsonSchemaTypeName | SpecJsonSchemaTypeNameArray;
  enum?: SpecJsonSchemaType[];
  const?: SpecJsonSchemaType;
  maximum?: number;
  exclusiveMaximum?: number;
  minimum?: number;
  exclusiveMinimum?: number;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  items?: SpecJsonSchema;
  additionalItems?: SpecJsonSchema;
  maxItems?: number;
  minItems?: number;
  minProperties?: number;
  required?: string[];
  properties?: Properties;
  patternProperties?: PatternProperties;
  additionalProperties?: boolean;
  if?: SpecJsonSchema;
  then?: SpecJsonSchema;
  else?: SpecJsonSchema;
  allOf?: SpecJsonSchema[];
  anyOf?: SpecJsonSchema[];
  oneOf?: SpecJsonSchema[];
  /**
   * Format of the property value.
   * This is used to specify the expected format of the property value, such as date-time, email, etc.
   * @see https://tools.ietf.org/html/draft-handrews-json-schema-validation-01#section-7
   * @see https://datatracker.ietf.org/doc/html/draft-handrews-json-schema-validation-01#section-7.3
   *
   */
  format?:
    | "date-time"
    | "date"
    | "time"
    | "uri"
    | "uri-reference"
    | "uri-template"
    | "iri"
    | "iri-reference"
    | "email"
    | "hostname"
    | "idn-hostname"
    | "ipv4"
    | "ipv6"
    | "json-pointer"
    | "relative-json-pointer"
    | "regex"
    | string;
  title?: string;
  description?: string;
  default?: string | number | boolean;
  /**
   * Examples of the property value.
   * This is used to provide examples of how the property can be used in practice.
   *
   */
  examples?: Example[];
  /**
   * Mark properties as recommended (use like required).
   */
  "x-recommended"?: string[];
  /**
   * Version of the specification when this entity or property was introduced.
   */
  "x-introduced-in-version"?: string;
  /**
   * Version of the specification when this entity or property was deprecated.
   */
  "x-deprecated-in-version"?: string;
  /**
   * Text to be shown in the documentation when this property is deprecated.
   * Use this to provide a reason for deprecation and/or a migration suggestion.
   *
   */
  "x-deprecation-text"?: string;
  /**
   * Feature Status. Use this to mark something as alpha or beta.
   */
  "x-feature-status"?: "alpha" | "beta";
  /**
   * Add a human readable description for the patternProperties construct
   */
  "x-pattern-properties-description"?: string;
  /**
   * Optionally reorder an objects properties by this list. Unlisted properties will be appended in their original order.
   */
  "x-property-order"?: string[];
  /**
   * Point to the association target entity and optionally the property which is used as its ID.
   * Use a $ref pointer array as values
   *
   */
  "x-association-target"?: string[];
  /**
   * Hide property from generated documentation, but keep it in exported JSON Schema.
   */
  "x-hide-property"?: boolean;
  /**
   * Hide properties table from generated documentation, but keep it in exported JSON Schema.
   */
  "x-hide-properties"?: boolean;
  /**
   * Define extension points in the target document
   */
  "x-extension-points"?: string[];
  /**
   * Define the MD heading level in the target document. Default value: 3
   *
   */
  "x-header-level"?: number;
  /**
   * Marks JSON Schema object as abstract
   *
   * Entities marked as abstract will not be part of the final interface documentation
   * An abstract entity could indicate which properties are shared between multiple entities.
   * Abstract entities can be necessary for polymorphic association, e.g. for UMS model export they are mandatory.
   *
   */
  "x-abstract"?: boolean;
  /**
   * Overwrite the generated TypeScript Type.
   *
   * Used and defined by json-schema-to-typescript [tsType](https://github.com/bcherny/json-schema-to-typescript?tab=readme-ov-file#custom-schema-properties).
   * For advanced use cases where the json-schema-to-typescript library doesn't support to define the "key" type of patternProperties. Use `// replaceKeyType_` as workaround.
   * In the curly brackets you can combine multiple type names by the pipe/vertical bar character.
   *
   */
  tsType?: string;
  /**
   * Indicate which target document extension pointers this property is merged into
   */
  "x-extension-targets"?: string[];
  "x-ref-to-doc"?: XxPropertyRefToDoc;
  /**
   * Spec Toolkit plugin specific x- properties.
   * MUST start with `x-<pluginName>-` and can be used to extend the specification document with additional properties.
   *
   */
  [k: SpecToolkitPluginXxPropertyKey]: unknown;
}
/**
 * TODO: move this to spec-extension.schema.yaml
 * Note: This property is only relevant for spec extensions!
 * Reference to a interface in the core spec.
 * This is used to link from a spec extension to a specific document in the core spec.
 *
 */
export interface XxPropertyRefToDoc {
  /**
   * Title of the referenced document.
   */
  title: string;
  /**
   * URI reference to the referenced document.
   */
  ref: string;
  [k: string]: unknown | undefined;
}
/**
 * Custom TypeScript type that can be used in the document.
 */
export interface XxPropertyCustomTypeScriptType {
  /**
   * Name of the custom TypeScript type to be generated.
   */
  typeName: string;
  /**
   * Value of the custom TypeScript type to be generated.
   */
  typeValue: string;
}

export type SpecJsonSchemaArray = unknown;

export type SpecToolkitPluginXxPropertyKey = string;
