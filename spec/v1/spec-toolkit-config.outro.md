# Spec-Toolkit CLI configuration example

```json
{
  "generalConfig": {
    "sortProperties": false
  },
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
