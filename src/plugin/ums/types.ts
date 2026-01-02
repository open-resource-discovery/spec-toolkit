import { SpecJsonSchema, SpecJsonSchemaRoot } from "../../generated/spec/spec-v1/types/index.js";

export interface SpecJsonSchemaRootWithUmsSupport extends SpecJsonSchemaRoot {
  definitions: JsonSchemaDefinitionsWithUmsSupport;
}

export interface JsonSchemaDefinitionsWithUmsSupport {
  [k: string]: JsonSchemaDefinitionWithUmsSupport;
}

export type JsonSchemaDefinitionWithUmsSupport = SpecJsonSchemaWithUmsSupport;

export interface PropertiesWithUmsSupport {
  [k: string]: SpecJsonSchemaWithUmsSupport;
}

export const supportedUmsTypes = ["root", "custom", "ignore", "embedded"] as const;
export type UmsType = (typeof supportedUmsTypes)[number];

export interface SpecJsonSchemaWithUmsSupport extends SpecJsonSchema {
  "properties"?: PropertiesWithUmsSupport;
  "x-ums-type"?: UmsType;

  /**
   * Sets the visibility of the entity
   * - public: Entity is part of the public API
   * - internal: Entity is not part of the public API and can only be used by internal stakeholders
   *
   * @default public
   */
  "x-ums-visibility"?: "public" | "internal";

  /**
   * Marks JSON Schema object as a valid implementation of the target contract
   * There is no inheritance involved, just a check that the interface is fulfilled (implementing same properties).
   */
  "x-ums-implements"?: string;

  /**
   * Only applicable to properties with "x-association-target"
   *
   * Defines the name and description of the reverse / back association
   */
  "x-ums-reverse-relationship"?: {
    /**
     * Property name of the reverse association
     */
    propertyName: string;
    description?: string;
    // TODO: Do we need cardinality / mandatory?
    /** Min cardinality, default is 0 */
    min?: number;
    // TODO: Is "many" a good default? For reverse relationships it feels like its a better default than "1"
    /** Max cardinality, default is * (many) */
    max?: "*" | number;
  };
}
