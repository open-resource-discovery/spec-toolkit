// AUTO-GENERATED definition files. Do not modify directly.

/**
 * This is the interface description of spec-toolkit configuration v1.
 * Its purpose is to describe all properties allowed to be maintained in a configuration document.
 */
export interface SpecToolkitConfigurationDocument {
  /**
   * Link to JSON Schema for this spec-toolkit configuration document.
   * Adding this helps with automatic validation and code intelligence in some editors / IDEs.
   *
   * See https://tour.json-schema.org/content/06-Combining-Subschemas/02-id-and-schema
   *
   */
  $schema?: ("https://github.com/open-resource-discovery/spec-toolkit/spec-v1/spec-toolkit.schema.json#" | string) &
    string;
  /**
   * Optional URI for this document, that can acts as an ID or as location to retrieve the document.
   *
   * See https://tour.json-schema.org/content/06-Combining-Subschemas/02-id-and-schema
   *
   */
  $id?: string;
  generalConfig?: GeneralConfig;
  /**
   * The output path where the generated files will be written to.
   *
   * This is relative to the location of the configuration document.
   */
  outputPath: string;
  /**
   * Configuration for the documentation generation.
   *
   * @minItems 1
   */
  docsConfig: [SpecConfig | SpecExtensionConfig, ...(SpecConfig | SpecExtensionConfig)[]];
  /**
   * Array of optional plugins to be used for the generation.
   * Each configured plugin will generate additional output files depending on his specific scope.
   */
  plugins?: PluginConfigData[];
}
/**
 * General configuration for the spec-toolkit.
 * This is optional and can be omitted if no general configuration is needed.
 */
export interface GeneralConfig {
  /**
   * If set to `true`, the generated TypeScript types will exclude the `.js` file extension in the export statements.
   * The '.js' file extension is useful for compatibility with Node.js ESM modules but in Node.js commonjs modules it is not needed.
   */
  tsTypeExportExcludeJsFileExtension?: boolean;
}
/**
 * This is the configuration for a JSON Schema specification.
 */
export interface SpecConfig {
  /**
   * Type is used to identify the type of the configuration.
   *
   */
  type: "spec";
  /**
   * The ID of the specification.
   * This is used to identify the specification in the generated documentation.
   *
   */
  id: string;
  /**
   * The path to the source file of the JSON Schema specification.
   * This is used to generate the documentation for the specification.
   *
   * It can be a `.yaml` or `.json` file.
   *
   * The JSON Schema specification MUST NOT contain objects nested in objects.
   * Example:
   *   <code>type: object
   *     properties:
   *      &nbsp;&nbsp;fullName:
   *         &nbsp;&nbsp;&nbsp;&nbsp;type: object
   *         &nbsp;&nbsp;&nbsp;&nbsp;properties:
   *           &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;firstName:
   *             &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;type: string
   *           &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;lastName:
   *             &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;type: string
   *       &nbsp;&nbsp;age:
   *         &nbsp;&nbsp;&nbsp;&nbsp;type: integer
   *   </code>
   * MUST be replaced by:
   *   <code>type: object
   *     properties:
   *      &nbsp;&nbsp;fullName:
   *         &nbsp;&nbsp;&nbsp;&nbsp;$ref: "#/definitions/FullName"
   *       &nbsp;&nbsp;age:
   *         &nbsp;&nbsp;&nbsp;&nbsp;type: integer
   *   </code>
   *
   */
  sourceFilePath: string;
  /**
   * The path to the source intro file of the specification.
   * This is used to generate the documentation for the specification and will be appended at the beginning.
   *
   */
  sourceIntroFilePath?: string;
  /**
   * The path to the source outro file of the specification.
   * This is used to generate the documentation for the specification and will be appended at the end.
   *
   */
  sourceOutroFilePath?: string;
  /**
   * The path to the folder containing the examples for the specification.
   * This is used to generate the documentation for the specification.
   *
   * This folder MUST contain specification compliant instance example files with extension `.json` or `.jsonc`.
   * The instance example files will be validated against the specification during generation.
   *
   * If omitted, no examples will be included in the generated documentation.
   *
   * If provided, the folder MAY also contain for each instance example file e.g. `myExample.json` or `myExample.jsonc` optional *intro* and *outro* markdown files.
   * This *intro/outro* content will be included in the generated documentation before and after the `myExample.json` or `myExample.jsonc` content.
   *
   * If an *intro* file is provided, it MUST be named `myExample.intro.md`.
   * If an *outro* file is provided, it MUST be named `myExample.outro.md`.
   * Otherwise the *intro/outro* content will be omitted for the specific example.
   *
   * If an *intro* file is provided it SHOULD contain the markdown frontmatter with at least `title` and `description` for the example.
   *
   */
  examplesFolderPath?: string;
  mdFrontmatter?: MdFrontmatter;
}
/**
 * Frontmatter for the generated documentation.
 * This is used to generate the markdown frontmatter for the documentation page.
 */
export interface MdFrontmatter {
  /**
   * The key of the frontmatter.
   * This is used to generate the frontmatter for the documentation.
   *
   */
  [k: string]: string;
}
/**
 * This is the configuration for a JSON Schema extension specification.
 */
export interface SpecExtensionConfig {
  /**
   * Type is used to identify the type of the configuration.
   *
   */
  type: "specExtension";
  /**
   * The ID of the specification.
   * This is used to identify the specification in the generated documentation.
   *
   */
  id: string;
  /**
   * The path to the source file of the specification.
   * This is used to generate the documentation for the specification.
   *
   */
  sourceFilePath: string;
  /**
   * The path to the source intro file of the specification.
   * This is used to generate the documentation for the specification and will be appended at the beginning.
   *
   */
  sourceIntroFilePath?: string;
  /**
   * The path to the source outro file of the specification.
   * This is used to generate the documentation for the specification and will be appended at the end.
   *
   */
  sourceOutroFilePath?: string;
  /**
   * The ID of the target document.
   * This is used to identify the target document in the generated documentation.
   *
   */
  targetDocumentId: string;
  mdFrontmatter?: MdFrontmatter;
}
/**
 * Configuration for a plugin to be used in the generation.
 */
export interface PluginConfigData {
  /**
   * The package name or path to the plugin implementation.
   *
   * Plugins are implemented as Node.js modules and can be specified by their package name or by a relative path to the spec-toolkit CLI tool when the plugins are maintained in the core spec-toolkit repository.
   */
  packageName: string;
  options?: PluginOptions;
}
/**
 * Optional configuration for the plugin.
 * This is used to pass additional options to the plugin.
 */
export interface PluginOptions {
  /**
   * Array of x- property names that the plugin adds to the output JSON Schema.
   * This is used to include the plugin specific x- properties in the generated JSON Schema.
   *
   * If not provided, all plugin specific x- properties will be removed from the generated output JSON Schema.
   */
  preservedPluginSpecificXProperties?: string[];
  [k: string]: unknown | undefined;
}

export type SpecConfigType = SpecConfig | SpecExtensionConfig;
