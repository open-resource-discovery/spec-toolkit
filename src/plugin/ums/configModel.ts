import {
  UmsAbstractMetadataType,
  UmsAbstractTypeMapping,
  UmsMetadataCommon,
  UmsMetadataType,
} from "./umsMetadataTypes.js";

export interface UmsPluginConfig {
  /**
   * UMS Metadata path (acts like a namespace / folder for metadata resources).
   */
  metadataPath?: string;
  /**
   * For associations, create another (virtual) property that carries the ID (see `skipVirtualIdProperties`).
   * E.g. if a metadata relation `partOfPackage` is given, it will get an additional `partOfPackageId` property.
   */
  idPropertySuffix?: string;
  labels?: {
    [key: string]: string;
  };

  /** Array of string paths to .yaml files containing UmsMetadataOverrides */
  overrides?: string[];
}

/**
 * Optional overrides for the generated UMS metadata YAML files.
 *
 * Overrides can add or modify to the generated metadata files.
 * The `type` and `metadata.name` of each entry MUST be provided.
 *
 * For each entry:
 *  * The interface is same as the generated files, but is a Partial<>.
 *  * Files and entries with the same ID (e.g. `name`) will be merged, the override takes precedence.
 *  * Files and entries with unknown ID will be appended.
 */
export interface UmsMetadataOverrides {
  umsMetadataOverride: "0.1";
  overrides: (
    | (UmsMetadataCommon & Partial<UmsMetadataType>)
    | (UmsMetadataCommon & Partial<UmsAbstractMetadataType>)
    | (UmsMetadataCommon & Partial<UmsAbstractTypeMapping>)
  )[];
}
