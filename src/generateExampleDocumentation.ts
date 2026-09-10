import path from "node:path";
import { parse } from "comment-json";
import fg from "fast-glob";
import fs from "fs-extra";
import type { SpecToolkitConfigurationDocument } from "./generated/spec-toolkit-config/spec-v1/types/index.js";
import {
  createGenerationContext,
  documentationExamplesOutputFolderName,
  type GenerationContext,
  schemasOutputFolderName,
} from "./generationContext.js";
import type { SpecJsonSchemaRoot } from "./index.js";
import { log, logWritten } from "./util/log.js";
import { getJsonSchemaValidator } from "./util/validation.js";
import { loadYaml } from "./util/yaml.js";

export interface ExampleDocument {
  filePath: string;
  source: string;
  value: unknown;
}

export function loadExampleDocument(filePath: string): ExampleDocument {
  const source = fs.readFileSync(filePath, "utf8");
  if (filePath.endsWith(".jsonc")) {
    return { filePath, source, value: parse(source) };
  }
  if (filePath.endsWith(".json")) {
    return { filePath, source, value: loadYaml(source) };
  }
  throw new Error(`Unsupported example file extension: ${filePath}. Should be ".json" or ".jsonc"`);
}

function readOptionalText(filePath: string): string | undefined {
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : undefined;
}

export function renderExampleDocument(example: ExampleDocument, specificationId: string): string {
  const basePath = example.filePath.replace(/\.(?:json|jsonc)$/, "");
  const intro = readOptionalText(`${basePath}.intro.md`);
  const outro = readOptionalText(`${basePath}.outro.md`);
  const title = path.parse(example.filePath).name;
  let text = intro ?? `---\ntitle: ${title}\ndescription: Example documents for ${specificationId}.\n---\n`;

  text += `\n## Example File:  ${title}\n\n`;
  text += `\`\`\`json\n${example.source}\n\`\`\`\n`;
  if (outro) {
    text += `\n${outro}`;
  }
  return text;
}

export function generateExampleDocumentation(
  configData: SpecToolkitConfigurationDocument,
  context: GenerationContext = createGenerationContext(configData),
): void {
  for (const docConfig of configData.docsConfig) {
    if (docConfig.type !== "spec" || !docConfig.examplesFolderPath) {
      continue;
    }

    const exampleFilePaths = fg.sync(`${docConfig.examplesFolderPath}/*.{json,jsonc}`, {
      absolute: true,
      cwd: context.workingDirectory,
      ignore: ["_*"],
    });
    if (exampleFilePaths.length === 0) {
      log.info(
        `No example files found in folder "${docConfig.examplesFolderPath}". Skipping example documentation generation.`,
      );
      continue;
    }

    const schemaFilePath = context.outputPath(schemasOutputFolderName, `${docConfig.id}.schema.json`);
    const schema = loadYaml(fs.readFileSync(schemaFilePath, "utf8")) as SpecJsonSchemaRoot;
    const validate = getJsonSchemaValidator(schema, context.validation);
    const examples = exampleFilePaths.map(loadExampleDocument);

    log.info(`Validating examples for "${docConfig.id}".`);
    for (const example of examples) {
      if (!validate(example.value)) {
        throw new Error(
          `Example ${context.displayPath(example.filePath)} is not valid: \n${JSON.stringify(validate.errors, null, 2)}`,
        );
      }
      log.info(`Valid example: ${context.displayPath(example.filePath)}`);
    }

    for (const example of examples) {
      const outputFilePath = context.outputPath(
        documentationExamplesOutputFolderName,
        `${path.parse(example.filePath).name}.md`,
      );
      fs.outputFileSync(outputFilePath, renderExampleDocument(example, docConfig.id));
      logWritten(context.displayPath(outputFilePath));
    }
  }
}
