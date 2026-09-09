# CHANGELOG

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html) rules,
but omits the **patch** level in the spec version number.

## [unreleased]

## [0.9.2]

- fix: escape pipe characters in Markdown content rendered inside property table cells, preventing malformed tables and MDX compilation failures.
- fix: root-level schema examples are validated and rendered once in the dedicated Complete Examples section (#115).
- fix: consecutive generation runs in one process use isolated validation and plugin configuration state, and invalid schema examples or defaults throw errors instead of terminating the host process (#112).
- fix: rebuilding a locally linked checkout preserves an executable CLI entry point.
- changed: CLI failures are consistently written to standard error.

## [0.9.1]

- fix: tolerant mode accepts unregistered vendor extension (`x-*`) keywords in schemas imported through external references, while strict mode behavior remains unchanged.

## [0.9.0]

- new feature: support object-level `anyOf` with single-property `required` entries, expressing an "at least one of these properties must be present" constraint (#71, #109)
- new feature: relative file and HTTP(S) references are automatically bundled into the generated JSON Schema.
  Bundled artifacts contain only local `$ref` values and work in both the default strict mode and the opt-in tolerant mode (#94, #109).
- new feature: opt-in tolerant mode for arbitrary JSON Schemas.
  Existing strict schema handling remains the default, and validation errors point to `generalConfig.schemaMode: tolerant` when opting into normalization is appropriate.
  Set `generalConfig.schemaMode` to `tolerant` to normalize and warn about schemas that break the strong authoring conventions.
  Specifically:
  - inline nested objects and inline `oneOf`/`anyOf`/`allOf` branches that carry a shape are virtually hoisted into `#/definitions` (in memory; the authored file is never modified) via a new `normalizeArbitrarySchema` pass;
  - a node that has object keywords (`properties`/`patternProperties`/`additionalProperties`) but no `type` is treated as `type: object`;
  - `allOf` `if`/`then` conditionals expressing conditional requiredness are surfaced as a note rather than erroring;
  - a node with no recognizable construct is rendered as a free-form value instead of throwing.
  Schemas already authored to the conventions avoid structural rewrites beyond internal renderer bookkeeping (#83).
- fix: in tolerant mode, TypeScript type generation for a single schema that `json-schema-to-typescript` cannot handle (e.g. inline `if`/`then`/`else` conditionals) is skipped with a warning instead of aborting the whole run.
  The Markdown documentation is still produced.
  Strict mode keeps conversion failures fatal (#83).
- fix: schema validation works when the CLI is run outside the project directory (#83).
- fix: absolute `-c` config paths and absolute `sourceFilePath` values are honored as-is (`path.resolve` instead of `path.join(process.cwd(), ...)`), while relative paths remain CWD-relative (#83).
- fix: the tabular plugin supports specification extensions and emits `unknown` for unsupported or incomplete shapes instead of aborting generation (#73).
- fix: render `x-deprecated-in-version` and `x-deprecation-text` at the object-definition level so deprecation information is shown for object and primitive definitions (#81).
- fix: omit undefined Markdown frontmatter values instead of rendering them as the string `undefined` (#100).
- changed: TypeScript definitions are generated with `json-schema-to-typescript` 16, which can change emitted type aliases, intersections, and index signatures (#100).
- documentation: added a hands-on authoring guide and expanded the getting-started, best-practices, and FAQ documentation (#91, #102).

## [0.8.2]

- new feature: added `proposed` value to the `x-feature-status` enum for features that are specified but not yet implemented (#84)
- chore: updated all dependencies (TypeScript 7, Biome 2.5, js-yaml 5, tslog 5, commander 15, quicktype-core 26, and others); replaced `ts-jest` with `@swc/jest` for the test transform

## [0.8.1]

- fix: deduplicate `customTypeDefinitions` by name when merging, so shared referenced types (e.g. `Labels`) are only registered once even when multiple nested custom types reference the same definition

## [0.8.0]

- breaking: added new configuration option `generalConfig.preservedCoreSpecificXProperties` which is an array of x- property names that the spec-toolkit adds to the output JSON Schema. If not provided, all core spec-toolkit specific x- properties will be removed from the generated output JSON Schema.
- fix: there should be no rendering of an empty properties table when all properties of an object are marked with `x-hide`
- fix: improve Association Target link text in the UI to show "EntityName.propertyName" instead of just "propertyName"

## [0.7.1]

- fix: UMS plugin now supports root-level schemas with `x-ums-type: root` (schemas without `definitions` section)

## [0.7.0]

- breaking: deleted `x-hide-properties`, remove it from JSON schema if used
- breaking: renamed `x-hide-property` to new `x-hide` which can be placed now on object property level and entity definition level

## [0.6.0]

- new feature: provided default values are validated against current JSON schema type
- new feature: provided examples fom examples folder are validated against current generated JSON schema
- new feature: added configuration option to preserve plugins specific x-properties in the generated output JSON schema
- fix: jsonc code block in markdown does not have syntax highlighting, replaced by json code block instead

## [0.5.0]

- added extensible enum documentation support
- code refactoring to allow better unit testing besides e2e testing
- update dependencies

## [0.4.0]

- added general config parameter `tsTypeExportExcludeJsFileExtension` for suppressing the `.js` file ending for typescript types exports
- remove general config parameter `sortProperties` which had no concrete implementation or effect when configured

## [0.3.3]

- fix table pattern properties cannot be of type `<string>` because html tag characters are not escaped

## [0.3.2]

- fix json examples should be represented as json in generated markdown files and jsonc examples as jsonc

## [0.3.1]

- added support for `jsonc` as example file format
- added support for `intro` and `outro` files for examples
