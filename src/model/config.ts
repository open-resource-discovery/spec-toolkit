import fs from "fs-extra";
import { resolveConfiguredPath } from "../generationContext.js";

export function readTextFromFile(filePath: string | undefined, workingDirectory = process.cwd()): string {
  if (!filePath) {
    return "";
  }

  const resolvedFilePath = resolveConfiguredPath(filePath, workingDirectory);

  if (!fs.existsSync(resolvedFilePath)) {
    throw new Error(`Could not read file: ${resolvedFilePath}`);
  }

  return fs.readFileSync(resolvedFilePath, "utf-8").trimEnd();
}
