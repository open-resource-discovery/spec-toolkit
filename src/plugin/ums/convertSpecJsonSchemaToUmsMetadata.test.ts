import { jest } from "@jest/globals";
import { log } from "../../util/log.js";
import {
  isObjectLevelAnyOfRequired,
  checkForUnsupportedFeatures,
  getContext,
} from "./specJsonSchemaHelper.js";
import { jsonSchemaObjectToMetadata, convertSpecJsonSchemaToUmsMetadata } from "./convertSpecJsonSchemaToUmsMetadata.js";
import { SpecJsonSchemaWithUmsSupport, SpecJsonSchemaRootWithUmsSupport } from "./types.js";
import { UmsPluginConfig } from "./configModel.js";
import { Context } from "./specJsonSchemaHelper.js";

const baseConfig: UmsPluginConfig = {
  metadataPath: "test/path",
  idPropertySuffix: "Id",
};

function makeRootContext(document: SpecJsonSchemaRootWithUmsSupport): Context {
  return {
    config: baseConfig,
    document,
    path: ["TestDocument"],
  };
}

// ---------------------------------------------------------------------------
// isObjectLevelAnyOfRequired
// ---------------------------------------------------------------------------
describe("isObjectLevelAnyOfRequired", () => {
  it("returns true when every anyOf entry has only a required array", () => {
    const schema: SpecJsonSchemaWithUmsSupport = {
      type: "object",
      anyOf: [{ required: ["ordId"] }, { required: ["url"] }, { required: ["correlationIds"] }],
    };
    expect(isObjectLevelAnyOfRequired(schema)).toBe(true);
  });

  it("returns true for a single-entry anyOf with required array", () => {
    const schema: SpecJsonSchemaWithUmsSupport = {
      type: "object",
      anyOf: [{ required: ["ordId"] }],
    };
    expect(isObjectLevelAnyOfRequired(schema)).toBe(true);
  });

  it("returns false when anyOf is absent", () => {
    const schema: SpecJsonSchemaWithUmsSupport = { type: "object" };
    expect(isObjectLevelAnyOfRequired(schema)).toBe(false);
  });

  it("returns false when anyOf is empty", () => {
    const schema: SpecJsonSchemaWithUmsSupport = { type: "object", anyOf: [] };
    expect(isObjectLevelAnyOfRequired(schema)).toBe(false);
  });

  it("returns false when an entry has a required array that is empty", () => {
    const schema: SpecJsonSchemaWithUmsSupport = {
      type: "object",
      anyOf: [{ required: [] }],
    };
    expect(isObjectLevelAnyOfRequired(schema)).toBe(false);
  });

  it("returns false when an entry has keys other than required (e.g. type+required)", () => {
    const schema: SpecJsonSchemaWithUmsSupport = {
      type: "object",
      anyOf: [{ required: ["ordId"] }, { type: "object", required: ["url"] }],
    };
    expect(isObjectLevelAnyOfRequired(schema)).toBe(false);
  });

  it("returns false when an entry has no required key at all (e.g. const enum entries)", () => {
    const schema: SpecJsonSchemaWithUmsSupport = {
      type: "string",
      anyOf: [{ const: "openapi-v3" }, { const: "asyncapi-v2" }],
    };
    expect(isObjectLevelAnyOfRequired(schema)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// checkForUnsupportedFeatures — object-level anyOf handling
// ---------------------------------------------------------------------------
describe("checkForUnsupportedFeatures", () => {
  let infoSpy: ReturnType<typeof jest.spyOn>;
  let errorSpy: ReturnType<typeof jest.spyOn>;

  const document: SpecJsonSchemaRootWithUmsSupport = {
    title: "TestDocument",
    definitions: {},
  };
  const rootCtx = makeRootContext(document);

  beforeEach(() => {
    infoSpy = jest.spyOn(log, "info").mockReturnValue(undefined);
    errorSpy = jest.spyOn(log, "error").mockReturnValue(undefined);
    jest.spyOn(log, "warn").mockReturnValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("logs info when object-level anyOf uses the required-only pattern", () => {
    const schema: SpecJsonSchemaWithUmsSupport = {
      type: "object",
      "x-ums-type": "embedded",
      anyOf: [{ required: ["ordId"] }, { required: ["url"] }, { required: ["correlationIds"] }],
      properties: {
        ordId: { type: "string" },
        url: { type: "string" },
        correlationIds: { type: "array", items: { type: "string" } },
      },
    };
    const ctx = getContext(rootCtx, "OverlayTarget");
    checkForUnsupportedFeatures(schema, ctx);

    expect(infoSpy).toHaveBeenCalledWith(
      expect.stringContaining("at least one of"),
    );
    expect(infoSpy).toHaveBeenCalledWith(expect.stringContaining("ordId, url, correlationIds"));
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it("logs error when object-level anyOf has unsupported non-required entries", () => {
    const schema: SpecJsonSchemaWithUmsSupport = {
      type: "object",
      "x-ums-type": "embedded",
      anyOf: [{ type: "object", required: ["ordId"] }, { type: "object", required: ["url"] }],
      properties: {
        ordId: { type: "string" },
        url: { type: "string" },
      },
    };
    const ctx = getContext(rootCtx, "BadSchema");
    checkForUnsupportedFeatures(schema, ctx);

    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining("Unsupported object-level anyOf"),
      expect.anything(),
    );
  });
});

// ---------------------------------------------------------------------------
// jsonSchemaObjectToMetadata — end-to-end with anyOf required pattern
// ---------------------------------------------------------------------------
describe("jsonSchemaObjectToMetadata with object-level anyOf required pattern", () => {
  let infoSpy: ReturnType<typeof jest.spyOn>;
  let errorSpy: ReturnType<typeof jest.spyOn>;

  const document: SpecJsonSchemaRootWithUmsSupport = {
    title: "TestDocument",
    definitions: {},
  };

  beforeEach(() => {
    infoSpy = jest.spyOn(log, "info").mockReturnValue(undefined);
    errorSpy = jest.spyOn(log, "error").mockReturnValue(undefined);
    jest.spyOn(log, "warn").mockReturnValue(undefined);
    jest.spyOn(log, "debug").mockReturnValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("does not throw and treats anyOf-required properties as optional", () => {
    const schema: SpecJsonSchemaWithUmsSupport = {
      type: "object",
      "x-ums-type": "embedded",
      anyOf: [{ required: ["ordId"] }, { required: ["url"] }, { required: ["correlationIds"] }],
      properties: {
        ordId: { type: "string", description: "ORD ID of the target" },
        url: { type: "string", description: "URL of the target" },
        correlationIds: { type: "array", items: { type: "string" } },
      },
    };

    const rootCtx = makeRootContext(document);
    const ctx = getContext(rootCtx, "OverlayTarget");

    expect(() => jsonSchemaObjectToMetadata(schema, ctx)).not.toThrow();

    const result = jsonSchemaObjectToMetadata(schema, ctx);

    const names = result.metadataProperties.map((p) => p.name);
    expect(names).toContain("ordId");
    expect(names).toContain("url");
    expect(names).toContain("correlationIds");

    // Properties listed only in anyOf.required (not in the top-level required array)
    // must NOT be mandatory in UMS — the constraint cannot be fully expressed.
    for (const prop of result.metadataProperties) {
      expect(prop.mandatory).toBeUndefined();
    }

    // An info log should have been emitted describing the constraint
    expect(infoSpy).toHaveBeenCalledWith(expect.stringContaining("at least one of"));
  });

  it("keeps top-level required properties as mandatory even when anyOf also exists", () => {
    const schema: SpecJsonSchemaWithUmsSupport = {
      type: "object",
      "x-ums-type": "embedded",
      required: ["ordId"],
      anyOf: [{ required: ["url"] }, { required: ["correlationIds"] }],
      properties: {
        ordId: { type: "string" },
        url: { type: "string" },
        correlationIds: { type: "array", items: { type: "string" } },
      },
    };

    const rootCtx = makeRootContext(document);
    const ctx = getContext(rootCtx, "OverlayTarget");

    const result = jsonSchemaObjectToMetadata(schema, ctx);

    const ordIdProp = result.metadataProperties.find((p) => p.name === "ordId");
    const urlProp = result.metadataProperties.find((p) => p.name === "url");

    expect(ordIdProp?.mandatory).toBe(true);
    expect(urlProp?.mandatory).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// convertSpecJsonSchemaToUmsMetadata — full pipeline integration
// ---------------------------------------------------------------------------
describe("convertSpecJsonSchemaToUmsMetadata with object-level anyOf required pattern", () => {
  let infoSpy: ReturnType<typeof jest.spyOn>;
  let errorSpy: ReturnType<typeof jest.spyOn>;

  beforeEach(() => {
    infoSpy = jest.spyOn(log, "info").mockReturnValue(undefined);
    errorSpy = jest.spyOn(log, "error").mockReturnValue(undefined);
    jest.spyOn(log, "warn").mockReturnValue(undefined);
    jest.spyOn(log, "debug").mockReturnValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("converts a document containing an object with anyOf required-only entries without error", () => {
    const document: SpecJsonSchemaRootWithUmsSupport = {
      title: "OverlaySpec",
      definitions: {
        OverlayTarget: {
          type: "object",
          title: "Overlay Target",
          "x-ums-type": "embedded",
          anyOf: [{ required: ["ordId"] }, { required: ["url"] }, { required: ["correlationIds"] }],
          properties: {
            ordId: { type: "string", description: "ORD ID of the target" },
            url: { type: "string", description: "URL pointing to the target" },
            correlationIds: {
              type: "array",
              items: { type: "string" },
              description: "Correlation IDs referencing the target",
            },
          },
        },
      },
    };

    expect(() => convertSpecJsonSchemaToUmsMetadata([document], baseConfig)).not.toThrow();

    const results = convertSpecJsonSchemaToUmsMetadata([document], baseConfig);
    expect(results).toHaveLength(1);

    const overlayTarget = results[0];
    expect(overlayTarget.metadata.name).toBe("overlaytarget");

    const metadataProperties = (overlayTarget as any).spec.metadataProperties as Array<{ name: string; mandatory?: boolean }>;
    const propNames = metadataProperties.map((p) => p.name);
    expect(propNames).toContain("ordId");
    expect(propNames).toContain("url");
    expect(propNames).toContain("correlationIds");

    // None of the anyOf-listed properties should be mandatory
    for (const prop of metadataProperties.filter((p) => ["ordId", "url", "correlationIds"].includes(p.name))) {
      expect(prop.mandatory).toBeUndefined();
    }

    // Validation should not throw (no duplicate names, etc.)
    expect(errorSpy).not.toHaveBeenCalled();
  });
});
