import SpecToolkitPlugin from "../specToolkitPlugin.js";
import { generateExcelAndCsvDefinitions } from "./generateExcelAndCSVDefinitions.js";

class TabularPlugin extends SpecToolkitPlugin {
  public constructor() {
    super("tabular");
  }

  public override async generate(
    mainSpecSourceFilePaths: string[],
    outputPath: string,
    _pluginOptions?: unknown,
  ): Promise<void> {
    await generateExcelAndCsvDefinitions(mainSpecSourceFilePaths, outputPath);
  }

  public override get xProperties(): string[] | undefined {
    return undefined; // No specific xProperties for TabularPlugin
  }
}

export default TabularPlugin;
