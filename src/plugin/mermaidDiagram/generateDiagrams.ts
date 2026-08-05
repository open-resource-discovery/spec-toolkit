import fs from "fs-extra";
import * as yaml from "js-yaml";
import type { JSONSchema7 } from "json-schema";
import { MermaidDiagram } from "./mermaidClass.js";

export async function generateOverallClassModel(mainSpecSourceFilePaths: string[], outputPath: string): Promise<void> {
  for (const filePath of mainSpecSourceFilePaths) {
    const jsonSchemaDocumentRoot = yaml.load((await fs.readFile(filePath)).toString()) as JSONSchema7;

    const mermaidDiagram = new MermaidDiagram(jsonSchemaDocumentRoot, outputPath);
    await mermaidDiagram.generateOverallClassModel();
  }
}
