import * as WorkbookPackage from "exceljs";
import fs from "fs-extra";
import yaml from "js-yaml";
import { JSONSchema7, JSONSchema7Object } from "json-schema";
import { log } from "../../util/log.js";
import { SpecJsonSchemaRoot } from "../../generated/spec/spec-v1/types/index.js";

export interface OrdSimplifiedTableFormat {
  entityName: string;
  propertyName: string;
  isPropertyMandatory: boolean;
  propertyType: string;
}

export async function generateExcelAndCsvDefinitions(
  mainSpecSourceFilePaths: string[],
  outputPath: string,
): Promise<void> {
  for (const specSourceFilePath of mainSpecSourceFilePaths) {
    const specJsonSchemaRoot = yaml.load(fs.readFileSync(specSourceFilePath).toString()) as SpecJsonSchemaRoot;
    if (!specJsonSchemaRoot.title) {
      log.error(
        `Root JSON Schema object has no "title" property, skipping CSV and Excel generation for file: ${specSourceFilePath}`,
      );
    } else {
      const headers = ["Entity Name", "Property Name", "Mandatory", "Property Type"];
      const ordArray = generateSimplifiedDefinitionsTable(specJsonSchemaRoot);
      const csvContent = convertOrdArrayToString(headers, ordArray);

      await writeCsvFiles(outputPath, specJsonSchemaRoot.title, csvContent);
      await writeExcelFiles(outputPath, specJsonSchemaRoot.title, headers, ordArray);
    }
  }
}

export function generateSimplifiedDefinitionsTable(documentSchema: SpecJsonSchemaRoot): OrdSimplifiedTableFormat[] {
  const ordTable: OrdSimplifiedTableFormat[] = [];
  for (const jsonSchemaObjectId in documentSchema.definitions) {
    const jsonSchemaObject = documentSchema.definitions[jsonSchemaObjectId] as JSONSchema7;
    const entityName = getEntityName(jsonSchemaObject);
    const requiredList = jsonSchemaObject.required;
    if (jsonSchemaObject.properties) {
      for (const propertyName in jsonSchemaObject.properties) {
        const property = jsonSchemaObject.properties[propertyName] as JSONSchema7Object;
        const propertyType: string = getPropertyType(property, propertyName);
        const isMandatory = checkIfPropertyIsMandatory(requiredList, propertyName);
        ordTable.push({
          entityName: entityName,
          propertyName: propertyName,
          isPropertyMandatory: isMandatory,
          propertyType: propertyType,
        });
      }
    }
  }
  return ordTable;
}

function getEntityName(jsonSchemaObject: JSONSchema7): string {
  if (jsonSchemaObject.title && typeof jsonSchemaObject.title === "string") {
    return jsonSchemaObject.title;
  }
  throw new Error(`Entity has no title: ${JSON.stringify(jsonSchemaObject, null, 2)}`);
}

function getPropertyType(property: JSONSchema7Object, propertyName: string): string {
  if (typeof property.type === "string" && property.type === "array") {
    const items = property.items as JSONSchema7;
    return `array<${detectJsonSchemaObjType(items, propertyName)}>`;
  }
  return detectJsonSchemaObjType(property, propertyName);
}

function detectJsonSchemaObjType(jsonSchemaObj: JSONSchema7Object | JSONSchema7, propertyName: string): string {
  if (jsonSchemaObj.$ref && typeof jsonSchemaObj.$ref === "string") {
    return getJsonSchemaObjTypeFromRef(jsonSchemaObj.$ref);
  } else if (typeof jsonSchemaObj.type === "string") {
    return jsonSchemaObj.type;
  } else if (Array.isArray(jsonSchemaObj.type)) {
    return jsonSchemaObj.type.join("|");
  } else if (jsonSchemaObj.anyOf && Array.isArray(jsonSchemaObj.anyOf)) {
    return jsonSchemaObj.anyOf
      .map((obj): string => {
        obj = obj as JSONSchema7Object;
        if (obj.$ref && typeof obj.$ref === "string") {
          return getJsonSchemaObjTypeFromRef(obj.$ref);
        }
        throw new Error(`${propertyName} anyOf has no $ref: ${JSON.stringify(jsonSchemaObj, null, 2)}`);
      })
      .join("|");
  }
  throw new Error(`JSONSchemaObj ${propertyName} has no type: ${JSON.stringify(jsonSchemaObj, null, 2)}`);
}

function getJsonSchemaObjTypeFromRef(ref: string): string {
  return ref.replace("#/definitions/", "");
}

function checkIfPropertyIsMandatory(requiredList: string[] | undefined, propertyName: string): boolean {
  if (requiredList && Array.isArray(requiredList)) {
    return requiredList.includes(propertyName);
  }
  return false;
}

function convertOrdArrayToString(headers: string[], ordTable: OrdSimplifiedTableFormat[]): string {
  const rows = ordTable.map((obj): string => Object.values(obj).join(","));
  const csvContent = [headers, ...rows].join("\n");
  return csvContent;
}

async function writeCsvFiles(outputPath: string, schemaTitle: string, csvContent: string): Promise<void> {
  const filePath = `${outputPath}/${schemaTitle}.csv`;
  await fs.outputFile(`${process.cwd()}/${filePath}`, csvContent);
  log.info(`Result: ./${filePath}`);
}

async function writeExcelFiles(
  outputPath: string,
  schemaTitle: string,
  headers: string[],
  data: OrdSimplifiedTableFormat[],
): Promise<void> {
  const workbook = new WorkbookPackage.default.Workbook();
  const worksheet = workbook.addWorksheet("Sheet 1");
  worksheet.addRow(headers);
  data.forEach((obj): void => {
    worksheet.addRow(Object.values(obj));
  });
  const filePath = `${outputPath}/${schemaTitle}.xlsx`;
  await workbook.xlsx.writeFile(filePath);
  log.info(`Result: ./${filePath}`);
}
