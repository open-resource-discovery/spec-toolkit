# CHANGELOG

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html) rules,
but omits the **patch** level in the spec version number.

For a roadmap including expected timeline, please refer to [ROADMAP.md](./ROADMAP.md)

## [unreleased]

- new feature: tolerant mode for arbitrary JSON Schemas. The Markdown documentation generator no longer rejects schemas that break the strong authoring conventions; instead it normalizes them and warns. Specifically:
  - inline nested objects and inline `oneOf`/`anyOf`/`allOf` branches that carry a shape are virtually hoisted into `#/definitions` (in memory; the authored file is never modified) via a new `normalizeArbitrarySchema` pass;
  - a node that has object keywords (`properties`/`patternProperties`/`additionalProperties`) but no `type` is treated as `type: object`;
  - `allOf` `if`/`then` conditionals expressing conditional requiredness are surfaced as a note rather than erroring;
  - a node with no recognizable construct is rendered as a free-form value instead of throwing.
  Schemas already authored to the conventions pass through unchanged (no output differences).
- fix: TypeScript type generation for a single schema that `json-schema-to-typescript` cannot handle (e.g. inline `if`/`then`/`else` conditionals) is now skipped with a warning instead of aborting the whole run; the Markdown documentation is still produced.
- fix: the ajv draft-07 meta-schema is resolved relative to the installed `ajv` package (via `require.resolve`) instead of a hardcoded `./node_modules/ajv/...` path, so the tool works regardless of the current working directory.
- fix: absolute `-c` config paths and absolute `sourceFilePath` values are honored as-is (`path.resolve` instead of `path.join(process.cwd(), ...)`), while relative paths remain CWD-relative (backward compatible).
- fix: non-conventional `$ref` shapes are reported as warnings rather than hard errors, since the normalization pass rewrites arbitrary schemas into the conventional `#/definitions/<name>` form first.

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
