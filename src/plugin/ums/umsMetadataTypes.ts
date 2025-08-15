// TODO: Update Types here from documentation above
// TODO: Create JSON Schema to validate generated / converted results (in test-case or always?)

export interface UmsMetadataCommon {
  apiVersion: "metadata-service.resource.api.sap/v5" | "metadata-service.resource.api.sap/v6alpha1";
  type: "MetadataType" | "AbstractMetadataType" | "AbstractTypeMapping";
  metadata: MetadataHeader;
}
/**
 * The Metadata Types are the core of UMS.
 */
export interface UmsMetadataType extends UmsMetadataCommon {
  type: "MetadataType" | "AbstractMetadataType"; // TODO: this has code-smell
  spec: MetadataSpec;
}
export interface UmsAbstractMetadataType extends UmsMetadataCommon {
  type: "AbstractMetadataType";
  spec: MetadataSpec;
}
export interface UmsAbstractTypeMapping extends UmsMetadataCommon {
  type: "AbstractTypeMapping";
  spec: MetadataTypeMappingSpec;
}

export type UmsMetadata = UmsMetadataType | UmsAbstractMetadataType | UmsAbstractTypeMapping;

export function isUmsMetadataType(metadata: UmsMetadata): metadata is UmsMetadataType {
  return (metadata as UmsMetadataType).type === "MetadataType";
}
export function isUmsAbstractTypeMapping(metadata: UmsMetadata): metadata is UmsAbstractTypeMapping {
  return (metadata as UmsAbstractTypeMapping).type === "AbstractTypeMapping";
}
export function isUmsAbstractMetadataType(metadata: UmsMetadata): metadata is UmsAbstractMetadataType {
  return (metadata as UmsAbstractMetadataType).type === "AbstractMetadataType";
}
export function isUmsMetadataTypeOrAbstractMetadataType(
  metadata: UmsMetadata,
): metadata is UmsMetadataType | UmsAbstractMetadataType {
  return (
    (metadata as UmsMetadataType).type === "MetadataType" ||
    (metadata as UmsAbstractMetadataType).type === "AbstractMetadataType"
  );
}
export interface MetadataHeader {
  path: string;
  name: string;
  labels?: {
    [key: string]: string;
  };
}

// TODO: Derive better interface from JSON Schema
export interface MetadataSpec {
  /**
   * Name of the type that will be used in the Discovery and Management APIs.
   * It should be no longer than 64 symbols and contain only big and small latin letters and numbers.
   */
  typeName: string; // TODO: Should this be `name` for consistency?
  /**
   * Set of mandatory property names that are used to uniquely identify instances of the given type.
   * It is used for referencing, during discovery, updates, and deletion.
   */
  key: string[];
  /**
   * Visibility of the type - can be public or internal.
   * Instances of public types can be discovered by all UMS Consumers.
   */
  visibility: "public" | "internal";

  /**
   * Flag that marks a type as embedded.
   * Embedded types instances can only be accessed through instances of types that reference them.
   */
  embedded?: boolean;

  description?: string;
  /**
   * List of all properties of the type.
   */
  metadataProperties: MetadataProperty[];
  metadataRelations: MetadataRelation[];
  customTypeDefinitions: CustomTypeDefinition[];
}

export interface MetadataTypeMappingSpec {
  abstractType: TypeInclude;
  includedTypes?: IncludedType[];
}

export interface IncludedType {
  includedType: TypeInclude;
}

export interface TypeInclude {
  name: string;
  namespace: string;
}

export interface CustomTypeDefinition {
  name: string;
  metadataProperties: MetadataProperty[];
}

export type UmsType = "string" | "integer" | "float" | "boolean" | "guid" | "date" | "datetime" | "custom";

export interface CommonAttributes {
  /**
   * Boolean flag that marks the property as mandatory for all instances of that type.
   */
  mandatory?: boolean;
  /**
   * Boolean flag that marks the property as hidden from discovery.
   */
  hidden?: boolean;
  description?: string;
}

export interface MetadataProperty extends CommonAttributes {
  name: string; // TODO: Should this be `name` for consistency?
  type: UmsType;
  /**
   * Boolean flag that marks the property as unique for all instances of that type.
   * Instance creation with conflicting values results in an error.
   */
  unique?: boolean;
  /**
   * Boolean flag that marks the property as an array.
   * The property can contain multiple values.
   */
  array?: boolean;

  constraints?: Constraints;
  /**
   * List of all complex properties of the type.
   */
  customTypeName?: string;
}

/**
 * As the metadata provider is the one with domain knowledge, they should define all property constraints of given metadata types.
 * The constraints are always validated during creation and updates of metadata instances.
 *
 * TODO: Support this
 *
 */
export interface Constraints {
  // TODO: Duplicated?
  mandatory?: boolean;
  // TODO: Duplicated?
  unique?: boolean;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
}

export interface MetadataRelation extends CommonAttributes {
  propertyName: string; // TODO: Should this be `name` for consistency?
  relatedTypeName: string;
  relatedTypeNamespace: string;
  /**
   * Determines whether the relation is based on property.
   * Instances for relations which are based on property are created automatically.
   * For each created instance the relation instance's target is determined by the value of the managing property.
   * Thus, those properties should contain keys for the target type.
   */
  propertyBased?: boolean;
  /**
   * The property which manages this relation should only be specified if spec.metadataRelations.propertyBased is set to true.
   */
  managedByProperty?: string;

  /**
   * TODO: New in v6alpha?
   */
  targetPropertyName?: string;
  /**
   * Specifies that this relation has a reverse relation defined in the referenced type.
   */
  reverseRelation?: ReverseRelation;
  metadataProperties?: MetadataProperty[];

  /**
   * List of names of relations to Metadata Types, which correspond to a relation to an Abstract Metadata Type.
   * This field is valid only for relations from Metadata Types to Abstract Metadata Types.
   */
  correspondingRelationPropertyNames?: string[];
}

export interface ReverseRelation {
  /**
   * Specifies the name of the property of the reverse relation.
   */
  relationPropertyName: string;
}
