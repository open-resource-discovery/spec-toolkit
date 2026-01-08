import { SpecJsonSchema, SpecJsonSchemaRoot } from "../generated/spec/spec-v1/types/index.js";
import { jsonSchemaToMd } from "./generateMarkdownUtils.js";

describe("test utils functions", () => {
  let jsonSchemaObject: SpecJsonSchema;
  let jsonSchemaRoot: SpecJsonSchemaRoot;
  describe("test jsonSchemaToMd", () => {
    beforeEach(() => {
      jsonSchemaObject = {
        type: "object",
        title: "Test Object",
        description: "Test Object documentation.",
        properties: {
          testObjectProperty1: {
            type: "string",
            description: "This property 1 is part of Test Object.",
          },
          testObjectProperty2: {
            type: "string",
            description: "This property 2 is part of Test Object.",
          },
        },
      };
      jsonSchemaRoot = {
        $id: "http://example.com/schemas/test-schema",
        title: "Test Schema",
        type: "object",
        description: "A sample schema for testing purposes.",
        properties: {
          property1: {
            $ref: "#/definitions/Property1",
            description: "Property 1 ref description",
          },
        },
        definitions: {
          Property1: jsonSchemaObject,
        },
      };
    });

    it("should generate markdown documentation", () => {
      const result = jsonSchemaToMd(jsonSchemaObject, jsonSchemaRoot, undefined);
      expect(result).toMatchInlineSnapshot(`
        "
        ### Test Object

        Test Object documentation.

        **Type**: Object(<a href="#test-object_testobjectproperty1">testObjectProperty1</a>, <a href="#test-object_testobjectproperty2">testObjectProperty2</a>)

        | Property | Type | Description |
        | -------- | ---- | ----------- |
        |<div className="interface-property-name anchor" id="test-object_testobjectproperty1">testObjectProperty1<br/><span className="optional">OPTIONAL</span><a className="hash-link" href="#test-object_testobjectproperty1" title="#test-object_testobjectproperty1"></a></div>|<div className="interface-property-type">string</div>|<div className="interface-property-description">This property 1 is part of Test Object.</div>|
        |<div className="interface-property-name anchor" id="test-object_testobjectproperty2">testObjectProperty2<br/><span className="optional">OPTIONAL</span><a className="hash-link" href="#test-object_testobjectproperty2" title="#test-object_testobjectproperty2"></a></div>|<div className="interface-property-type">string</div>|<div className="interface-property-description">This property 2 is part of Test Object.</div>|

        "
      `);
    });

    it("should not generate markdown documentation for hidden objects", () => {
      jsonSchemaObject["x-hide"] = true;
      const result = jsonSchemaToMd(jsonSchemaObject, jsonSchemaRoot, undefined);
      expect(result).toMatchInlineSnapshot(`""`);
    });

    it("should not generate markdown documentation for hidden property of an object", () => {
      jsonSchemaObject.properties!["testObjectProperty1"]["x-hide"] = true; // hide testObjectProperty1 from documentation
      const result = jsonSchemaToMd(jsonSchemaObject, jsonSchemaRoot, undefined);
      expect(result).toMatchInlineSnapshot(`
        "
        ### Test Object

        Test Object documentation.

        **Type**: Object(<a href="#test-object_testobjectproperty2">testObjectProperty2</a>)

        | Property | Type | Description |
        | -------- | ---- | ----------- |
        |<div className="interface-property-name anchor" id="test-object_testobjectproperty2">testObjectProperty2<br/><span className="optional">OPTIONAL</span><a className="hash-link" href="#test-object_testobjectproperty2" title="#test-object_testobjectproperty2"></a></div>|<div className="interface-property-type">string</div>|<div className="interface-property-description">This property 2 is part of Test Object.</div>|

        "
      `);
    });
  });
});
