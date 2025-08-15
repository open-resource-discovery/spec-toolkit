import fs from "fs-extra";
import path from "path";
import { SpecConfigType } from "../generated/spec-toolkit-config/spec-v1/types/index.js";

// Retrieve Text from Introduction File
export function getIntroductionText(docConfig: SpecConfigType): string {
  if (!docConfig.sourceIntroFilePath) {
    return "";
  }

  const mdFilePath = path.resolve(docConfig.sourceIntroFilePath);

  if (!fs.existsSync(mdFilePath)) {
    throw new Error("Could not read markdown file: " + mdFilePath);
  }

  return fs.readFileSync(mdFilePath, "utf-8");
}
// Retrieve Text from Introduction File
export function getOutroText(docConfig: SpecConfigType): string {
  if (!docConfig.sourceOutroFilePath) {
    return "";
  }

  const mdFilePath = path.resolve(docConfig.sourceOutroFilePath);

  if (!fs.existsSync(mdFilePath)) {
    throw new Error("Could not read markdown file: " + mdFilePath);
  }

  return fs.readFileSync(mdFilePath, "utf-8");
}
