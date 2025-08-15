import * as fs from "fs";
import * as path from "path";
import { load as loadYaml } from "js-yaml";
import { log } from "../../util/log.js";
import type { JavaAnnotationsConfig } from "./configModel.js";
import { quicktype, InputData, JSONSchemaInput, FetchingJSONSchemaStore } from "quicktype-core";

/**
 * Reads a YAML or JSON file and returns its contents as a formatted JSON string.
 * @param schemaPath - Path to the schema file
 * @returns JSON string or null if load/parsing failed
 */
function parseSchemaToJson(schemaPath: string): string | null {
  if (!fs.existsSync(schemaPath)) {
    log.error(`Schema file not found: ${schemaPath}`);
    return null;
  }
  const raw = fs.readFileSync(schemaPath, "utf8");
  try {
    const doc = loadYaml(raw); // js-yaml can parse both YAML and JSON
    return JSON.stringify(doc, null, 2);
  } catch (err: unknown) {
    log.error(`Failed to parse schema (${schemaPath}): ${err}`);
    return null;
  }
}

/**
 * Generates Java POJOs from a JSON Schema using quicktype.
 * Splits Quicktype's multi-type output into individual class files.
 * @param config - Plugin configuration
 * @param schemaPath - Path to YAML/JSON schema
 * @param outputBase - Base directory for generated Java packages
 */
export async function generateModels(
  config: JavaAnnotationsConfig,
  schemaPath: string,
  outputBase: string,
): Promise<void> {
  log.info("Starting Java POJO generation using quicktype");

  // Load and parse schema into JSON string
  const schemaJson = parseSchemaToJson(schemaPath);
  if (!schemaJson) return;

  // Derive a PascalCase type name from the schema filename
  const rawName = path.basename(schemaPath, path.extname(schemaPath));
  const typeName =
    rawName
      .split(/[^A-Za-z0-9]/)
      .filter(Boolean)
      .map((w) => w[0].toUpperCase() + w.slice(1))
      .join("") || "GeneratedType";

  // Validate the target Java package
  const pkg = config.modelPackage;
  if (!pkg) {
    log.error("Required option `modelPackage` is missing");
    return;
  }

  // Prepare output directory based on package segments
  const targetDir = path.join(outputBase, ...pkg.split("."));
  fs.mkdirSync(targetDir, { recursive: true });

  // Set up Quicktype input with a JSONSchema store for resolving refs
  const schemaInput = new JSONSchemaInput(new FetchingJSONSchemaStore());
  await schemaInput.addSource({ name: typeName, schema: schemaJson });
  const inputData = new InputData();
  inputData.addInput(schemaInput);

  // Invoke quicktype to generate Java code
  let qtResult;
  try {
    qtResult = await quicktype({
      inputData,
      lang: "java",
      rendererOptions: { package: pkg },
    });
  } catch (err: unknown) {
    log.error(`quicktype generation failed: ${err}`);
    return;
  }

  // Split output by Quicktype file markers
  const fullCode = qtResult.lines.join("\n");
  const filePattern = /\/\/\s*(\w+)\.java\s*\r?\n([\s\S]*?)(?=\/\/\s*\w+\.java|$)/g;
  let match: RegExpExecArray | null;
  while ((match = filePattern.exec(fullCode))) {
    const [, className, body] = match;
    const fileContent = body.trim() + "\n";
    const filePath = path.join(targetDir, `${className}.java`);
    fs.writeFileSync(filePath, fileContent, "utf8");
  }
}
