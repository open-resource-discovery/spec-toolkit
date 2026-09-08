---
title: Authoring Guide
sidebar_position: 1.5
description: A hands-on guide to authoring JSON Schema specifications with Spec Toolkit.
---

# Authoring Guide

Build a small schema first, then add reuse, associations, extension vocabularies, examples, and plugins.
Use the [JSON Schema reference](./spec.md) and [configuration reference](./spec-toolkit-config.md) for the complete field-level contracts.

## Understand the workflow

Spec Toolkit uses a JSON Schema document as the source of truth.
One run produces Markdown reference documentation, a distributable JSON Schema, and TypeScript types.
Optional plugins can add diagrams, tabular exports, Java sources, or UMS metadata.

```text
spec/v1/*.schema.yaml + prose + examples
                    |
                    v
          spec-toolkit.config.json
                    |
                    v
generated/spec/v1/
  docs/       Markdown reference pages
  schemas/    merged JSON Schema files
  types/      TypeScript definitions
  plugin/     optional plugin output
```

Schema source files can be JSON or YAML.
The configuration file must be JSON.
YAML is usually more readable for a large specification and supports anchors for source-level reuse.

## Create a minimal project

Install Spec Toolkit as a development dependency so the project controls the version used locally and in continuous integration.

```bash
npm install --save-dev @open-resource-discovery/spec-toolkit
```

A small project can use this layout.

```text
spec/
  v1/
    catalog.schema.yaml
    catalog.intro.md
    examples/
      catalog.json
spec-toolkit.config.json
package.json
```

Add a repeatable generation command to `package.json`.

```json
{
  "scripts": {
    "generate": "spec-toolkit -c ./spec-toolkit.config.json"
  }
}
```

Create `spec-toolkit.config.json`.
All relative paths are resolved from the process working directory, so run the command from the project root.

```json
{
  "$schema": "https://open-resource-discovery.github.io/spec-toolkit/spec-v1/spec-toolkit-config.schema.json#",
  "outputPath": "src/generated/spec/v1",
  "generalConfig": {
    "tsTypeExportExcludeJsFileExtension": true
  },
  "docsConfig": [
    {
      "type": "spec",
      "id": "catalog",
      "sourceFilePath": "./spec/v1/catalog.schema.yaml",
      "sourceIntroFilePath": "./spec/v1/catalog.intro.md",
      "examplesFolderPath": "./spec/v1/examples",
      "mdFrontmatter": {
        "title": "Catalog interface",
        "sidebar_position": "1"
      }
    }
  ]
}
```

The `id` becomes the generated file name, while `$id` inside the source schema identifies the published schema.
Keep them stable because documentation links and consumers may depend on both.

## Author the schema in YAML

Start with the Spec Toolkit authoring schema in `$schema` to get editor validation and completion.
The following schema models services that belong to products.

```yaml
$schema: "https://open-resource-discovery.github.io/spec-toolkit/spec-v1/spec.schema.json#"
$id: "https://example.com/spec/v1/catalog.schema.json#"
title: Catalog document
description: Describes products and their services.
type: object
properties:
  products:
    type: array
    items:
      $ref: "#/definitions/Product"
  services:
    type: array
    items:
      $ref: "#/definitions/Service"
required:
  - products
  - services
additionalProperties: false
definitions:
  Product:
    title: Product
    type: object
    properties:
      id:
        type: string
        description: Stable product identifier.
      title:
        type: string
    required:
      - id
      - title
    additionalProperties: false
  Service:
    title: Service
    type: object
    properties:
      id:
        type: string
      productId:
        type: string
    required:
      - id
      - productId
    additionalProperties: false
```

Put reusable object shapes in `definitions` and refer to them with local `$ref` values.
This makes the relationship visible to JSON Schema validators, generated TypeScript, and generated links.
It also avoids deeply nested inline object definitions, which the strict authoring mode does not support.
In strict mode, ordinary references must have the exact form `#/definitions/Name`; they cannot be external references or point to a property inside a definition.

Use `description` for normative or field-level information.
Use `sourceIntroFilePath` and `sourceOutroFilePath` for longer explanations that should surround the generated reference instead of being embedded in a schema field.

## Remove repetition with YAML anchors

YAML anchors are useful when several properties need the same constraints but are not the same semantic type.
ORD uses this pattern extensively for common identifiers, descriptions, lifecycle fields, and resource metadata.

```yaml
definitions:
  Product:
    type: object
    properties:
      id: &resourceId
        type: string
        minLength: 1
        maxLength: 255
        pattern: "^[a-z0-9.-]+:[A-Za-z0-9_-]+$"
        description: Stable resource identifier.
  Service:
    type: object
    properties:
      id:
        <<: *resourceId
        description: Stable service identifier.
      productId:
        <<: *resourceId
        description: Identifier of the product that owns this service.
```

`&resourceId` names a YAML node, `*resourceId` reuses it, and `<<` merges the mapping so a local field such as `description` can override part of it.
Anchors exist only while YAML is loaded and are expanded in the generated JSON Schema.
They cannot cross file boundaries.

Use `$ref` for a named schema concept that consumers should see.
Use a YAML anchor when the goal is only to avoid repeating source text.
The CSN Interop specification combines both approaches: anchors reuse property sets, while `$ref` preserves its model structure.

## Document associations

JSON Schema validates the shape of a value but does not express that an identifier points to another entity.
Add `x-association-target` to make that relationship explicit in generated documentation and association-aware plugins.

```yaml
definitions:
  Product:
    title: Product
    type: object
    properties:
      id:
        type: string
    required:
      - id
  Service:
    title: Service
    type: object
    properties:
      productId:
        type: string
        description: Product that owns this service.
        x-association-target:
          - "#/definitions/Product/id"
      relatedProductIds:
        type: array
        items:
          type: string
          x-association-target:
            - "#/definitions/Product/id"
```

Each target is a local pointer to a definition and, optionally, its identifier property.
Multiple entries describe a polymorphic association.
For arrays, put `x-association-target` on `items` when each item is an identifier.
The annotation adds semantics and links, but it does not verify referential integrity between instance values.
Unlike an ordinary `$ref`, an association target may point to a direct property such as `#/definitions/Product/id`.

Spec Toolkit removes its own `x-` annotations from the generated JSON Schema by default.
Preserve an annotation only when a downstream consumer needs it.

```json
{
  "generalConfig": {
    "preservedCoreSpecificXProperties": [
      "x-association-target",
      "x-recommended",
      "x-introduced-in-version"
    ]
  }
}
```

## Improve the generated reference

Core annotations control documentation without changing ordinary JSON Schema validation.
This example marks an optional field as recommended, adds lifecycle information, and controls the order of definitions in the generated page.

```yaml
x-property-order:
  - Product
  - Service
type: object
properties:
  services:
    type: array
    items:
      $ref: "#/definitions/Service"
x-recommended:
  - services
definitions:
  Product:
    title: Product
    type: object
    x-introduced-in-version: "1.0.0"
    properties:
      legacyCode:
        type: string
        x-deprecated-in-version: "2.0.0"
        x-deprecation-text: Use `id` instead.
  Service:
    title: Service
    type: object
    x-feature-status: beta
```

`required` remains the validation rule.
`x-recommended` labels an optional property as recommended in the generated reference.
At the schema root, `x-property-order` orders the generated definition sections, and any unlisted definitions follow in source order.

The core authoring annotations are summarized below.

| Annotation | Place it on | Effect |
| --- | --- | --- |
| `x-recommended` | An object schema | Lists optional property names that the documentation labels as recommended. |
| `x-introduced-in-version` | A definition, property, or supported union branch | Shows when the element was introduced. |
| `x-deprecated-in-version` | A definition, property, or supported union branch | Shows when the element was deprecated. |
| `x-deprecation-text` | A definition or property | Explains the deprecation and migration path. |
| `x-feature-status` | A definition, property, or supported union branch | Adds a `proposed`, `alpha`, or `beta` status marker. |
| `x-association-target` | A property or array `items` schema | Links an identifier to one or more target definitions or identifier properties. |
| `x-hide` | A schema node | Omits the node from Markdown while retaining the modeled node in the exported schema. |
| `x-pattern-properties-description` | An object with `patternProperties` | Adds prose above generated pattern-property documentation. |
| `x-property-order` | The schema root | Orders definition sections in generated Markdown. |
| `x-header-level` | A definition | Overrides its generated Markdown heading level, whose default is 3. |
| `x-abstract` | A definition | Omits an abstract definition from the interface reference and identifies it for advanced plugin use. |
| `x-extension-points` | A base-spec definition | Names the extension points accepted by that definition. |
| `x-extension-targets` | An extension definition | Names the base extension points into which the definition is merged. |
| `x-ref-to-doc` | An extension definition or property | Links extension documentation to a definition in the base specification. |
| `x-custom-typescript-types` | The schema root | Declares advanced custom TypeScript types used by `tsType`. |

`tsType` is not an `x-` annotation, but it can override generated TypeScript for an advanced schema node.
Treat both `tsType` and `x-custom-typescript-types` as escape hatches because they couple the schema to the TypeScript generator.

## Split independently owned vocabularies into extensions

Use a specification extension when another vocabulary has its own lifecycle or maintainers.
The CSN Interop specification uses one extension file per annotation vocabulary.

First, name an extension point on a definition in the base schema.

```yaml
definitions:
  Service:
    title: Service
    type: object
    x-extension-points:
      - Service
    properties:
      id:
        type: string
  Contact:
    title: Contact
    type: object
    properties:
      email:
        type: string
        format: email
```

Then create an extension schema whose definitions target that name.

```yaml
$schema: "http://json-schema.org/draft-07/schema#"
$id: "https://example.com/spec/v1/ownership.schema.json#"
title: Ownership vocabulary
type: object
definitions:
  x-owner-team:
    title: Owner team
    type: string
    description: Team responsible for the service.
    x-extension-targets:
      - Service
  x-primary-contact:
    x-ref-to-doc:
      title: Contact
      ref: "#/definitions/Contact"
    x-extension-targets:
      - Service
```

Finally, register the extension against the base document's `id`.

```json
{
  "docsConfig": [
    {
      "type": "spec",
      "id": "catalog",
      "sourceFilePath": "./spec/v1/catalog.schema.yaml"
    },
    {
      "type": "specExtension",
      "id": "ownership",
      "sourceFilePath": "./spec/v1/ownership.schema.yaml",
      "sourceIntroFilePath": "./spec/v1/ownership.intro.md",
      "targetDocumentId": "catalog"
    }
  ]
}
```

Generation adds each targeted extension definition as a property of every base definition that declares the matching extension point.
It also includes extension definitions in the merged output schema.
Definition names must therefore be unique across the base schema and all of its extensions.

## Describe closed and extensible value sets

Use `oneOf` with `const` when each allowed value needs its own description or lifecycle metadata.
Spec Toolkit renders these branches as a documented enum.

```yaml
releaseState:
  type: string
  oneOf:
    - const: active
      description: Available for normal use.
    - const: deprecated
      description: Supported for compatibility only.
      x-deprecated-in-version: "2.0.0"
```

Use `anyOf` with documented `const` branches and a general string branch for an extensible value set.
This pattern lets future producers add values without changing the schema.

```yaml
industry:
  anyOf:
    - const: retail
      description: Retail industry.
    - const: manufacturing
      description: Manufacturing industry.
    - type: string
      description: Another industry identifier.
```

Only use an extensible value set when consumers are required to tolerate unknown values.

## Keep examples executable

Set `examplesFolderPath` on a `spec` entry to turn `.json` and `.jsonc` instance files into documentation pages.
Spec Toolkit validates every example against the generated schema and fails generation when an example is invalid.
This makes examples useful as both documentation and compatibility checks.

For `catalog.json`, optional neighboring files named `catalog.intro.md` and `catalog.outro.md` add prose before and after the rendered example.
Files beginning with `_` are ignored.

## Add plugin output only when needed

Plugins run after the core generators and write beneath `outputPath/plugin/`.
ORD enables the built-in Mermaid, tabular, and UMS plugins.
The following configuration adds a Mermaid class diagram and CSV/XLSX summaries.

```json
{
  "plugins": [
    {
      "packageName": "./node_modules/@open-resource-discovery/spec-toolkit/dist/plugin/mermaidDiagram/index.js"
    },
    {
      "packageName": "./node_modules/@open-resource-discovery/spec-toolkit/dist/plugin/tabular/index.js"
    }
  ]
}
```

The Java annotations plugin generates annotations and model classes and requires `packageAnnotations` and `modelPackage` options.
The UMS plugin is specialized metadata output and introduces `x-ums-type`, `x-ums-visibility`, `x-ums-implements`, and `x-ums-reverse-relationship`.
Use those plugin-specific annotations only with the UMS plugin.
Plugins remove their annotations from the exported JSON Schema unless their `preservedPluginSpecificXProperties` option lists the names to retain.
Plugins receive main source schemas rather than extension-merged schemas, so do not assume that plugin output contains extension-injected properties.

## Learn from complete specifications

The [ORD specification](https://github.com/open-resource-discovery/specification) is a useful example of a large schema with YAML anchors, associations, lifecycle metadata, executable examples, and several plugins.
The [CSN Interop specification](https://github.com/SAP/csn-interop-specification) shows extensive property-set reuse and separately maintained extension vocabularies.
Their source schemas and `spec-toolkit.config.json` files provide complete examples of the patterns introduced in this guide.

## Generate and review

Run the checked-in script.

```bash
npm run generate
```

Review all generated artifacts, not only the Markdown.
In particular, check that links resolve, TypeScript names are usable, examples pass validation, extension properties appear on the intended definitions, and only deliberately preserved annotations remain in the exported schema.
Commit the source and generated output together when the consuming repository follows that convention.
