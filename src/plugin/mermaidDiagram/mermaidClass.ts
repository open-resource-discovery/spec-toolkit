/* eslint-disable @typescript-eslint/no-explicit-any */
import { JSONSchema7, JSONSchema7Object } from "json-schema";
import { log } from "../../util/log.js";
import fs from "fs-extra";

export interface EntityRelationshipModel {
  entities: Entity[];
  relations: Relation[];
}

export type EntityId = string;

export interface Entity {
  id: EntityId;
  title: string;
  description?: string;
}

export type RelationId = string;
export interface Relation {
  id: RelationId;
  title: string;
  description?: string;

  type: "Association" | "Composition";
  /**
   * Whether relationship is mandatory or not
   */
  minCardinality: 0 | 1;
  /**
   * Should be between 1 and Infinity
   *
   * Infinity means unlimited (n)
   */
  maxCardinality: number;

  relationSource: EntityId;
  relationTarget: RelationId | RelationId[];
}

export class MermaidDiagram {
  private readonly classDiagramWithMarkdownMap: Map<string, string>;
  private readonly clickEventMap: Map<string, Set<string>>;
  private readonly jsonSchemaDocumentRoot: JSONSchema7;
  private readonly outputPath: string;
  private erModel: EntityRelationshipModel;

  public constructor(jsonSchemaDocumentRoot: JSONSchema7, outputPath: string) {
    this.jsonSchemaDocumentRoot = jsonSchemaDocumentRoot;
    this.outputPath = outputPath;
    this.classDiagramWithMarkdownMap = new Map<string, string>();
    this.clickEventMap = new Map<string, Set<string>>();
    this.erModel = {
      entities: [],
      relations: [],
    };
  }

  public generateOverallClassModel(): void {
    this.generateEntityRelationshipModel(this.jsonSchemaDocumentRoot);
    this.generateMermaidClassDiagram();
    this.writeClassDiagramToMarkdown();
  }

  public generateEntityRelationshipModel(schema: JSONSchema7): EntityRelationshipModel {
    const erModel: EntityRelationshipModel = {
      entities: [],
      relations: [],
    };

    if (!schema.definitions) {
      log.error("schema.definitions is empty, early return the empty model.");
      return this.erModel;
    }

    this.erModel = this.traverseSchemaDefinitions(erModel, schema);
    return this.erModel;
  }

  public generateMermaidClassDiagram(): Map<string, string> {
    this.erModel.entities.forEach((entity) => {
      const classDiagram = `classDiagram\n  class ${entity.id}\n  ${this.addMermaidStyle(entity.id)}`;
      this.classDiagramWithMarkdownMap.set(entity.id, classDiagram);
      this.clickEventMap.set(entity.id, new Set());
    });

    this.erModel.relations.forEach((relation) => {
      this.updateClassDiagramMapWithRelation(relation, relation.relationSource);
      if (relation.relationTarget !== relation.relationSource) {
        this.updateClassDiagramMapWithRelation(relation, relation.relationTarget);
      }
    });

    this.classDiagramWithMarkdownMap.forEach((_, key) => {
      const clickEvents = this.clickEventMap.get(key);
      if (clickEvents) {
        clickEvents.forEach((clickEvent) => {
          let content = this.classDiagramWithMarkdownMap.get(key);
          content += this.addClickEvent(clickEvent);
          if (!content) {
            log.error(`clickEvent not found in classDiagramWithMarkdownMap: `, clickEvent);
            return;
          }
          this.classDiagramWithMarkdownMap.set(key, content);
        });
      }
    });

    return this.classDiagramWithMarkdownMap;
  }

  private traverseSchemaDefinitions(erModel: EntityRelationshipModel, schema: JSONSchema7): EntityRelationshipModel {
    for (const jsonSchemaObjectName in schema.definitions) {
      const jsonSchemaObject = schema.definitions[jsonSchemaObjectName] as JSONSchema7Object;

      erModel.entities.push({
        id: jsonSchemaObjectName,
        title: (jsonSchemaObject.title as string) || jsonSchemaObjectName,
        description: jsonSchemaObject.description as string,
      });

      if (jsonSchemaObject.properties) {
        erModel = this.handleSchemaProperties(erModel, jsonSchemaObjectName, jsonSchemaObject);
      }
    }
    return erModel;
  }

  private handleSchemaProperties(
    erModel: EntityRelationshipModel,
    jsonSchemaObjectName: string,
    jsonSchemaObject: JSONSchema7Object,
  ): EntityRelationshipModel {
    const jsonSchemaProperties = jsonSchemaObject.properties as { [propertyName: string]: JSONSchema7Object };

    for (const propertyName in jsonSchemaProperties) {
      const property = jsonSchemaProperties[propertyName] as any;

      // Find Compositions
      if (property.$ref || property.items?.$ref) {
        const relation = this.constructRelationCompositions(
          jsonSchemaObjectName,
          jsonSchemaObject,
          propertyName,
          property,
        );
        erModel.relations.push(relation);
      }
      // Find Compositions for anyOf
      if (property.items?.anyOf) {
        for (const anyOfItem of property.items.anyOf) {
          if (anyOfItem.$ref) {
            const relation = this.constructRelationCompositions(
              jsonSchemaObjectName,
              jsonSchemaObject,
              propertyName,
              anyOfItem,
            );
            erModel.relations.push(relation);
          }
        }
      }

      // Find Associations
      if (property["x-association-target"] || property.items?.["x-association-target"]) {
        const relation = this.constructRelationAssociations(
          jsonSchemaObjectName,
          jsonSchemaObject,
          propertyName,
          property,
        );
        erModel.relations.push(relation);
      }
    }
    return erModel;
  }

  private constructRelationCompositions(
    jsonSchemaObjectName: string,
    jsonSchemaObject: JSONSchema7Object,
    propertyName: string,
    property: any,
  ): Relation {
    const ref = property.$ref || property.items?.$ref;
    const relation = this.prepareRelationObject(jsonSchemaObjectName, propertyName, property);
    relation.type = "Composition";
    relation.relationTarget = ref.replace("#/definitions/", "");

    if (property.items) {
      relation.maxCardinality = Infinity;
    }
    if (jsonSchemaObject.required) {
      const requiredArray = jsonSchemaObject.required as string[];
      if (requiredArray.includes(propertyName)) {
        relation.minCardinality = 1;
      }
    }
    return relation;
  }

  private constructRelationAssociations(
    jsonSchemaObjectName: string,
    jsonSchemaObject: JSONSchema7Object,
    propertyName: string,
    property: any,
  ): Relation {
    const associationTarget =
      property["x-association-target"] || (property.items?.["x-association-target"] as string[]);
    const relation = this.prepareRelationObject(jsonSchemaObjectName, propertyName, property);
    relation.type = "Association";
    relation.relationTarget = associationTarget[0].replace("#/definitions/", "").split("/")[0];

    if (property.items) {
      relation.maxCardinality = Infinity;
    }
    if (jsonSchemaObject.required) {
      const requiredArray = jsonSchemaObject.required as string[];
      if (requiredArray.includes(propertyName)) {
        relation.minCardinality = 1;
      }
    }
    if (associationTarget.length > 1) {
      relation.relationTarget = associationTarget.map((el: string) => {
        return el.replace("#/definitions/", "").split("/")[0];
      });
    }
    return relation;
  }

  private prepareRelationObject(jsonSchemaObjectName: string, propertyName: string, property: any): Relation {
    const relation: Relation = {
      id: `${jsonSchemaObjectName}.${propertyName}`,
      title: property.title || propertyName,
      description: property.description,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      type: "Composition" || "Association", // eslint-disable-line no-constant-binary-expression
      maxCardinality: 1,
      minCardinality: 0,
      relationSource: jsonSchemaObjectName,
      relationTarget: "",
    };
    return relation;
  }

  public writeClassDiagramToMarkdown(): void {
    if (!this.jsonSchemaDocumentRoot.title) {
      log.warn('No "title" provided for JSON Schema root object, using "defaultTitle" as title.');
    }

    const title = this.jsonSchemaDocumentRoot.title || "DefaultTitle";

    let content = `#${title} Diagram`;
    this.classDiagramWithMarkdownMap.forEach((value, key) => {
      content += `\n\n## ${key}`;
      content += this.wrapInMermaidCodeBlock(value);
    });
    const filePath = `${this.outputPath}/${title.toLowerCase().replaceAll(" ", "-")}.md`;
    fs.outputFileSync(filePath, content);
    log.info(`Generated Class Diagram: ${filePath}`);
  }

  private wrapInMermaidCodeBlock(content: string): string {
    return `
  \`\`\`mermaid
  ${content}
  \`\`\`
  `;
  }

  private addMermaidStyle(entityName: string): string {
    return `style ${entityName} stroke:#333,stroke-width:3px`;
  }

  private addClickEvent(entityName: string): string {
    const anchorLink = entityName.toLowerCase();
    return `\n  click ${entityName} href "#${anchorLink}" "Go to ${entityName}"`;
  }

  private updateClassDiagramMapWithRelation(relation: Relation, target: string | string[]): void {
    if (target instanceof Array) {
      target.forEach((el) => {
        this.updateClassDiagramMapWithRelation(relation, el);
      });
      return;
    }
    let classDiagramRelation = this.classDiagramWithMarkdownMap.get(target);
    if (!classDiagramRelation) {
      log.error(`relationSource not found in classDiagramWithMarkdownMap: `, relation);
      return;
    }
    classDiagramRelation += this.constructClassDiagramRelation(relation);
    this.classDiagramWithMarkdownMap.set(target, classDiagramRelation);
  }

  private constructClassDiagramRelation(relation: Relation): string {
    const relationSource = relation.relationSource;
    const relationTarget = relation.relationTarget;
    const relationType = relation.type;
    const cardinality = this.getCardinalityWithFormat(relation.minCardinality, relation.maxCardinality);
    const relationArrow = relationType === "Composition" ? "*--" : "-->";
    const relationTitle = relation.title;

    // early return if relationTarget is an array
    if (relationTarget instanceof Array) {
      return "";
    }
    this.updateClickSet(relationSource, relationTarget);

    const classDiagramRelation = `\n  ${relationSource} ${relationArrow} "${cardinality}" ${relationTarget} : ${relationTitle}`;
    return classDiagramRelation;
  }

  private updateClickSet(relationSource: string, relationTarget: string): void {
    this.clickEventMap.get(relationSource)?.add(relationSource);
    this.clickEventMap.get(relationSource)?.add(relationTarget);
    this.clickEventMap.get(relationTarget)?.add(relationSource);
  }

  private getCardinalityWithFormat(minCardinality: number, maxCardinality: number): string {
    if (minCardinality === 0 && maxCardinality === 1) {
      return "0..1";
    }
    if (minCardinality === 1 && maxCardinality === 1) {
      return "1";
    }
    if (minCardinality === 0 && maxCardinality === Infinity) {
      return "0..*";
    }
    if (minCardinality === 1 && maxCardinality === Infinity) {
      return "1..*";
    }
    return `${minCardinality}..${maxCardinality}`;
  }

  public getErModel(): EntityRelationshipModel {
    return this.erModel;
  }

  public getClassDiagramWithMarkdownMap(): Map<string, string> {
    return this.classDiagramWithMarkdownMap;
  }
}
