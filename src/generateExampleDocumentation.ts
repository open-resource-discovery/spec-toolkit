import fg from "fast-glob";
import fs from "fs-extra";
import * as path from "path";
import { log } from "./util/log.js";
import { SpecToolkitConfigurationDocument } from "./generated/spec-toolkit-config/spec-v1/types/index.js";
import { documentationExamplesOutputFolderName } from "./generate.js";

interface ExampleDocumentsDict {
  [fileName: string]: string;
}

export function generateExampleDocumentation(configData: SpecToolkitConfigurationDocument): void {
  for (const docConfig of configData.docsConfig) {
    if (docConfig.type === "spec" && docConfig.examplesFolderPath) {
      const jsonExampleFilePaths = fg.sync(`${docConfig.examplesFolderPath}/*.{json,jsonc}`, { ignore: ["_*"] });

      const mdExamplePages: ExampleDocumentsDict = {};

      // for each json,jsonc example generate a documentation .md site
      for (const filePath of jsonExampleFilePaths) {
        let text = "";
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

        let prefix = "";
        try {
          prefix = fs.readFileSync(filePath.replace(".json|.jsonc", ".md")).toString() + "\n\n";
        } catch (_) {
          // Ignore
        }

        if (prefix) {
          text += prefix;
        } else {
          text += `---\n`;
          text += `title: ${title}\n`;
          // text += `sidebar_position: 2\n`;
          text += `description: ${description}\n`;
          text += `---\n\n`;
          text += `# Example: ${title}\n\n`;
        }

        log.info(`Found ${docConfig.id} example file: ${filePath}`);
        if (exampleFileIntroContent) {
          text += exampleFileIntroContent + "\n";
        }
        text += `## Example File\n\n`;
        text += "```js\n";
        text += exampleFileContent;
        text += "\n```\n";
        if (exampleFileOutroContent) {
          text += "\n" + exampleFileOutroContent;
        }

        mdExamplePages[fileName] = text;
      }

      for (const fileName in mdExamplePages) {
        const fileContent = mdExamplePages[fileName];
        const exampleFilePath = path.join(
          `${configData.outputPath}/${documentationExamplesOutputFolderName}`,
          fileName,
        );
        fs.outputFileSync(exampleFilePath, fileContent);
        log.info("Written: " + exampleFilePath);
      }
    }
  }
}
