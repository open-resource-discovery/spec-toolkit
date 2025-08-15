import { MermaidDiagram } from "./mermaidClass.js";
import yaml from "js-yaml";
import fs from "fs-extra";
import { JSONSchema7 } from "json-schema";

export async function generateOverallClassModel(mainSpecSourceFilePaths: string[], outputPath: string): Promise<void> {
  for (const filePath of mainSpecSourceFilePaths) {
    const jsonSchemaDocumentRoot = yaml.load((await fs.readFile(filePath)).toString()) as JSONSchema7;

    const mermaidDiagram = new MermaidDiagram(jsonSchemaDocumentRoot, outputPath);
    await mermaidDiagram.generateOverallClassModel();
  }
}
