import fg from "fast-glob";
import fs from "fs-extra";
import * as path from "path";
import { log } from "./util/log.js";
import { SpecToolkitConfigurationDocument } from "./generated/spec-toolkit-config/spec-v1/types/index.js";
import { documentationExamplesOutputFolderName, schemasOutputFolderName } from "./generate.js";
import { SpecJsonSchemaRoot } from "./index.js";
import * as yaml from "js-yaml";
import { getJsonSchemaValidator } from "./util/validation.js";
import { parse } from "comment-json";

interface ExampleDocumentsDict {
  [fileName: string]: string;
}

export function generateExampleDocumentation(configData: SpecToolkitConfigurationDocument): void {
  // Iterate the files and generate the example documentation
  for (const docConfig of configData.docsConfig) {
    if (docConfig.type === "spec" && docConfig.examplesFolderPath) {
      const jsonExampleFilePaths = fg.sync(`${docConfig.examplesFolderPath}/*.{json,jsonc}`, { ignore: ["_*"] });
      if (jsonExampleFilePaths.length === 0) {
        log.info(
          `No example files found in folder "${docConfig.examplesFolderPath}". Skipping example documentation generation.`,
        );
        continue;
      }

      const mdExamplePages: ExampleDocumentsDict = {};

      // for each json, jsonc example validate the example against the generated schema
      log.info(`Validate '${docConfig.id}' example files...`);
      const generatedJsonSchemaFilePath = `${configData.outputPath}/${schemasOutputFolderName}/${docConfig.id}.schema.json`;
      const generatedJsonSchema = yaml.load(
        fs.readFileSync(path.join(process.cwd(), generatedJsonSchemaFilePath)).toString(),
      ) as SpecJsonSchemaRoot;
      for (const filePath of jsonExampleFilePaths) {
        let exampleFileContent;
        if (filePath.endsWith(".jsonc")) {
          exampleFileContent = parse(fs.readFileSync(filePath).toString());
        } else if (filePath.endsWith(".json")) {
          exampleFileContent = yaml.load(fs.readFileSync(filePath).toString());
        } else {
          // this should never happen due to the glob pattern,
          // but just in case the pattern was extended and the file type handler war forgotten to be added here
          log.error(`Unsupported example file extension: ${filePath}. Should be ".json" or ".jsonc"`);
          process.exit(1);
        }

        const validateExampleFileContent = getJsonSchemaValidator(generatedJsonSchema);
        if (validateExampleFileContent(exampleFileContent)) {
          log.info(`- Example ${filePath} is valid.`);
        } else {
          log.error(
            `- Example ${filePath} is not valid: \n ${JSON.stringify(validateExampleFileContent.errors, null, 2)}`,
          );
          process.exit(1);
        }
      }

      // for each json,jsonc example generate a documentation .md site
      for (const filePath of jsonExampleFilePaths) {
        const exampleFileContent = fs.readFileSync(filePath).toString();
        const fileName = path.parse(filePath).name + ".md";

        const exampleFileIntroPath = filePath.replace(/.(json?|jsonc?)$/, ".intro.md");
        let exampleFileIntroContent = undefined;
        try {
          exampleFileIntroContent = fs.readFileSync(exampleFileIntroPath).toString();
        } catch (_) {
          // Ignore
        }

        const exampleFileOutroPath = filePath.replace(/.(json?|jsonc?)$/, ".outro.md");
        let exampleFileOutroContent = undefined;
        try {
          exampleFileOutroContent = fs.readFileSync(exampleFileOutroPath).toString();
        } catch (_) {
          // Ignore
        }

        const title = path.parse(filePath).name;
        const description = `Example documents for ${docConfig.id}.`;

        let text = "";

        if (exampleFileIntroContent) {
          text += exampleFileIntroContent;
          text += "\n";
        } else {
          text += `---\n`;
          text += `title: ${title}\n`;
          text += `description: ${description}\n`;
          text += `---\n\n`;
        }
        text += `## Example File:  ${title}\n\n`;
        text += filePath.includes(".jsonc") ? "```jsonc\n" : "```json\n";
        text += exampleFileContent;
        text += "\n```\n";
        if (exampleFileOutroContent) {
          text += "\n" + exampleFileOutroContent;
        }

        mdExamplePages[fileName] = text;
      }

      log.info(`Written:`);
      for (const fileName in mdExamplePages) {
        const fileContent = mdExamplePages[fileName];
        const exampleFilePath = path.join(
          `${configData.outputPath}/${documentationExamplesOutputFolderName}`,
          fileName,
        );
        fs.outputFileSync(exampleFilePath, fileContent);
        log.info("- " + exampleFilePath);
      }
    }
  }
}
