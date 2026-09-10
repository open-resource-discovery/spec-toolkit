import path from "node:path";
import type { SpecToolkitConfigurationDocument } from "./generated/spec-toolkit-config/spec-v1/types/index.js";

export const documentationOutputFolderName = "docs";
export const documentationExtensionsOutputFolderName = path.join(documentationOutputFolderName, "extensions");
export const documentationExamplesOutputFolderName = path.join(documentationOutputFolderName, "examples");
export const typesOutputFolderName = "types";
export const schemasOutputFolderName = "schemas";
export const extensionFolderDiffToOutputFolderName = "../";

/**
 * Immutable filesystem context for one generator invocation.
 *
 * Configured relative paths intentionally remain relative to the process working
 * directory for backward compatibility. Keeping that directory in this object
 * makes the rule explicit and lets tests invoke the generators without changing
 * global process state.
 */
export interface GenerationContext {
  readonly workingDirectory: string;
  readonly configuredOutputPath: string;
  readonly outputDirectory: string;
  resolvePath(configuredPath: string): string;
  outputPath(...segments: string[]): string;
  displayPath(filePath: string): string;
}

export function resolveConfiguredPath(configuredPath: string, workingDirectory = process.cwd()): string {
  return path.resolve(workingDirectory, configuredPath);
}

export function createGenerationContext(
  configData: Pick<SpecToolkitConfigurationDocument, "outputPath">,
  workingDirectory = process.cwd(),
): GenerationContext {
  const resolvedWorkingDirectory = path.resolve(workingDirectory);
  const outputDirectory = resolveConfiguredPath(configData.outputPath, resolvedWorkingDirectory);

  return Object.freeze({
    workingDirectory: resolvedWorkingDirectory,
    configuredOutputPath: configData.outputPath,
    outputDirectory,
    resolvePath: (configuredPath: string) => resolveConfiguredPath(configuredPath, resolvedWorkingDirectory),
    outputPath: (...segments: string[]) => path.join(outputDirectory, ...segments),
    displayPath: (filePath: string) => {
      const resolvedPath = path.resolve(resolvedWorkingDirectory, filePath);
      if (path.isAbsolute(configData.outputPath)) {
        return resolvedPath;
      }
      return path.relative(resolvedWorkingDirectory, resolvedPath) || ".";
    },
  });
}
