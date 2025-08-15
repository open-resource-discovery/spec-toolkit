import { isUmsAbstractTypeMapping, UmsMetadata } from "./umsMetadataTypes.js";
import { log } from "../../util/log.js";

export interface ValidationStatistics {
  info: number;
  warn: number;
  error: number;
}
/**
 * Validates a converted UMS Metadata model
 *
 * TODO: Validate against JSON Schema of UMS Metadata model (not there yet)?
 * TODO: Also validate MetadataTypeMapping RTD
 *
 * Returns number of errors found
 */
export function validateUmsMetadata(results: UmsMetadata[]): ValidationStatistics {
  return detectDuplicateNames(results);
}

/**
 * Validate the UMS Metadata model for duplicate names
 *
 * Returns number of errors found
 */
function detectDuplicateNames(results: UmsMetadata[]): ValidationStatistics {
  const stats: ValidationStatistics = {
    info: 0,
    warn: 0,
    error: 0,
  };
  const metadataNameDict: { [key: string]: string } = {};

  for (const el of results) {
    // Do not check AbstractTypeMappings as they can have their own name and have no properties to check for duplicates
    if (isUmsAbstractTypeMapping(el)) {
      continue;
    }

    if (metadataNameDict[el.metadata.name]) {
      log.error(
        `[${el.metadata.name}]: Duplicate metadata name: ${el.metadata.name} conflicting with ${metadataNameDict[el.metadata.name]}`,
      );
      stats.error++;
    } else {
      metadataNameDict[el.metadata.name] = el.metadata.name;
    }

    const propertyNameDict: { [key: string]: string } = {};
    const typesNameDict: { [key: string]: string } = {};

    for (const prop of el.spec.metadataProperties) {
      if (propertyNameDict[prop.name]) {
        log.error(
          `[${el.metadata.name}.metadataProperties.${prop.name}]: Duplicate property name: ${prop.name} conflicting with ${propertyNameDict[prop.name]}`,
        );
        stats.error++;
      } else {
        propertyNameDict[prop.name] = prop.name;
      }
    }
    for (const prop of el.spec.metadataRelations) {
      if (propertyNameDict[prop.propertyName]) {
        log.error(
          `[${el.metadata.name}.metadataProperties.${prop.propertyName}]: Duplicate property name: ${prop.propertyName} conflicting with ${propertyNameDict[prop.propertyName]}`,
        );
        stats.error++;
      } else {
        propertyNameDict[prop.propertyName] = prop.propertyName;
      }
    }
    for (const prop of el.spec.customTypeDefinitions) {
      if (typesNameDict[prop.name]) {
        log.error(
          `[${el.metadata.name}.customTypeDefinitions.${prop.name}]: Duplicate custom type name: ${prop.name} conflicting with ${typesNameDict[prop.name]}`,
        );
        stats.error++;
      } else {
        typesNameDict[prop.name] = prop.name;
      }
      if (propertyNameDict[prop.name]) {
        log.error(
          `[${el.metadata.name}.customTypeDefinitions.${prop.name}]: Duplicate property name: ${prop.name} conflicting with ${propertyNameDict[prop.name]}`,
        );
        stats.error++;
      } else {
        propertyNameDict[prop.name] = prop.name;
      }
    }
  }
  return stats;
}
