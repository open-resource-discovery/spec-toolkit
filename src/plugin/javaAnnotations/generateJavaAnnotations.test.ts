import { jest } from "@jest/globals";
import fs from "fs-extra";
import path from "path";
import yaml from "js-yaml";
import { log } from "../../util/log.js";
import type { JavaAnnotationsConfig } from "./configModel.js";
import { generateAnnotations } from "./generateJavaAnnotations.js";

describe("generateAnnotations", () => {
  const pluginDir = path.join(process.cwd(), "src", "plugin", "javaAnnotations");
  const testDir = path.join(pluginDir, "testData");
  const outputDir = path.join(pluginDir, "tmpOutput");
  let errorSpy: ReturnType<typeof jest.spyOn>;

  beforeAll(() => {
    fs.ensureDirSync(testDir);
  });

  beforeEach(() => {
    errorSpy = jest.spyOn(log, "error").mockReturnValue(undefined);
    jest.spyOn(log, "info").mockReturnValue(undefined);
    fs.removeSync(outputDir);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(() => {
    fs.removeSync(testDir);
    fs.removeSync(outputDir);
  });

  it("writes annotation file with default‐value cases and matches snapshot", () => {
    const schema = {
      definitions: {
        NestedAnn: {
          properties: {
            foo: { type: "string", default: "nested" },
          },
          required: ["foo"],
        },
        DefaultCases: {
          properties: {
            str: { type: "string", default: "hi" },
            bool: { type: "boolean", default: true },
            dbl: { type: "number", default: 3.14 },
            arr: { type: "array", items: { type: "integer" } },
            nested: { $ref: "#/definitions/NestedAnn" },
          },
          required: ["str", "bool", "dbl", "arr", "nested"],
        },
      },
    };

    const schemaPath = path.join(testDir, "defaults-annotated.yaml");
    fs.writeFileSync(schemaPath, yaml.dump(schema), "utf8");

    const config: JavaAnnotationsConfig = {
      packageAnnotations: "com.example.annotations",
      modelPackage: "com.example.model",
    };

    generateAnnotations(config, schemaPath, outputDir);

    const pkgDir = path.join(outputDir, ...config.packageAnnotations.split("."));
    const outFile = path.join(pkgDir, "DefaultsAnnotated.java");
    expect(fs.existsSync(pkgDir)).toBe(true);
    expect(fs.existsSync(outFile)).toBe(true);

    const content = fs.readFileSync(outFile, "utf8");
    expect(content).toMatchSnapshot();
  });

  it("logs error if annotated schema does not exist", () => {
    const missing = path.join(testDir, "nope.yaml");
    const config: JavaAnnotationsConfig = {
      packageAnnotations: "com.example.annotations",
      modelPackage: "com.example.model",
    };
    generateAnnotations(config, missing, outputDir);
    expect(errorSpy).toHaveBeenCalledWith(`Annotated schema not found at ${missing}`);
  });

  it("logs error on invalid YAML", () => {
    const badPath = path.join(testDir, "bad.yaml");
    fs.writeFileSync(badPath, "not: valid: yaml::: }", "utf8");
    const config: JavaAnnotationsConfig = {
      packageAnnotations: "com.example.annotations",
      modelPackage: "com.example.model",
    };
    generateAnnotations(config, badPath, outputDir);
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("Failed to parse annotated schema:"));
  });

  it("writes annotation file and matches snapshot", () => {
    const schema = {
      definitions: {
        Other: {
          properties: {},
        },
        RefTest: {
          properties: {
            r: { $ref: "#/definitions/Other" },
          },
        },
        AnyOfArr: {
          properties: {
            a: {
              type: "array",
              items: {
                anyOf: [{ $ref: "#/definitions/Other" }],
              },
            },
          },
        },
        RefArr: {
          properties: {
            b: {
              type: "array",
              items: { $ref: "#/definitions/Other" },
            },
          },
        },
        NestedArr: {
          properties: {
            c: {
              type: "array",
              items: { type: "boolean" },
            },
          },
        },
        ObjTest: {
          properties: {
            o: { type: "object" },
          },
        },
        StrTest: {
          properties: {
            s: { type: "string" },
          },
        },
        BoolTest: {
          properties: {
            t: { type: "boolean" },
          },
        },
        NumTest: {
          properties: {
            n: { type: "number" },
          },
        },
        IntTest: {
          properties: {
            i: { type: "integer" },
          },
        },
        DefaultTest: {
          properties: {
            x: { type: "unknownType" }, // default -> String
          },
        },
      },
    };
    const schemaPath = path.join(testDir, "complex-annotated.yaml");
    fs.writeFileSync(schemaPath, yaml.dump(schema), "utf8");

    const config: JavaAnnotationsConfig = {
      packageAnnotations: "com.example.annotations",
      modelPackage: "com.example.model",
    };

    generateAnnotations(config, schemaPath, outputDir);

    const pkgDir = path.join(outputDir, ...config.packageAnnotations.split("."));
    const outFile = path.join(pkgDir, "ComplexAnnotated.java");
    expect(fs.existsSync(pkgDir)).toBe(true);
    expect(fs.existsSync(outFile)).toBe(true);

    const content = fs.readFileSync(outFile, "utf8");
    expect(content).toMatchSnapshot();
  });

  it("generates pattern-only value() method when only patternProperties exist", () => {
    const schema = {
      definitions: {
        PatternOnly: {
          patternProperties: {
            pattern: { type: "string" },
          },
        },
      },
    };
    const schemaPath = path.join(testDir, "pattern-annotated.yaml");
    fs.writeFileSync(schemaPath, yaml.dump(schema), "utf8");

    const config: JavaAnnotationsConfig = {
      packageAnnotations: "com.example.annotations",
      modelPackage: "com.example.model",
    };

    generateAnnotations(config, schemaPath, outputDir);

    const pkgDir = path.join(outputDir, ...config.packageAnnotations.split("."));
    const outFile = path.join(pkgDir, "PatternAnnotated.java");
    expect(fs.existsSync(outFile)).toBe(true);

    const content = fs.readFileSync(outFile, "utf8");
    expect(content).toContain("PatternOnlyEntry[] value() default {}");
  });
});
