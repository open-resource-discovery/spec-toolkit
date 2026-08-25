import fs from "fs-extra";
import type { JSONSchema7 } from "json-schema";
import { loadYaml } from "../../util/yaml.js";
import { MermaidDiagram } from "./mermaidClass.js";

export async function generateOverallClassModel(mainSpecSourceFilePaths: string[], outputPath: string): Promise<void> {
  for (const filePath of mainSpecSourceFilePaths) {
    const jsonSchemaDocumentRoot = loadYaml((await fs.readFile(filePath)).toString()) as JSONSchema7;

    const mermaidDiagram = new MermaidDiagram(jsonSchemaDocumentRoot, outputPath);
    await mermaidDiagram.generateOverallClassModel();
  }
}
