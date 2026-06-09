import path from "node:path";
import fs from "fs-extra";

export function readTextFromFile(filePath: string | undefined): string {
  if (!filePath) {
    return "";
  }

  const resolvedFilePath = path.resolve(filePath);

  if (!fs.existsSync(resolvedFilePath)) {
    throw new Error(`Could not read file: ${resolvedFilePath}`);
  }

  return fs.readFileSync(resolvedFilePath, "utf-8").trimEnd();
}
