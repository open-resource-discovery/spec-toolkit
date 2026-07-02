import fg from "fast-glob";
import fs from "fs-extra";
import { compileSchema, type ErrorConfig, type JsonError, type JsonSchema } from "json-schema-library";
import { loadYaml } from "../util/yamlLoad.js";

describe("Valid Config Example Files", (): void => {
  const testSchema = loadYaml(fs.readFileSync(`./spec/v1/spec-toolkit-config.schema.yaml`).toString()) as JsonSchema;
  const testSchemaValidator = compileSchema(testSchema);

  const jsonDocumentFilePaths = fg.sync("./examples/*.json", {});
  const yamlDocumentFilePaths = fg.sync("./examples/*.yaml", {});

  for (const jsonFilePath of jsonDocumentFilePaths) {
    const fileContent = fs.readFileSync(jsonFilePath).toString();
    describe(jsonFilePath, (): void => {
      test("json config example file passes simple JSON Schema based validation", (): void => {
        const data = JSON.parse(fileContent);
        expect(fileContent).toBeDefined();
        expect(data).toBeDefined();
        const validateResult = testSchemaValidator.validate(data);
        expect(simplifyValidationErrors(validateResult.errors)).toEqual([]);
      });
    });
  }

  for (const yamlFilePath of yamlDocumentFilePaths) {
    const fileContent = fs.readFileSync(yamlFilePath).toString();
    describe(yamlFilePath, (): void => {
      test("yaml config example file passes simple JSON Schema based validation", (): void => {
        const data = loadYaml(fileContent);
        expect(fileContent).toBeDefined();
        expect(data).toBeDefined();
        const validateResult = testSchemaValidator.validate(data);
        expect(simplifyValidationErrors(validateResult.errors)).toEqual([]);
      });
    });
  }
});

// biome-ignore lint/suspicious/noExportsInTest: used by other files
export type JsonSchemaValidationError = {
  code: ErrorConfig | string;
  pointer: string;
  message: string;
};
// biome-ignore lint/suspicious/noExportsInTest: used by other files
export function simplifyValidationErrors(errors: JsonError[]): JsonSchemaValidationError[] {
  return errors.map((el) => {
    return {
      code: el.code,
      pointer: el.data.pointer,
      message: el.message,
    };
  });
}
