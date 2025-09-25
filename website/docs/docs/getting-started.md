---
sidebar_position: 1
sidebar_collapsible: false
sidebar_collapsed: false
---

# Getting Started

While writing a JSON Schema specification the wish may arise to be able to make some separation of concerns, grouping by definitions categories, or reusing specific definitions.
Some of the specification definitions may be governed by dedicated authors which have the business domain specific knowledge.

This is the reason why spec-toolkit supports two types of files:

- JSON Schema specifications
- _extensions_ for a JSON Schema specification that should be merged into JSON Schema specification. JSON Schema specifications _Extensions_ are _optional_ and intended to support advanced spec-toolkit use cases.

Such a specification writing process will be described below:

1. Start by writing a JSON Schema yaml file defining your interface. Example:

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
         Adding this helps with automatic validation and code intelligence in some editors / IDEs.
     $id:
       type: string
       format: uri-reference
       description: |
         Optional URI for this document, that can acts as an ID or as location to retrieve the document.
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
           description: The book author full name.
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
             The book item genre type.
             It's value is been used as a _discriminator_ to distinguish the matching book genre.
       required:
         - type
   ```

1. _Optional (can be omitted for a simple use case)_ write a JSON Schema _extension_ yaml file that should be merged into the _main_ JSON Schema file. Example:

   ```yaml
   $schema: "http://json-schema.org/draft-07/schema#"
   title: Author Document
   description: This is the interface description of Author.
   type: object
   definitions:
     Author:
       type: object
       description: The definition defines how an author object shall be constructed.
       properties:
         name:
           type: string
         birthDate:
           type: date
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

1. Define a spec-toolkit configuration file so that the CLI tool can identify how to generate the documentation. Example:

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
           "description": "Describes the technical interface / schema for the Bookstore."
         }
       },
       // highlight-start
       // Optional part (can be omitted for a simple use case):
       // specify how to merge the _extension_ JSON Schema into the _main_ JSON Schema and generate the documentation
       {
         "type": "specExtension",
         "id": "spec-author",
         "sourceFilePath": "./spec/v1/author.schema.yaml",
         "mdFrontmatter": {
           "title": "Author",
           "description": "Describes the technical interface / schema for the Author."
         }
       }
       // highlight-end
     ]
   }
   ```

1. Execute the spec-toolkit CLI tool (check [prerequisite](https://github.com/open-resource-discovery/spec-toolkit/docs/spec-toolkit-config#prerequisite) first)

   ```bash
   npx @open-resource-discovery/spec-toolkit -c ./spec-toolkit.config.json
   ```

1. Inspect the spec-toolkit CLI tool generated output and use it for further processing.
   The tool generates 3 things:

   - markdown documentation files for each of the provided main spec and spec extension files
   - JSON Schema files in `.json` format
   - Typescript types interfaces
