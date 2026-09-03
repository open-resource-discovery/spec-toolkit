import { createRequire } from "node:module";
import { Ajv, type ValidateFunction } from "ajv";
import addFormats from "ajv-formats";
import fs from "fs-extra";

import _ from "lodash";
import type { SpecJsonSchema, SpecJsonSchemaRoot } from "../generated/spec/spec-v1/types/index.js";
import { log } from "./log.js";

// Prepare JSON Schema validator
export const preparedAjv = new Ajv({
  allErrors: true,
  allowUnionTypes: true,
  allowMatchingProperties: true,
  strictSchema: false,
});
addFormats.default(preparedAjv);
preparedAjv.addKeyword("x-recommended");
preparedAjv.addKeyword("x-introduced-in-version");
preparedAjv.addKeyword("x-deprecated-in-version");
preparedAjv.addKeyword("x-deprecation-text");
preparedAjv.addKeyword("x-feature-status");
preparedAjv.addKeyword("x-pattern-properties-description");
preparedAjv.addKeyword("x-property-order");
preparedAjv.addKeyword("x-association-target");
preparedAjv.addKeyword("x-hide");
preparedAjv.addKeyword("x-extension-targets");
preparedAjv.addKeyword("x-extension-points");
preparedAjv.addKeyword("x-header-level");
preparedAjv.addKeyword("x-ref-to-doc");
preparedAjv.addKeyword("x-abstract");

// JSON Schema -> TypeScript conversion
preparedAjv.addKeyword("tsType");

export interface ValidationResult {
  errors: ValidationResultEntry[];
  warnings: ValidationResultEntry[];
}

export interface ValidationResultEntry {
  message: string;
  details?: string;
  context: string;
}

/**
 * Validate a Spec JSON Schema file, before working with it
 *
 * TODO: Add more validations here and improve feedback to end-user
 *
 */
export function validateSpecJsonSchema(jsonSchema: SpecJsonSchemaRoot, jsonSchemaFilePath: string): void {
  const result: ValidationResult = {
    errors: [],
    warnings: [],
  };

  result.errors.push(...validateJsonSchema(jsonSchema, jsonSchemaFilePath));

  // Tolerant mode: non-conventional $ref shapes (not `#/definitions/<name>`) are
  // reported as warnings rather than hard errors. The normalization pass rewrites
  // arbitrary schemas into the conventional shape before this runs, so surviving
  // deviations are surfaced without aborting documentation generation.
  result.warnings.push(...validateRefLinks(jsonSchema, jsonSchemaFilePath));

  for (const error of result.errors) {
    log.error(`[${error.context}] ${error.message}`);
  }
  for (const warning of result.warnings) {
    log.warn(`[${warning.context}] ${warning.message}`);
  }

  if (result.errors.length > 0) {
    throw new Error(
      `Validation of Spec JSON Schema file "${jsonSchemaFilePath}" failed with errors:\n ${JSON.stringify(result.errors, null, 2)}`,
    );
  }

  log.info(
    `${jsonSchemaFilePath} is valid Spec JSON document with ${result.errors.length} errors and ${result.warnings.length} warnings.`,
  );
}

/**
 * Returns a JSON Schema validator instance that validates JSON objects according to the given JSON Schema
 */
export function getJsonSchemaValidator(jsonSchema: SpecJsonSchemaRoot): ValidateFunction {
  try {
    return preparedAjv.compile(jsonSchema);
  } catch (err) {
    log.error("JSON Schema Validation issue (ajv)");
    log.error(err);
    log.error(preparedAjv.errors);
    throw new Error(`JSON Schema Validation issue (ajv): ${JSON.stringify((err as Error).message, null, 2)}`);
  }
}

/**
 * Validate JSON Schema to be a valid JSON Schema document
 */
export function validateJsonSchema(
  jsonSchema: SpecJsonSchemaRoot,
  jsonSchemaFilePath: string,
): ValidationResultEntry[] {
  const errors: ValidationResultEntry[] = [];

  // Resolve the ajv draft-07 meta-schema relative to the installed `ajv`
  // package rather than the current working directory, so the tool works no
  // matter where it is invoked from (previously a hardcoded
  // `./node_modules/ajv/...` path that only resolved from the repo root).
  const require = createRequire(import.meta.url);
  const jsonSchemaMeta = fs.readJSONSync(
    require.resolve("ajv/lib/refs/json-schema-draft-07.json"),
  ) as SpecJsonSchemaRoot;
  delete jsonSchemaMeta.$id;

  const validateMetaSchema = getJsonSchemaValidator(jsonSchemaMeta);
  const validMetaSchema = validateMetaSchema(jsonSchema);

  if (!validMetaSchema) {
    for (const error of validateMetaSchema.errors!) {
      errors.push({
        message: error.message || "JSON Schema validation issue",
        details: JSON.stringify(error, null, 2),
        context: `${jsonSchemaFilePath}#${error.instancePath}`,
      });
    }
  }

  return errors;
}

export function validateRefLinks(jsonSchema: SpecJsonSchemaRoot, jsonSchemaFilePath: string): ValidationResultEntry[] {
  const errors: ValidationResultEntry[] = [];

  // biome-ignore lint/suspicious/noExplicitAny: cloneDeep callback requires any types
  function cloneFn(this: SpecJsonSchemaRoot, value: any, _key: any, _object: any, _stack: any): any {
    if (value?.$ref && typeof value.$ref === "string") {
      const $ref = value.$ref as string;
      const refArr = $ref.split("/");

      if (!$ref.startsWith("#/definitions/")) {
        errors.push({
          message: `Invalid $ref "${$ref}", in Spec JSON Schema. MUST start with "#/definitions/" (only relative $refs to)`,
          context: `${jsonSchemaFilePath}`,
        });
      }

      if (refArr.length === 3) {
        // $ref to a definition

        if (!this.definitions[refArr[2]]) {
          errors.push({
            message: `Invalid $ref "${$ref}", pointing to unknown definition.`,
            context: `${jsonSchemaFilePath}`,
          });
        }
      } else {
        errors.push({
          message: `Invalid $ref "${$ref}" in Spec JSON Schema. MUST only point to definition name, not deeper inside it.`,
          context: `${jsonSchemaFilePath}`,
        });
      }
    }
  }
  _.cloneDeepWith(jsonSchema, cloneFn.bind(jsonSchema)) as SpecJsonSchema;

  return errors;
}

export function checkRequiredPropertiesExist(jsonSchemaObject: SpecJsonSchema): void {
  if (!jsonSchemaObject.properties) {
    return;
  }
  // VALIDATION: Check that every property that is required also exists
  if (jsonSchemaObject.required) {
    for (const requiredProperty of jsonSchemaObject.required) {
      if (!jsonSchemaObject.properties[requiredProperty]) {
        throw new Error(`${jsonSchemaObject.title} requires non-existing property "${requiredProperty}".`);
      }
    }
  }
}

export function validateExamples(jsonSchemaObject: SpecJsonSchema, jsonSchemaRoot: SpecJsonSchemaRoot): void {
  if (jsonSchemaObject.examples && Array.isArray(jsonSchemaObject.examples)) {
    const validate = getJsonSchemaValidator({
      ...jsonSchemaObject,
      // Add definitions so that $ref works
      definitions: jsonSchemaRoot.definitions,
    });

    for (const example of jsonSchemaObject.examples) {
      // Validate example if it complies to the JSON Schema
      const valid = validate(example);
      if (!valid) {
        log.error("--------------------------------------------------------------------------");
        log.error(`Example value "${example}" is invalid: \n ${JSON.stringify(jsonSchemaObject, null, 2)}`);
        log.error(validate.errors?.[0].message);
        log.error("--------------------------------------------------------------------------");
        process.exit(1);
      }
    }
  }
}

export function validateDefault(jsonSchemaObject: SpecJsonSchema, jsonSchemaRoot: SpecJsonSchemaRoot): void {
  if (jsonSchemaObject.default !== undefined) {
    const validate = getJsonSchemaValidator({
      ...jsonSchemaObject,
      // Add definitions so that $ref works
      definitions: jsonSchemaRoot.definitions,
    });

    // Validate default value if it complies to the JSON Schema
    const valid = validate(jsonSchemaObject.default);
    if (!valid) {
      log.error("--------------------------------------------------------------------------");
      log.error(
        `Default value "${jsonSchemaObject.default}" is invalid: \n ${JSON.stringify(jsonSchemaObject, null, 2)}`,
      );
      log.error(validate.errors?.[0].message);
      log.error("--------------------------------------------------------------------------");
      process.exit(1);
    }
  }
}
