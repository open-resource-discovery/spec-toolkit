import { SpecJsonSchemaRoot, SpecJsonSchemaTypeName } from "../generated/spec/spec-v1/types/index.js";
import { generateMarkdown } from "./index.js";

describe("test generateMarkdown", () => {
  const specId = "test-spec";
  describe("test **Type**", () => {
    it("should include correct type information - **Type:** string", () => {
      const testSchema: SpecJsonSchemaRoot = {
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
          Property1: {
            type: "string",
            title: "Property 1 title",
            description: "Property 1 description",
          },
        },
      };
      const result = generateMarkdown(testSchema, specId, "spec", undefined);
      expect(result).toMatchInlineSnapshot(`
        "

        ## Schema Definitions

        * The root schema of the document is [Test Schema](#test-schema)
        * The interface is available as JSON Schema: [test-spec.schema.json](http://example.com/schemas/test-schema).


        ### Test Schema

        **Type**: Object(<a href="#test-schema_property1">property1</a>)

        | Property | Type | Description |
        | -------- | ---- | ----------- |
        |<div className="interface-property-name anchor" id="test-schema_property1">property1<br/><span className="optional">OPTIONAL</span><a className="hash-link" href="#test-schema_property1" title="#test-schema_property1"></a></div>|<div className="interface-property-type">[Property 1 title](#property-1-title)</div>|<div className="interface-property-description">Property 1 ref description</div>|


        ### Property 1 title

        Property 1 description

        **Type:** string

        "
      `);
    });

    it("should include correct type information - **Type:** number", () => {
      const testSchema: SpecJsonSchemaRoot = {
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
          Property1: {
            type: "number",
            title: "Property 1 title",
            description: "Property 1 description",
          },
        },
      };
      const result = generateMarkdown(testSchema, specId, "spec", undefined);
      expect(result).toMatchInlineSnapshot(`
        "

        ## Schema Definitions

        * The root schema of the document is [Test Schema](#test-schema)
        * The interface is available as JSON Schema: [test-spec.schema.json](http://example.com/schemas/test-schema).


        ### Test Schema

        **Type**: Object(<a href="#test-schema_property1">property1</a>)

        | Property | Type | Description |
        | -------- | ---- | ----------- |
        |<div className="interface-property-name anchor" id="test-schema_property1">property1<br/><span className="optional">OPTIONAL</span><a className="hash-link" href="#test-schema_property1" title="#test-schema_property1"></a></div>|<div className="interface-property-type">[Property 1 title](#property-1-title)</div>|<div className="interface-property-description">Property 1 ref description</div>|


        ### Property 1 title

        Property 1 description

        **Type:** number

        "
      `);
    });

    it("should include correct type information - **Type:** boolean", () => {
      const testSchema: SpecJsonSchemaRoot = {
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
          Property1: {
            type: "boolean",
            title: "Property 1 title",
            description: "Property 1 description",
          },
        },
      };
      const result = generateMarkdown(testSchema, specId, "spec", undefined);
      expect(result).toMatchInlineSnapshot(`
        "

        ## Schema Definitions

        * The root schema of the document is [Test Schema](#test-schema)
        * The interface is available as JSON Schema: [test-spec.schema.json](http://example.com/schemas/test-schema).


        ### Test Schema

        **Type**: Object(<a href="#test-schema_property1">property1</a>)

        | Property | Type | Description |
        | -------- | ---- | ----------- |
        |<div className="interface-property-name anchor" id="test-schema_property1">property1<br/><span className="optional">OPTIONAL</span><a className="hash-link" href="#test-schema_property1" title="#test-schema_property1"></a></div>|<div className="interface-property-type">[Property 1 title](#property-1-title)</div>|<div className="interface-property-description">Property 1 ref description</div>|


        ### Property 1 title

        Property 1 description

        **Type:** boolean

        "
      `);
    });

    it("should include correct type information - **Type:** object", () => {
      const testSchema: SpecJsonSchemaRoot = {
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
          Property1: {
            type: "object",
            title: "Property 1 title",
            description: "Property 1 description",
            properties: {
              subProperty1: {
                type: "string",
                title: "Sub Property 1 title",
                description: "Sub Property 1 description",
              },
              subProperty2: {
                type: "number",
                title: "Sub Property 2 title",
                description: "Sub Property 2 description",
              },
            },
          },
        },
      };
      const result = generateMarkdown(testSchema, specId, "spec", undefined);
      expect(result).toMatchInlineSnapshot(`
        "

        ## Schema Definitions

        * The root schema of the document is [Test Schema](#test-schema)
        * The interface is available as JSON Schema: [test-spec.schema.json](http://example.com/schemas/test-schema).


        ### Test Schema

        **Type**: Object(<a href="#test-schema_property1">property1</a>)

        | Property | Type | Description |
        | -------- | ---- | ----------- |
        |<div className="interface-property-name anchor" id="test-schema_property1">property1<br/><span className="optional">OPTIONAL</span><a className="hash-link" href="#test-schema_property1" title="#test-schema_property1"></a></div>|<div className="interface-property-type">[Property 1 title](#property-1-title)</div>|<div className="interface-property-description">Property 1 ref description</div>|


        ### Property 1 title

        Property 1 description

        **Type**: Object(<a href="#property-1-title_subproperty1">subProperty1</a>, <a href="#property-1-title_subproperty2">subProperty2</a>)

        | Property | Type | Description |
        | -------- | ---- | ----------- |
        |<div className="interface-property-name anchor" id="property-1-title_subproperty1">subProperty1<br/><span className="optional">OPTIONAL</span><a className="hash-link" href="#property-1-title_subproperty1" title="#property-1-title_subproperty1"></a></div>|<div className="interface-property-type">string</div>|<div className="interface-property-description">Sub Property 1 title<br/><br/>Sub Property 1 description</div>|
        |<div className="interface-property-name anchor" id="property-1-title_subproperty2">subProperty2<br/><span className="optional">OPTIONAL</span><a className="hash-link" href="#property-1-title_subproperty2" title="#property-1-title_subproperty2"></a></div>|<div className="interface-property-type">number</div>|<div className="interface-property-description">Sub Property 2 title<br/><br/>Sub Property 2 description</div>|

        "
      `);
    });

    it("should include correct type information - **Type:** object,string,boolean,number,null", () => {
      const testSchema: SpecJsonSchemaRoot = {
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
          Property1: {
            type: ["object", "string", "boolean", "number", "null"],
            title: "Property 1 title",
            description: "Property 1 description",
          },
        },
      };
      const result = generateMarkdown(testSchema, specId, "spec", undefined);
      expect(result).toMatchInlineSnapshot(`
        "

        ## Schema Definitions

        * The root schema of the document is [Test Schema](#test-schema)
        * The interface is available as JSON Schema: [test-spec.schema.json](http://example.com/schemas/test-schema).


        ### Test Schema

        **Type**: Object(<a href="#test-schema_property1">property1</a>)

        | Property | Type | Description |
        | -------- | ---- | ----------- |
        |<div className="interface-property-name anchor" id="test-schema_property1">property1<br/><span className="optional">OPTIONAL</span><a className="hash-link" href="#test-schema_property1" title="#test-schema_property1"></a></div>|<div className="interface-property-type">[Property 1 title](#property-1-title)</div>|<div className="interface-property-description">Property 1 ref description</div>|


        ### Property 1 title

        Property 1 description

        **Type:** object,string,boolean,number,null

        "
      `);
    });

    // TODO: to be more accurate the **Type** should be concatenated via the pipe | operator
    it("should include correct type information - **Type:** string,number,object and One of (oneOf values as list)", () => {
      const testSchema: SpecJsonSchemaRoot = {
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
          Property1: {
            title: "Property 1 title",
            description: "Property 1 description",
            type: ["string", "number", "object"],
            oneOf: [{ $ref: "#/definitions/TypeA" }, { $ref: "#/definitions/TypeB" }, { $ref: "#/definitions/TypeC" }],
          },
          TypeA: {
            type: "string",
            title: "Type A title",
            description: "Type A description",
          },
          TypeB: {
            type: "number",
            title: "Type B title",
            description: "Type B description",
          },
          TypeC: {
            type: "object",
            title: "Type C title",
            description: "Type C description",
            properties: {
              detail: {
                type: "string",
                title: "Detail",
                description: "Detail description",
              },
            },
          },
        },
      };
      const result = generateMarkdown(testSchema, specId, "spec", undefined);
      expect(result).toMatchInlineSnapshot(`
        "

        ## Schema Definitions

        * The root schema of the document is [Test Schema](#test-schema)
        * The interface is available as JSON Schema: [test-spec.schema.json](http://example.com/schemas/test-schema).


        ### Test Schema

        **Type**: Object(<a href="#test-schema_property1">property1</a>)

        | Property | Type | Description |
        | -------- | ---- | ----------- |
        |<div className="interface-property-name anchor" id="test-schema_property1">property1<br/><span className="optional">OPTIONAL</span><a className="hash-link" href="#test-schema_property1" title="#test-schema_property1"></a></div>|<div className="interface-property-type">[Property 1 title](#property-1-title)</div>|<div className="interface-property-description">Property 1 ref description</div>|


        ### Property 1 title

        Property 1 description

        **Type:** string,number,object<br/>
        **One of**: <ul><li><p>[Type A title](#type-a-title)</p></li><li><p>[Type B title](#type-b-title)</p></li><li><p>[Type C title](#type-c-title)</p></li></ul>


        ### Type A title

        Type A description

        **Type:** string


        ### Type B title

        Type B description

        **Type:** number


        ### Type C title

        Type C description

        **Type**: Object(<a href="#type-c-title_detail">detail</a>)

        | Property | Type | Description |
        | -------- | ---- | ----------- |
        |<div className="interface-property-name anchor" id="type-c-title_detail">detail<br/><span className="optional">OPTIONAL</span><a className="hash-link" href="#type-c-title_detail" title="#type-c-title_detail"></a></div>|<div className="interface-property-type">string</div>|<div className="interface-property-description">Detail<br/><br/>Detail description</div>|

        "
      `);
    });

    // TODO: adjust code and then add here test for:
    // "should throw if **Type** is not a union of all oneOf types referenced"

    // TODO: re-enable object type testing when fixed
    it.each([/*"object"*/ "integer", "number", "boolean", "string"])(
      "should include correct type information - **Type: %s** and One of (oneOf values as list)",
      (testType) => {
        const testSchema: SpecJsonSchemaRoot = {
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
            Property1: {
              title: "Property 1 title",
              description: "Property 1 description",
              type: testType as SpecJsonSchemaTypeName,
              oneOf: [
                { $ref: "#/definitions/TypeA" },
                { $ref: "#/definitions/TypeB" },
                { $ref: "#/definitions/TypeC" },
              ],
            },
            TypeA: {
              type: "string",
              title: "Type A title",
              description: "Type A description",
            },
            TypeB: {
              type: "number",
              title: "Type B title",
              description: "Type B description",
            },
            TypeC: {
              type: "object",
              title: "Type C title",
              description: "Type C description",
              properties: {
                detail: {
                  type: "string",
                  title: "Detail",
                  description: "Detail description",
                },
              },
            },
          },
        };
        const result = generateMarkdown(testSchema, specId, "spec", undefined);
        expect(result).toMatchSnapshot();
      },
    );

    // TODO: allOf value is not yet added as list in the output, need to adjust code first
    // TODO: **Type** should be concatenated via the and & operator
    it("should include correct type information - **Type:** string,number,object and All of", () => {
      const testSchema: SpecJsonSchemaRoot = {
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
          Property1: {
            title: "Property 1 title",
            description: "Property 1 description",
            type: ["string", "number", "object"],
            allOf: [{ $ref: "#/definitions/TypeA" }, { $ref: "#/definitions/TypeB" }, { $ref: "#/definitions/TypeC" }],
          },
          TypeA: {
            type: "string",
            title: "Type A title",
            description: "Type A description",
          },
          TypeB: {
            type: "number",
            title: "Type B title",
            description: "Type B description",
          },
          TypeC: {
            type: "object",
            title: "Type C title",
            description: "Type C description",
            properties: {
              detail: {
                type: "string",
                title: "Detail",
                description: "Detail description",
              },
            },
          },
        },
      };
      const result = generateMarkdown(testSchema, specId, "spec", undefined);
      expect(result).toMatchInlineSnapshot(`
        "

        ## Schema Definitions

        * The root schema of the document is [Test Schema](#test-schema)
        * The interface is available as JSON Schema: [test-spec.schema.json](http://example.com/schemas/test-schema).


        ### Test Schema

        **Type**: Object(<a href="#test-schema_property1">property1</a>)

        | Property | Type | Description |
        | -------- | ---- | ----------- |
        |<div className="interface-property-name anchor" id="test-schema_property1">property1<br/><span className="optional">OPTIONAL</span><a className="hash-link" href="#test-schema_property1" title="#test-schema_property1"></a></div>|<div className="interface-property-type">[Property 1 title](#property-1-title)</div>|<div className="interface-property-description">Property 1 ref description</div>|


        ### Property 1 title

        Property 1 description

        **Type:** string,number,object


        ### Type A title

        Type A description

        **Type:** string


        ### Type B title

        Type B description

        **Type:** number


        ### Type C title

        Type C description

        **Type**: Object(<a href="#type-c-title_detail">detail</a>)

        | Property | Type | Description |
        | -------- | ---- | ----------- |
        |<div className="interface-property-name anchor" id="type-c-title_detail">detail<br/><span className="optional">OPTIONAL</span><a className="hash-link" href="#type-c-title_detail" title="#type-c-title_detail"></a></div>|<div className="interface-property-type">string</div>|<div className="interface-property-description">Detail<br/><br/>Detail description</div>|

        "
      `);
    });

    // TODO: allOf value is not yet added as list in the output, need to adjust code first
    // TODO: re-enable object type testing when fixed
    it.each([/*"object"*/ "integer", "number", "boolean", "string"])(
      "should include correct type information - **Type: %s** and All of",
      (testType) => {
        const testSchema: SpecJsonSchemaRoot = {
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
            Property1: {
              title: "Property 1 title",
              description: "Property 1 description",
              type: testType as SpecJsonSchemaTypeName,
              allOf: [
                { $ref: "#/definitions/TypeA" },
                { $ref: "#/definitions/TypeB" },
                { $ref: "#/definitions/TypeC" },
              ],
            },
            TypeA: {
              type: "string",
              title: "Type A title",
              description: "Type A description",
            },
            TypeB: {
              type: "number",
              title: "Type B title",
              description: "Type B description",
            },
            TypeC: {
              type: "object",
              title: "Type C title",
              description: "Type C description",
              properties: {
                detail: {
                  type: "string",
                  title: "Detail",
                  description: "Detail description",
                },
              },
            },
          },
        };
        const result = generateMarkdown(testSchema, specId, "spec", undefined);
        expect(result).toMatchSnapshot();
      },
    );

    // TODO: comment in below test when code is adjusted to support it:
    // The **Type** should be either primitive type when allOf referenced type primitive as well, or object type and allOf referenced object type as well otherwise it should throw error
    // TODO: re-enable test when the code is fixed to throw error for illogical schema
    // it.each(["integer", "number", "boolean", "string"])(
    //   "should throw when constructing an illogical schema with primitive type %s and 'allOf' used at the same time",
    //   (primitiveType) => {
    //     const testSchema: SpecJsonSchemaRoot = {
    //       $id: "http://example.com/schemas/test-schema",
    //       title: "Test Schema",
    //       type: "object",
    //       description: "A sample schema for testing purposes.",
    //       properties: {
    //         property1: {
    //           $ref: "#/definitions/Property1",
    //           description: "Property 1 ref description",
    //         },
    //       },
    //       definitions: {
    //         Property1: {
    //           title: "Property 1 title",
    //           description: "Property 1 description",
    //           // construction of an illogical schema
    //           // trying to make something both primitive type (integer, number, boolean, string) and an object at the same time, something that is not possible
    //           type: primitiveType as SpecJsonSchemaTypeName,
    //           properties: {
    //             details: {
    //               type: "string",
    //               title: "Details",
    //               description: "Details description",
    //             },
    //           },
    //           // TypeA, TypeB, TypeC are all defined as object types
    //           allOf: [
    //             { $ref: "#/definitions/TypeA" },
    //             { $ref: "#/definitions/TypeB" },
    //             { $ref: "#/definitions/TypeC" },
    //           ],
    //         },
    //         TypeA: {
    //           title: "Type A",
    //           type: "object",
    //           properties: {
    //             detailA: {
    //               type: "string",
    //               title: "Detail A",
    //               description: "Detail A description",
    //             },
    //           },
    //         },
    //         TypeB: {
    //           title: "Type B",
    //           type: "object",
    //           properties: {
    //             detailB: {
    //               type: "number",
    //               title: "Detail B",
    //               description: "Detail B description",
    //             },
    //           },
    //         },
    //         TypeC: {
    //           title: "Type C",
    //           type: "object",
    //           properties: {
    //             detailC: {
    //               type: "string",
    //               title: "Detail C",
    //               description: "Detail C description",
    //             },
    //           },
    //         },
    //       },
    //     };
    //     expect(() => generateMarkdown(testSchema, specId, "spec", undefined)).toThrowErrorMatchingSnapshot();
    //   },
    // );

    // TODO: re-enable test when the code is fixed to throw error for illogical schema
    // it.each(["integer", "number", "boolean", "string"])(
    //   "should throw when constructing an illogical schema with primitive type %s in 'allOf'",
    //   (primitiveType) => {
    //     const testSchema: SpecJsonSchemaRoot = {
    //       $id: "http://example.com/schemas/test-schema",
    //       title: "Test Schema",
    //       type: "object",
    //       description: "A sample schema for testing purposes.",
    //       properties: {
    //         property1: {
    //           $ref: "#/definitions/Property1",
    //           description: "Property 1 ref description",
    //         },
    //       },
    //       definitions: {
    //         Property1: {
    //           title: "Property 1 title",
    //           description: "Property 1 description",
    //           type: "object",
    //           properties: {
    //             details: {
    //               type: "string",
    //               title: "Details",
    //               description: "Details description",
    //             },
    //           },
    //           allOf: [{ $ref: "#/definitions/TypeA" }, { $ref: "#/definitions/TypeB" }],
    //         },
    //         TypeA: {
    //           title: "Type A",
    //           // cannot have primitive types in allOf item, the type must be "object" type
    //           type: primitiveType as SpecJsonSchemaTypeName,
    //         },
    //         TypeB: {
    //           title: "Type B",
    //           type: "object",
    //           properties: {
    //             detail: {
    //               type: "string",
    //               title: "Detail",
    //               description: "Detail description",
    //             },
    //           },
    //         },
    //       },
    //     };
    //     expect(() => generateMarkdown(testSchema, specId, "spec", undefined)).toThrowErrorMatchingSnapshot();
    //   },
    // );

    it("should include correct type information - for object with 'allOf' and 'if/then' - **Type: Object** and One of (allOf values concatenated with | pipe operator)", () => {
      const testSchema: SpecJsonSchemaRoot = {
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
          Property1: {
            type: "object",
            title: "Property 1 title",
            description: "Property 1 description",
            properties: {
              type: {
                type: "string",
                title: "Type",
                description: "Type description",
                enum: ["A", "B", "C"],
              },
            },
            allOf: [
              {
                if: {
                  properties: {
                    type: {
                      type: "string",
                      const: "A",
                    },
                  },
                  required: ["type"],
                },
                then: {
                  $ref: "#/definitions/TypeA",
                },
              },
              {
                if: {
                  properties: {
                    type: {
                      type: "string",
                      const: "B",
                    },
                  },
                  required: ["type"],
                },
                then: {
                  $ref: "#/definitions/TypeB",
                },
              },
              {
                if: {
                  properties: {
                    type: {
                      type: "string",
                      const: "C",
                    },
                  },
                  required: ["type"],
                },
                then: {
                  $ref: "#/definitions/TypeC",
                },
              },
            ],
          },
          TypeA: {
            type: "string",
          },
          TypeB: {
            type: "number",
          },
          TypeC: {
            type: "object",
            properties: {
              detail: {
                type: "string",
              },
            },
          },
        },
      };
      const result = generateMarkdown(testSchema, specId, "spec", undefined);
      expect(result).toMatchInlineSnapshot(`
        "

        ## Schema Definitions

        * The root schema of the document is [Test Schema](#test-schema)
        * The interface is available as JSON Schema: [test-spec.schema.json](http://example.com/schemas/test-schema).


        ### Test Schema

        **Type**: Object(<a href="#test-schema_property1">property1</a>)

        | Property | Type | Description |
        | -------- | ---- | ----------- |
        |<div className="interface-property-name anchor" id="test-schema_property1">property1<br/><span className="optional">OPTIONAL</span><a className="hash-link" href="#test-schema_property1" title="#test-schema_property1"></a></div>|<div className="interface-property-type">[Property 1 title](#property-1-title)</div>|<div className="interface-property-description">Property 1 ref description</div>|


        ### Property 1 title

        Property 1 description

        **Type**: 
        [TypeA](#typea) \\| [TypeB](#typeb) \\| [TypeC](#typec)<br/>
        **Type**: Object(<a href="#property-1-title_type">type</a>)

        | Property | Type | Description |
        | -------- | ---- | ----------- |
        |<div className="interface-property-name anchor" id="property-1-title_type">type<br/><span className="optional">OPTIONAL</span><a className="hash-link" href="#property-1-title_type" title="#property-1-title_type"></a></div>|<div className="interface-property-type">string</div>|<div className="interface-property-description">Type<br/><br/>Type description<hr/>**Allowed Values**: <ul><li>\`"A"\`</li><li>\`"B"\`</li><li>\`"C"\`</li></ul></div>|


        ### TypeA

        **Type:** string


        ### TypeB

        **Type:** number


        ### TypeC

        **Type**: Object(<a href="#typec_detail">detail</a>)

        | Property | Type | Description |
        | -------- | ---- | ----------- |
        |<div className="interface-property-name anchor" id="typec_detail">detail<br/><span className="optional">OPTIONAL</span><a className="hash-link" href="#typec_detail" title="#typec_detail"></a></div>|<div className="interface-property-type">string</div>|<div className="interface-property-description"></div>|

        "
      `);
    });

    // TODO: adjust code and then add here test for:
    // should include correct type information - **Type: string** and All of the following (anyOf values concatenated with | pipe operator)
    it("should include correct type information - **Type: string** and Any of", () => {
      const testSchema: SpecJsonSchemaRoot = {
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
          Property1: {
            title: "Property 1 title",
            description: "Property 1 description",
            type: "string",
            anyOf: [{ $ref: "#/definitions/TypeA" }, { $ref: "#/definitions/TypeB" }, { $ref: "#/definitions/TypeC" }],
          },
          TypeA: {
            title: "Type A",
            type: "string",
            const: "A",
          },
          TypeB: {
            title: "Type B",
            type: "string",
            const: "B",
          },
          TypeC: {
            title: "Type C",
            type: "string",
            const: "C",
          },
        },
      };
      const result = generateMarkdown(testSchema, specId, "spec", undefined);
      expect(result).toMatchInlineSnapshot(`
        "

        ## Schema Definitions

        * The root schema of the document is [Test Schema](#test-schema)
        * The interface is available as JSON Schema: [test-spec.schema.json](http://example.com/schemas/test-schema).


        ### Test Schema

        **Type**: Object(<a href="#test-schema_property1">property1</a>)

        | Property | Type | Description |
        | -------- | ---- | ----------- |
        |<div className="interface-property-name anchor" id="test-schema_property1">property1<br/><span className="optional">OPTIONAL</span><a className="hash-link" href="#test-schema_property1" title="#test-schema_property1"></a></div>|<div className="interface-property-type">[Property 1 title](#property-1-title)</div>|<div className="interface-property-description">Property 1 ref description</div>|


        ### Property 1 title

        Property 1 description

        **Type:** string


        ### Type A

        **Type:** string<br/>
        **Constant Value**: \`A\`


        ### Type B

        **Type:** string<br/>
        **Constant Value**: \`B\`


        ### Type C

        **Type:** string<br/>
        **Constant Value**: \`C\`

        "
      `);
    });

    it.each([/*"object"*/ "integer", "number", "boolean", "string"])(
      "should include correct type information - **Type: %s** and Any of",
      (testType) => {
        const testSchema: SpecJsonSchemaRoot = {
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
            Property1: {
              title: "Property 1 title",
              description: "Property 1 description",
              type: testType as SpecJsonSchemaTypeName,
              anyOf: [
                { $ref: "#/definitions/TypeA" },
                { $ref: "#/definitions/TypeB" },
                { $ref: "#/definitions/TypeC" },
              ],
            },
            TypeA: {
              type: "string",
              title: "Type A title",
              description: "Type A description",
            },
            TypeB: {
              type: "number",
              title: "Type B title",
              description: "Type B description",
            },
            TypeC: {
              type: "object",
              title: "Type C title",
              description: "Type C description",
              properties: {
                detail: {
                  type: "string",
                  title: "Detail",
                  description: "Detail description",
                },
              },
            },
          },
        };
        const result = generateMarkdown(testSchema, specId, "spec", undefined);
        expect(result).toMatchSnapshot();
      },
    );

    it("should throw when 'oneOf' reference cannot be resolved", () => {
      const testSchema: SpecJsonSchemaRoot = {
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
          Property1: {
            title: "Property 1 title",
            description: "Property 1 description",
            type: "object",
            oneOf: [{ $ref: "#/definitions/TypeA" }, { $ref: "#/definitions/TypeB" }],
          },
          TypeA: {
            title: "Type A",
            type: "object",
            properties: {
              detailA: {
                type: "string",
                title: "Detail A",
                description: "Detail A description",
              },
            },
          },
          // TypeB definition is missing
          // This should cause an error when trying to resolve the $ref in oneOf
        },
      };
      expect(() => generateMarkdown(testSchema, specId, "spec", undefined)).toThrowErrorMatchingInlineSnapshot(
        // TODO: should throw the same error as for test "should throw when 'allOf' reference cannot be resolved"
        `"Expected object with title "Property 1 title" to have either "properties" or "patternProperties" defined."`,
      );
    });

    it("should throw when 'allOf' reference cannot be resolved", () => {
      const testSchema: SpecJsonSchemaRoot = {
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
          Property1: {
            title: "Property 1 title",
            description: "Property 1 description",
            type: "object",
            allOf: [{ $ref: "#/definitions/TypeA" }, { $ref: "#/definitions/TypeB" }],
          },
          TypeA: {
            title: "Type A",
            type: "object",
            properties: {
              detailA: {
                type: "string",
                title: "Detail A",
                description: "Detail A description",
              },
            },
          },
          // TypeB definition is missing
          // This should cause an error when trying to resolve the $ref in allOf
        },
      };
      expect(() => generateMarkdown(testSchema, specId, "spec", undefined)).toThrowErrorMatchingInlineSnapshot(`
        "Could not resolve $ref "#/definitions/TypeB" for 
         {
          "title": "Property 1 title",
          "description": "Property 1 description",
          "type": "object",
          "allOf": [
            {
              "$ref": "#/definitions/TypeA"
            },
            {
              "$ref": "#/definitions/TypeB"
            }
          ]
        }"
      `);
    });

    it("should throw when 'anyOf' reference cannot be resolved", () => {
      const testSchema: SpecJsonSchemaRoot = {
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
          Property1: {
            title: "Property 1 title",
            description: "Property 1 description",
            type: "object",
            anyOf: [{ $ref: "#/definitions/TypeA" }, { $ref: "#/definitions/TypeB" }],
          },
          TypeA: {
            title: "Type A",
            type: "object",
            properties: {
              detailA: {
                type: "string",
                title: "Detail A",
                description: "Detail A description",
              },
            },
          },
          // TypeB definition is missing
          // This should cause an error when trying to resolve the $ref in anyOf
        },
      };
      expect(() => generateMarkdown(testSchema, specId, "spec", undefined)).toThrowErrorMatchingInlineSnapshot(
        // TODO: should throw the same error as for test "should throw when 'allOf' reference cannot be resolved"
        `"Expected object with title "Property 1 title" to have either "properties" or "patternProperties" defined."`,
      );
    });
  });
});
