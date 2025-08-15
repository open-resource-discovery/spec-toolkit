import { jest } from "@jest/globals";
import fs from "fs-extra";
import yaml from "js-yaml";
import { MermaidDiagram } from "./mermaidClass.js";
import { JSONSchema7 } from "json-schema";
describe("test generateDiagrams", () => {
  describe("test generateEntityRelationshipModel", () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it("should get correct entity relationship model", async () => {
      const jsonSchemaDocumentRoot = yaml.load(
        (await fs.readFile(`./src/plugin/mermaidDiagram/testData/testDiagramDocumentSchema.yaml`)).toString(),
      ) as JSONSchema7;

      const mermaidDiagram = new MermaidDiagram(
        jsonSchemaDocumentRoot,
        `./src/plugin/mermaidDiagrams/testData/results`,
      );
      const erModel = mermaidDiagram.generateEntityRelationshipModel(jsonSchemaDocumentRoot);
      expect(erModel.entities).toHaveLength(2);
      expect(erModel.relations).toHaveLength(5);
    });
  });

  describe("test generateMermaidClassDiagram", () => {
    it("should generate correct mermaid class diagram", async () => {
      const jsonSchemaDocumentRoot = yaml.load(
        (await fs.readFile(`./src/plugin/mermaidDiagram/testData/testDiagramDocumentSchema.yaml`)).toString(),
      ) as JSONSchema7;

      const mermaidDiagram = new MermaidDiagram(
        jsonSchemaDocumentRoot,
        `./src/plugin/mermaidDiagrams/testData/results`,
      );
      mermaidDiagram.generateEntityRelationshipModel(jsonSchemaDocumentRoot);
      mermaidDiagram.generateMermaidClassDiagram();
      const classDiagram = mermaidDiagram.getClassDiagramWithMarkdownMap();
      expect(classDiagram).toBeInstanceOf(Map);
      expect(classDiagram.size).toBe(2);
      expect(classDiagram.get("DefinitionA")).toContain("class DefinitionA");
    });

    it("should not generate duplicate relations when target and source are the same", async () => {
      const jsonSchemaDocumentRoot = yaml.load(
        (await fs.readFile(`./src/plugin/mermaidDiagram/testData/testDiagramDocumentSchema.yaml`)).toString(),
      ) as JSONSchema7;

      const mermaidDiagram = new MermaidDiagram(
        jsonSchemaDocumentRoot,
        `./src/plugin/mermaidDiagrams/testData/results`,
      );
      mermaidDiagram.generateEntityRelationshipModel(jsonSchemaDocumentRoot);
      mermaidDiagram.generateMermaidClassDiagram();
      const classDiagram = mermaidDiagram.getClassDiagramWithMarkdownMap();
      let relationCount = 0;
      const definitionA = classDiagram.get("DefinitionA") as string;
      definitionA.split("\n").forEach((line) => {
        if (line.includes('DefinitionA *-- "0..1" DefinitionA')) {
          relationCount++;
        }
      });
      expect(relationCount).toBe(1);
    });

    it("should generate class diagram with clickable links", async () => {
      const jsonSchemaDocumentRoot = yaml.load(
        (await fs.readFile(`./src/plugin/mermaidDiagram/testData/testDiagramDocumentSchema.yaml`)).toString(),
      ) as JSONSchema7;

      const mermaidDiagram = new MermaidDiagram(
        jsonSchemaDocumentRoot,
        `./src/plugin/mermaidDiagrams/testData/results`,
      );
      mermaidDiagram.generateEntityRelationshipModel(jsonSchemaDocumentRoot);
      mermaidDiagram.generateMermaidClassDiagram();
      const classDiagram = mermaidDiagram.getClassDiagramWithMarkdownMap();
      expect(classDiagram.get("DefinitionA")).toContain(`click DefinitionA href "#definitiona"`);
      expect(classDiagram.get("DefinitionB")).toContain(`click DefinitionB href "#definitionb"`);
    });
  });
});
