export default abstract class SpecToolkitPlugin {
  private readonly _name: string;

  public constructor(name: string) {
    this._name = name;
  }

  public get name(): string {
    return this._name;
  }

  public abstract generate(mainSpecSourceFilePaths: string[], outputPath: string, pluginOptions?: unknown): void;
  public abstract get xProperties(): string[] | undefined;
}
