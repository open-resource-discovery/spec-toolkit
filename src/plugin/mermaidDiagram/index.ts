import SpecToolkitPlugin from "../specToolkitPlugin.js";
import { generateOverallClassModel } from "./generateDiagrams.js";

class MermaidDiagramPlugin extends SpecToolkitPlugin {
  public constructor() {
    super("mermaidDiagram");
  }

  public override async generate(
    mainSpecSourceFilePaths: string[],
    outputPath: string,
    _pluginOptions?: unknown,
  ): Promise<void> {
    await generateOverallClassModel(mainSpecSourceFilePaths, outputPath);
  }

  public override get xProperties(): string[] | undefined {
    return undefined; // No specific xProperties for MermaidDiagramPlugin
  }
}

export default MermaidDiagramPlugin;
