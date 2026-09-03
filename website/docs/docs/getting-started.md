---
sidebar_position: 1
sidebar_collapsible: false
sidebar_collapsed: false
---

# Getting Started

While writing a JSON Schema specification, you may want to separate concerns, group definitions by category, or reuse definitions.
Different authors may also maintain definitions for the domains they know best.

Spec Toolkit therefore supports two types of source file:

- JSON Schema specifications; and
- optional JSON Schema _extensions_ that are merged into a main specification for advanced use cases.

The following steps show a typical workflow.

1. Create a YAML file that defines your interface as JSON Schema.

   ```yaml
   $schema: "https://open-resource-discovery.github.io/spec-toolkit/spec-v1/spec.schema.json#"
   title: Bookstore Document
   description: |-
     This is the interface description of a Bookstore v1.
     Its purpose is to describe all properties allowed to be maintained for a Bookstore document.
   type: object
   properties:
     $schema:
       type: string
       format: uri-reference
       description: |
         Link to the JSON Schema for this Bookstore document.
         This enables automatic validation and code intelligence in supported editors.
     $id:
       type: string
       format: uri-reference
       description: |
         Optional URI that identifies this document or locates it.
     title:
       type: string
       description: Descriptive title for the Bookstore.
     books:
       type: array
       description: Book items for the Bookstore.
       items:
         $ref: "#/definitions/Book"
       minItems: 1
   required:
     - books
   additionalProperties: false

   definitions:
     Book:
       type: object
       properties:
         author:
           type: string
           description: The book author's full name.
         genre:
           $ref: "#/definitions/Genre"
     Genre:
       type: object
       description: Definition of book genre.
       properties:
         type:
           type: string
           enum:
             - "drama"
             - "comedy"
             - "action"
           description: |-
             The book's genre.
             Its value identifies the selected genre.
       required:
         - type
   ```

1. Optionally, create a YAML extension file to merge additional definitions into the main JSON Schema.

   ```yaml
   $schema: "http://json-schema.org/draft-07/schema#"
   title: Author Document
   description: Describes an author.
   type: object
   definitions:
     Author:
       type: object
       description: Describes the structure of an author.
       properties:
         name:
           type: string
         birthDate:
           type: string
           format: date
         bankAccount:
           type: string
         contract:
           type: string
           enum:
             - "freelancer"
             - "employee"
       required:
         - name
       x-extension-targets:
         - Book
   ```

1. Create a Spec Toolkit configuration file that describes what to generate.

   ```jsonc
   {
     "$schema": "https://open-resource-discovery.github.io/spec-toolkit/spec-v1/spec-toolkit-config.schema.json#",
     "outputPath": "src/generated/spec-v1",
     "docsConfig": [
       {
         "type": "spec",
         "id": "spec-bookstore",
         "sourceFilePath": "./spec/v1/bookstore.schema.yaml",
         "mdFrontmatter": {
           "title": "Bookstore",
           "description": "Describes the schema for the Bookstore."
         }
       },
       // highlight-start
       // Optional for simple use cases:
       // merge the extension into the main schema and generate its documentation
       {
         "type": "specExtension",
         "id": "spec-author",
         "sourceFilePath": "./spec/v1/author.schema.yaml",
         "mdFrontmatter": {
           "title": "Author",
           "description": "Describes the schema for the Author."
         }
       }
       // highlight-end
     ]
   }
   ```

1. Run Spec Toolkit after completing the [prerequisite](./spec-toolkit-config.md#prerequisite).

   ```bash
   npx @open-resource-discovery/spec-toolkit -c ./spec-toolkit.config.json
   ```

1. Inspect the generated output and use it in your documentation or build process.
   Spec Toolkit generates three kinds of artifacts:

   - Markdown documentation for each main specification and extension;
   - JSON Schema files in `.json` format; and
   - TypeScript interfaces.
