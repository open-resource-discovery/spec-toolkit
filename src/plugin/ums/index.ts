import SpecToolkitPlugin from "../specToolkitPlugin.js";
import { UmsPluginConfig } from "./configModel.js";
import { generateUmsModels } from "./generateUmsModels.js";

class UmsPlugin extends SpecToolkitPlugin {
  public constructor() {
    super("ums");
  }

  public override generate(mainSpecSourceFilePaths: string[], outputPath: string, pluginOptions?: unknown): void {
    if (!pluginOptions) {
      throw new Error('Ums plugin requires configuration with "options".');
    }
    // TODO: Validate pluginOptions structure before casting as UmsPluginConfig
    generateUmsModels(mainSpecSourceFilePaths, outputPath, pluginOptions as UmsPluginConfig);
  }

  public override get xProperties(): string[] | undefined {
    return ["x-ums-type", "x-ums-visibility", "x-ums-implements", "x-ums-reverse-relationship"];
  }
}

export default UmsPlugin;
