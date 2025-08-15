import SpecToolkitPlugin from "../specToolkitPlugin.js";
import type { JavaAnnotationsConfig } from "./configModel.js";
import { generateAnnotations } from "./generateJavaAnnotations.js";
import { generateModels } from "./generateJavaModels.js";
import { log } from "../../util/log.js";

export default class JavaAnnotationsPlugin extends SpecToolkitPlugin {
  public constructor() {
    super("javaAnnotations");
  }

  public generate(specPaths: string[], outputPath: string, pluginOptions?: unknown): void {
    // TODO: validate pluginOptions shape against JavaAnnotationsConfig schema
    const opts = (pluginOptions as Partial<JavaAnnotationsConfig>) ?? {};

    // Mandatory settings
    if (!opts.packageAnnotations) {
      log.error(
        "Required option `packageAnnotations` is missing. " +
          "Please provide a valid Java package name for your annotations, e.g.:\n" +
          "  { packageAnnotations: 'com.mycompany.annotations' }",
      );
      return;
    }

    if (!opts.modelPackage) {
      log.error(
        "Required option `modelPackage` is missing. " +
          "Please provide a valid Java package name for your generated POJOs, e.g.:\n" +
          "  { modelPackage: 'com.mycompany.model' }",
      );
      return;
    }

    const config: JavaAnnotationsConfig = {
      packageAnnotations: opts.packageAnnotations,
      modelPackage: opts.modelPackage,
    };

    if (specPaths.length === 0) {
      log.error("javaAnnotations plugin requires at least one schema file");
      return;
    }

    log.info("Starting JavaAnnotationsPlugin.generate()");
    for (const schemaPath of specPaths) {
      log.info(`Processing file: ${schemaPath}`);
      generateAnnotations(config, schemaPath, outputPath);
      void generateModels(config, schemaPath, outputPath);
    }
    log.info("javaAnnotations plugin run complete");
  }

  public get xProperties(): string[] | undefined {
    return undefined;
  }
}
