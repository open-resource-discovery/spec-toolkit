---
title: "Spec-Toolkit CLI"
sidebar_position: "5"
description: "Describes the technical interface / schema for the Spec-Toolkit CLI configuration."
---

# Spec-Toolkit CLI

This documentation explains how to use the Spec-Toolkit CLI tool. However, most will be done via the [configuration file](#configuration-file-interface-documentation).

## Prerequisite

1. You have installed Node v22 or higher and npm v10 or higher from: [nodejs](https://nodejs.org/en/download/).

1. You have installed the CLI tool on your local machine.

   ```bash
   npm install -g @open-resource-discovery/spec-toolkit
   ```

1. You have prepared a local [configuration file](#configuration-file-interface-documentation).

## CLI signature

Use the CLI tool via [npx](https://docs.npmjs.com/cli/v11/commands/npx).

```sh
# By default it will look for a `./spec-toolkit.config.json` config file in the CWD
npx @open-resource-discovery/spec-toolkit

# Possible to pass a configuration file by file path
npx @open-resource-discovery/spec-toolkit -c ./spec-toolkit.config.json

```

## CLI options

| Name | Value              | Description                                           |
| ---- | ------------------ | ----------------------------------------------------- |
| `-c` | `<configFilePath>` | Configuration file, containing a valid JSON document. |

## Configuration File Interface Documentation

Spec-Toolkit CLI root level configuration document (`spec-toolkit.config.json`), which contains:

- Global config
- Array of all specs JSON Schema files as input and their configuration
- Optional: Array of all spec extensions and their configuration
- Optional: Add plugin config for additional output formats (like diagrams, example files, typescript types).

## Schema Definitions

* The root schema of the document is [Spec-Toolkit Configuration Document](#spec-toolkit-configuration-document)
* The interface is available as JSON Schema: [spec-toolkit-config.schema.json](https://open-resource-discovery.github.io/spec-toolkit/spec-v1/spec-toolkit-config.schema.json#).


### Spec-Toolkit Configuration Document

**Type**: Object(<a href="#spec-toolkit-configuration-document_$schema">$schema</a>, <a href="#spec-toolkit-configuration-document_$id">$id</a>, <a href="#spec-toolkit-configuration-document_generalconfig">generalConfig</a>, <a href="#spec-toolkit-configuration-document_outputpath">outputPath</a>, <a href="#spec-toolkit-configuration-document_docsconfig">docsConfig</a>, <a href="#spec-toolkit-configuration-document_plugins">plugins</a>)

| Property | Type | Description |
| -------- | ---- | ----------- |
|<div className="interface-property-name anchor" id="spec-toolkit-configuration-document_$schema">$schema<br/><span className="optional">OPTIONAL</span><a className="hash-link" href="#spec-toolkit-configuration-document_$schema" title="#spec-toolkit-configuration-document_$schema"></a></div>|<div className="interface-property-type">string</div>|<div className="interface-property-description">Link to JSON Schema for this spec-toolkit configuration document.<br/>Adding this helps with automatic validation and code intelligence in some editors / IDEs.<br/><br/>See https://tour.json-schema.org/content/06-Combining-Subschemas/02-id-and-schema<br/><hr/>**JSON Schema Format**: `uri-reference`<br/>**Array Item Allowed Values (extensible)**: <ul><li>`"https://github.com/open-resource-discovery/spec-toolkit/spec-v1/spec-toolkit.schema.json#"`</li><li><em>Any</em> string of format `uri-reference`</li></ul></div>|
|<div className="interface-property-name anchor" id="spec-toolkit-configuration-document_$id">$id<br/><span className="optional">OPTIONAL</span><a className="hash-link" href="#spec-toolkit-configuration-document_$id" title="#spec-toolkit-configuration-document_$id"></a></div>|<div className="interface-property-type">string</div>|<div className="interface-property-description">Optional URI for this document, that can acts as an ID or as location to retrieve the document.<br/><br/>See https://tour.json-schema.org/content/06-Combining-Subschemas/02-id-and-schema<br/><hr/>**JSON Schema Format**: `uri-reference`</div>|
|<div className="interface-property-name anchor" id="spec-toolkit-configuration-document_generalconfig">generalConfig<br/><span className="optional">OPTIONAL</span><a className="hash-link" href="#spec-toolkit-configuration-document_generalconfig" title="#spec-toolkit-configuration-document_generalconfig"></a></div>|<div className="interface-property-type">[GeneralConfig](#generalconfig)</div>|<div className="interface-property-description">General configuration for the spec-toolkit.<br/>This is optional and can be omitted if no general configuration is needed.</div>|
|<div className="interface-property-name anchor" id="spec-toolkit-configuration-document_outputpath">outputPath<br/><span className="mandatory">MANDATORY</span><a className="hash-link" href="#spec-toolkit-configuration-document_outputpath" title="#spec-toolkit-configuration-document_outputpath"></a></div>|<div className="interface-property-type">string</div>|<div className="interface-property-description">The output path where the generated files will be written to.<br/><br/>This is relative to the location of the configuration document.</div>|
|<div className="interface-property-name anchor" id="spec-toolkit-configuration-document_docsconfig">docsConfig<br/><span className="mandatory">MANDATORY</span><a className="hash-link" href="#spec-toolkit-configuration-document_docsconfig" title="#spec-toolkit-configuration-document_docsconfig"></a></div>|<div className="interface-property-type">Array&lt;[SpecConfig](#specconfig) \| [SpecExtensionConfig](#specextensionconfig)&gt;</div>|<div className="interface-property-description">Configuration for the documentation generation.<hr/>**Array Constraint**: MUST have at least 1 items</div>|
|<div className="interface-property-name anchor" id="spec-toolkit-configuration-document_plugins">plugins<br/><span className="optional">OPTIONAL</span><a className="hash-link" href="#spec-toolkit-configuration-document_plugins" title="#spec-toolkit-configuration-document_plugins"></a></div>|<div className="interface-property-type">Array&lt;[PluginConfigData](#pluginconfigdata)&gt;</div>|<div className="interface-property-description">Array of optional plugins to be used for the generation.<br/>Each configured plugin will generate additional output files depending on his specific scope.</div>|


### GeneralConfig

This is the general configuration for the spec-toolkit.
This is optional and can be omitted if no general configuration is needed.

**Type**: Object(<a href="#generalconfig_tstypeexportexcludejsfileextension">tsTypeExportExcludeJsFileExtension</a>)

| Property | Type | Description |
| -------- | ---- | ----------- |
|<div className="interface-property-name anchor" id="generalconfig_tstypeexportexcludejsfileextension">tsTypeExportExcludeJsFileExtension<br/><span className="optional">OPTIONAL</span><a className="hash-link" href="#generalconfig_tstypeexportexcludejsfileextension" title="#generalconfig_tstypeexportexcludejsfileextension"></a></div>|<div className="interface-property-type">boolean</div>|<div className="interface-property-description">If set to `true`, the generated TypeScript types will exclude the `.js` file extension in the export statements.<br/>The '.js' file extension is useful for compatibility with Node.js ESM modules but in Node.js commonjs modules it is not needed.<hr/>**Default Value**: `true`</div>|


### DocsConfigItem

Definition of a docsConfig item.

**Type**: 
[SpecConfig](#specconfig) \| [SpecExtensionConfig](#specextensionconfig)<br/>
**Type**: Object(<a href="#docsconfigitem_type">type</a>)

| Property | Type | Description |
| -------- | ---- | ----------- |
|<div className="interface-property-name anchor" id="docsconfigitem_type">type<br/><span className="mandatory">MANDATORY</span><a className="hash-link" href="#docsconfigitem_type" title="#docsconfigitem_type"></a></div>|<div className="interface-property-type">string</div>|<div className="interface-property-description">The docsConfig item type.<br/>It's value is been used as a _discriminator_ to distinguish the matching schema that should be further validated.<hr/>**Allowed Values**: <ul><li>`"spec"`</li><li>`"specExtension"`</li></ul></div>|


### SpecConfig

This is the configuration for a JSON Schema specification.

**Type**: Object(<a href="#specconfig_type">type</a>, <a href="#specconfig_id">id</a>, <a href="#specconfig_sourcefilepath">sourceFilePath</a>, <a href="#specconfig_sourceintrofilepath">sourceIntroFilePath</a>, <a href="#specconfig_sourceoutrofilepath">sourceOutroFilePath</a>, <a href="#specconfig_examplesfolderpath">examplesFolderPath</a>, <a href="#specconfig_mdfrontmatter">mdFrontmatter</a>)

| Property | Type | Description |
| -------- | ---- | ----------- |
|<div className="interface-property-name anchor" id="specconfig_type">type<br/><span className="mandatory">MANDATORY</span><a className="hash-link" href="#specconfig_type" title="#specconfig_type"></a></div>|<div className="interface-property-type">string</div>|<div className="interface-property-description">Type is used to identify the type of the configuration.<br/><hr/>**Constant Value**: `spec`</div>|
|<div className="interface-property-name anchor" id="specconfig_id">id<br/><span className="mandatory">MANDATORY</span><a className="hash-link" href="#specconfig_id" title="#specconfig_id"></a></div>|<div className="interface-property-type">string</div>|<div className="interface-property-description">The ID of the specification.<br/>This is used to identify the specification in the generated documentation.<br/></div>|
|<div className="interface-property-name anchor" id="specconfig_sourcefilepath">sourceFilePath<br/><span className="mandatory">MANDATORY</span><a className="hash-link" href="#specconfig_sourcefilepath" title="#specconfig_sourcefilepath"></a></div>|<div className="interface-property-type">string</div>|<div className="interface-property-description">The path to the source file of the JSON Schema specification.<br/>This is used to generate the documentation for the specification.<br/><br/>It can be a `.yaml` or `.json` file.<br/><br/>The JSON Schema specification MUST NOT contain objects nested in objects.<br/>Example:<br/>  <code>type: object<br/>    properties:<br/>     &nbsp;&nbsp;fullName:<br/>        &nbsp;&nbsp;&nbsp;&nbsp;type: object<br/>        &nbsp;&nbsp;&nbsp;&nbsp;properties:<br/>          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;firstName:<br/>            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;type: string<br/>          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;lastName:<br/>            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;type: string<br/>      &nbsp;&nbsp;age:<br/>        &nbsp;&nbsp;&nbsp;&nbsp;type: integer<br/>  </code><br/>MUST be replaced by:<br/>  <code>type: object<br/>    properties:<br/>     &nbsp;&nbsp;fullName:<br/>        &nbsp;&nbsp;&nbsp;&nbsp;$ref: "#/definitions/FullName"<br/>      &nbsp;&nbsp;age:<br/>        &nbsp;&nbsp;&nbsp;&nbsp;type: integer<br/>  </code><br/></div>|
|<div className="interface-property-name anchor" id="specconfig_sourceintrofilepath">sourceIntroFilePath<br/><span className="optional">OPTIONAL</span><a className="hash-link" href="#specconfig_sourceintrofilepath" title="#specconfig_sourceintrofilepath"></a></div>|<div className="interface-property-type">string</div>|<div className="interface-property-description">The path to the source intro file of the specification.<br/>This is used to generate the documentation for the specification and will be appended at the beginning.<br/></div>|
|<div className="interface-property-name anchor" id="specconfig_sourceoutrofilepath">sourceOutroFilePath<br/><span className="optional">OPTIONAL</span><a className="hash-link" href="#specconfig_sourceoutrofilepath" title="#specconfig_sourceoutrofilepath"></a></div>|<div className="interface-property-type">string</div>|<div className="interface-property-description">The path to the source outro file of the specification.<br/>This is used to generate the documentation for the specification and will be appended at the end.<br/></div>|
|<div className="interface-property-name anchor" id="specconfig_examplesfolderpath">examplesFolderPath<br/><span className="optional">OPTIONAL</span><a className="hash-link" href="#specconfig_examplesfolderpath" title="#specconfig_examplesfolderpath"></a></div>|<div className="interface-property-type">string</div>|<div className="interface-property-description">The path to the folder containing the examples for the specification.<br/>This is used to generate the documentation for the specification.<br/><br/>This folder MUST contain specification compliant instance example files with extension `.json` or `.jsonc`.<br/>The instance example files will be validated against the specification during generation.<br/><br/>If omitted, no examples will be included in the generated documentation.<br/><br/>If provided, the folder MAY also contain for each instance example file e.g. `myExample.json` or `myExample.jsonc` optional *intro* and *outro* markdown files.<br/>This *intro/outro* content will be included in the generated documentation before and after the `myExample.json` or `myExample.jsonc` content.<br/><br/>If an *intro* file is provided, it MUST be named `myExample.intro.md`.<br/>If an *outro* file is provided, it MUST be named `myExample.outro.md`.<br/>Otherwise the *intro/outro* content will be omitted for the specific example.<br/><br/>If an *intro* file is provided it SHOULD contain the markdown frontmatter with at least `title` and `description` for the example.<br/></div>|
|<div className="interface-property-name anchor" id="specconfig_mdfrontmatter">mdFrontmatter<br/><span className="optional">OPTIONAL</span><a className="hash-link" href="#specconfig_mdfrontmatter" title="#specconfig_mdfrontmatter"></a></div>|<div className="interface-property-type">[MdFrontmatter](#mdfrontmatter)</div>|<div className="interface-property-description">Frontmatter for the generated documentation.<br/>This is used to generate the markdown frontmatter for the documentation page.</div>|


### SpecExtensionConfig

This is the configuration for a JSON Schema extension specification.

**Type**: Object(<a href="#specextensionconfig_type">type</a>, <a href="#specextensionconfig_id">id</a>, <a href="#specextensionconfig_sourcefilepath">sourceFilePath</a>, <a href="#specextensionconfig_sourceintrofilepath">sourceIntroFilePath</a>, <a href="#specextensionconfig_sourceoutrofilepath">sourceOutroFilePath</a>, <a href="#specextensionconfig_targetdocumentid">targetDocumentId</a>, <a href="#specextensionconfig_mdfrontmatter">mdFrontmatter</a>)

| Property | Type | Description |
| -------- | ---- | ----------- |
|<div className="interface-property-name anchor" id="specextensionconfig_type">type<br/><span className="mandatory">MANDATORY</span><a className="hash-link" href="#specextensionconfig_type" title="#specextensionconfig_type"></a></div>|<div className="interface-property-type">string</div>|<div className="interface-property-description">Type is used to identify the type of the configuration.<br/><hr/>**Constant Value**: `specExtension`</div>|
|<div className="interface-property-name anchor" id="specextensionconfig_id">id<br/><span className="mandatory">MANDATORY</span><a className="hash-link" href="#specextensionconfig_id" title="#specextensionconfig_id"></a></div>|<div className="interface-property-type">string</div>|<div className="interface-property-description">The ID of the specification.<br/>This is used to identify the specification in the generated documentation.<br/></div>|
|<div className="interface-property-name anchor" id="specextensionconfig_sourcefilepath">sourceFilePath<br/><span className="mandatory">MANDATORY</span><a className="hash-link" href="#specextensionconfig_sourcefilepath" title="#specextensionconfig_sourcefilepath"></a></div>|<div className="interface-property-type">string</div>|<div className="interface-property-description">The path to the source file of the specification.<br/>This is used to generate the documentation for the specification.<br/></div>|
|<div className="interface-property-name anchor" id="specextensionconfig_sourceintrofilepath">sourceIntroFilePath<br/><span className="optional">OPTIONAL</span><a className="hash-link" href="#specextensionconfig_sourceintrofilepath" title="#specextensionconfig_sourceintrofilepath"></a></div>|<div className="interface-property-type">string</div>|<div className="interface-property-description">The path to the source intro file of the specification.<br/>This is used to generate the documentation for the specification and will be appended at the beginning.<br/></div>|
|<div className="interface-property-name anchor" id="specextensionconfig_sourceoutrofilepath">sourceOutroFilePath<br/><span className="optional">OPTIONAL</span><a className="hash-link" href="#specextensionconfig_sourceoutrofilepath" title="#specextensionconfig_sourceoutrofilepath"></a></div>|<div className="interface-property-type">string</div>|<div className="interface-property-description">The path to the source outro file of the specification.<br/>This is used to generate the documentation for the specification and will be appended at the end.<br/></div>|
|<div className="interface-property-name anchor" id="specextensionconfig_targetdocumentid">targetDocumentId<br/><span className="mandatory">MANDATORY</span><a className="hash-link" href="#specextensionconfig_targetdocumentid" title="#specextensionconfig_targetdocumentid"></a></div>|<div className="interface-property-type">string</div>|<div className="interface-property-description">The ID of the target document.<br/>This is used to identify the target document in the generated documentation.<br/></div>|
|<div className="interface-property-name anchor" id="specextensionconfig_mdfrontmatter">mdFrontmatter<br/><span className="optional">OPTIONAL</span><a className="hash-link" href="#specextensionconfig_mdfrontmatter" title="#specextensionconfig_mdfrontmatter"></a></div>|<div className="interface-property-type">[MdFrontmatter](#mdfrontmatter)</div>|<div className="interface-property-description">Frontmatter for the generated documentation.<br/>This is used to generate the markdown frontmatter for the documentation page.</div>|


### MdFrontmatter

Frontmatter for the generated documentation.
This is used to generate the markdown frontmatter for the documentation page.

| Property | Type | Description |
| -------- | ---- | ----------- |
| Additional Properties<br/><i><code className="regex">^[a-zA-Z0-9_]+$</code></i><br/><span className="optional">OPTIONAL</span> | string | The key of the frontmatter.<br/>This is used to generate the frontmatter for the documentation.<br/><br/><i>Additional properties MUST follow key name regexp pattern</i>: <code className="regex">^[a-zA-Z0-9_]+$</code> |


### PluginConfigData

Configuration for a plugin to be used in the generation.

**Type**: Object(<a href="#pluginconfigdata_packagename">packageName</a>, <a href="#pluginconfigdata_options">options</a>)

| Property | Type | Description |
| -------- | ---- | ----------- |
|<div className="interface-property-name anchor" id="pluginconfigdata_packagename">packageName<br/><span className="mandatory">MANDATORY</span><a className="hash-link" href="#pluginconfigdata_packagename" title="#pluginconfigdata_packagename"></a></div>|<div className="interface-property-type">string</div>|<div className="interface-property-description">The package name or path to the plugin implementation.<br/><br/>Plugins are implemented as Node.js modules and can be specified by their package name or by a relative path to the spec-toolkit CLI tool when the plugins are maintained in the core spec-toolkit repository.</div>|
|<div className="interface-property-name anchor" id="pluginconfigdata_options">options<br/><span className="optional">OPTIONAL</span><a className="hash-link" href="#pluginconfigdata_options" title="#pluginconfigdata_options"></a></div>|<div className="interface-property-type">[PluginOptions](#pluginoptions)</div>|<div className="interface-property-description">Optional configuration for the plugin.<br/>This is used to pass additional options to the plugin.</div>|


###### Example Values:


```js
{
  "packageName": "./node_modules/@open-resource-discovery/spec-toolkit/dist/plugin/tabular/index.js"
}
```


```js
{
  "packageName": "./node_modules/@open-resource-discovery/spec-toolkit/dist/plugin/mermaidDiagram/index.js"
}
```


```js
{
  "packageName": "./node_modules/@open-resource-discovery/spec-toolkit/dist/plugin/ums/index.js",
  "options": {
    "metadataPath": "/sap/core/ucl/metadata/ord/v1",
    "overrides": [
      "./document.ums.yaml"
    ]
  }
}
```


```js
{
  "packageName": "@yourNamespace/yourNpmSpecToolkitPluginPackageName"
}
```


### PluginOptions

Optional configuration for the plugin.
This is used to pass additional options to the plugin.

**Type**: Object()

| Property | Type | Description |
| -------- | ---- | ----------- |
| <i>*</i> | | <i>Additional, unspecified properties MAY be added to the object</i>. |

# Spec-Toolkit CLI configuration example

```json
{
  "outputPath": "src/generated/spec-v1",
  "docsConfig": [
    {
      "type": "spec",
      "id": "csn-interop-effective",
      "sourceFilePath": "./spec/v1/CSN-Interop-Effective.schema.yaml",
      "sourceIntroFilePath": "./spec/v1/CSN-Interop-Effective.schema.md",
      "examplesFolderPath": "./spec/v1/examples",
      "mdFrontmatter": {
        "title": "Interface Documentation",
        "sidebar_position": "1",
        "description": "Describes the technical interface / schema for CSN Interop Effective.",
        "toc_max_heading_level": "4"
      }
    },
    {
      "type": "specExtension",
      "id": "aggregation",
      "sourceFilePath": "./spec/v1/annotations/aggregation.yaml",
      "sourceIntroFilePath": "./spec/v1/annotations/aggregation.md",
      "targetDocumentId": "csn-interop-effective",
      "mdFrontmatter": {
        "title": "@Aggregation",
        "sidebar_position": "2",
        "description": "@Aggregation annotations."
      }
    },
    {
      "type": "specExtension",
      "id": "analytics-details",
      "sourceFilePath": "./spec/v1/annotations/analytics-details.yaml",
      "sourceIntroFilePath": "./spec/v1/annotations/analytics-details.md",
      "targetDocumentId": "csn-interop-effective",
      "mdFrontmatter": {
        "title": "@AnalyticsDetails",
        "sidebar_position": "3",
        "description": "@AnalyticsDetails for data analytics use cases."
      }
    },
    {
      "type": "specExtension",
      "id": "consumption",
      "sourceFilePath": "./spec/v1/annotations/consumption.yaml",
      "sourceIntroFilePath": "./spec/v1/annotations/consumption.md",
      "targetDocumentId": "csn-interop-effective",
      "mdFrontmatter": {
        "title": "@Consumption",
        "sidebar_position": "4",
        "description": "@Consumption annotations."
      }
    },
    {
      "type": "specExtension",
      "id": "end-user-text",
      "sourceFilePath": "./spec/v1/annotations/end-user-text.yaml",
      "sourceIntroFilePath": "./spec/v1/annotations/end-user-text.md",
      "targetDocumentId": "csn-interop-effective",
      "mdFrontmatter": {
        "title": "@EndUserText",
        "sidebar_position": "5",
        "description": "@EndUserText annotations for end user UIs."
      }
    },
    {
      "type": "specExtension",
      "id": "entity-relationship",
      "sourceFilePath": "./spec/v1/annotations/entity-relationship.yaml",
      "sourceIntroFilePath": "./spec/v1/annotations/entity-relationship.md",
      "sourceOutroFilePath": "./spec/v1/annotations/entity-relationship.outro.md",
      "targetDocumentId": "csn-interop-effective",
      "mdFrontmatter": {
        "title": "@EntityRelationship",
        "sidebar_position": "6",
        "description": "@EntityRelationship annotations for cross boundary Entity-Relationship IDs and associations."
      }
    },
    {
      "type": "specExtension",
      "id": "object-model",
      "sourceFilePath": "./spec/v1/annotations/object-model.yaml",
      "sourceIntroFilePath": "./spec/v1/annotations/object-model.md",
      "targetDocumentId": "csn-interop-effective",
      "mdFrontmatter": {
        "title": "@ObjectModel",
        "sidebar_position": "7",
        "description": "@ObjectModel annotations."
      }
    },
    {
      "type": "specExtension",
      "id": "odm",
      "sourceFilePath": "./spec/v1/annotations/odm.yaml",
      "sourceIntroFilePath": "./spec/v1/annotations/odm.md",
      "targetDocumentId": "csn-interop-effective",
      "mdFrontmatter": {
        "title": "@ODM",
        "sidebar_position": "8",
        "description": "@ODM for One Domain Model (ODM) related annotations."
      }
    },
    {
      "type": "specExtension",
      "id": "personal-data",
      "sourceFilePath": "./spec/v1/annotations/personal-data.yaml",
      "sourceIntroFilePath": "./spec/v1/annotations/personal-data.md",
      "targetDocumentId": "csn-interop-effective",
      "mdFrontmatter": {
        "title": "@PersonalData",
        "sidebar_position": "9",
        "description": "@PersonalData to annotate DPP relevant information."
      }
    },
    {
      "type": "specExtension",
      "id": "semantics",
      "sourceFilePath": "./spec/v1/annotations/semantics.yaml",
      "sourceIntroFilePath": "./spec/v1/annotations/semantics.md",
      "targetDocumentId": "csn-interop-effective",
      "mdFrontmatter": {
        "title": "@Semantics",
        "sidebar_position": "10",
        "description": "@Semantics annotations."
      }
    }
  ]
}
```