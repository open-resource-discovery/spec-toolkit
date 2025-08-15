import * as fs from "fs";
import * as path from "path";
import { load as loadYaml } from "js-yaml";
import { log } from "../../util/log.js";
import type { JavaAnnotationsConfig } from "./configModel.js";
import type {
  SpecJsonSchema,
  JsonSchemaDefinition,
  JsonSchemaDefinitions,
} from "../../generated/spec/spec-v1/types/spec.js";

export function generateAnnotations(
  config: JavaAnnotationsConfig,
  annotatedSchemaPath: string,
  outputBase: string,
): void {
  log.info("Starting Java annotation generation");

  // Load & parse the annotated schema (JSON or YAML)
  if (!fs.existsSync(annotatedSchemaPath)) {
    log.error(`Annotated schema not found at ${annotatedSchemaPath}`);
    return;
  }
  const raw = fs.readFileSync(annotatedSchemaPath, "utf8");
  let docObj: { definitions?: JsonSchemaDefinitions };
  try {
    docObj = loadYaml(raw) as { definitions?: JsonSchemaDefinitions };
  } catch (err: unknown) {
    log.error(`Failed to parse annotated schema: ${err}`);
    return;
  }
  const defs: JsonSchemaDefinitions = docObj.definitions ?? {};
  log.info(`Loaded annotated schema with ${Object.keys(defs).length} definitions`);

  // Compute interface name from filename
  const interfaceName = path
    .basename(annotatedSchemaPath, path.extname(annotatedSchemaPath))
    .split(/[^A-Za-z0-9]/)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join("");

  // Build output directory and filename
  const packageName = config.packageAnnotations;
  const pkgSegments = packageName.split(".");
  const outputDir = path.join(outputBase, ...pkgSegments);
  const outputFile = path.join(outputDir, `${interfaceName}.java`);

  function buildRequiredArray(def: JsonSchemaDefinition): string {
    const req = def.required ?? [];
    if (req.length === 0) return "default {}";
    return `default { ${req.map((f) => `"${f}"`).join(", ")} }`;
  }

  // resolve JSON Schema property to a Java type
  function resolveJavaType(prop: SpecJsonSchema): string {
    if (typeof prop.$ref === "string") {
      const name = prop.$ref.split("/").pop();
      return name ?? "String";
    }
    if (prop.type === "array" && prop.items) {
      // array of annotated types via anyOf
      const anyOf = Array.isArray(prop.items.anyOf) ? prop.items.anyOf : [];
      const refItem = anyOf.find((i) => typeof i.$ref === "string");
      if (refItem?.$ref) {
        return `${refItem.$ref.split("/").pop()}[]`;
      }
      // array of plain $ref
      if (typeof prop.items.$ref === "string") {
        return `${prop.items.$ref.split("/").pop()}[]`;
      }
      // fallback: primitive or nested
      return `${resolveJavaType(prop.items)}[]`;
    }
    if (prop.type === "object") return "String";
    switch (prop.type) {
      case "string":
        return "String";
      case "boolean":
        return "boolean";
      case "number":
      case "integer":
        return "double";
      default:
        return "String";
    }
  }

  function buildDefaultAnnotation(def: JsonSchemaDefinition, name: string): string {
    const req = def.required ?? [];
    const props = def.properties ?? {};
    const args = req
      .map((k) => {
        const p = props[k];
        const t = resolveJavaType(p);
        let v: string;
        if (t === "String") v = `"${typeof p.default === "string" ? p.default : ""}"`;
        else if (t === "boolean") v = `${(p.default as boolean) ?? false}`;
        else if (t === "double") v = `${(p.default as number) ?? 0}`;
        else if (t.endsWith("[]")) v = `{}`;
        else v = `@${t}()`;
        return `${k} = ${v}`;
      })
      .join(", ");
    // fully qualify nested annotation
    const qualName = `${interfaceName}.${name}`;
    return `@${qualName}${req.length ? `(${args})` : `()`}`;
  }

  // Generate methods for each property in a definition
  function generateProps(def: JsonSchemaDefinition): string {
    const props = def.properties ?? {};
    // pattern-only: single value() method
    if (!Object.keys(props).length && def.patternProperties) {
      const entry = `${Object.keys(def.patternProperties)[0]}Entry`;
      return `\n    ${entry}[] value() default {};`;
    }
    // otherwise map each property to a method signature
    return Object.entries(props)
      .filter(
        ([, s]) =>
          // skip anonymous objects without $ref/enum
          !(s.type === "object" && typeof s.$ref !== "string" && !s.enum),
      )
      .map(([k, s]) => {
        const jt = resolveJavaType(s); // Java return type
        const isRef = !!s.$ref;
        const isArr = s.type === "array";
        const anyRefs = Array.isArray(s.items?.anyOf)
          ? s.items.anyOf.filter((i): i is { $ref: string } => !!i.$ref)
          : [];
        const isAnyArr = isArr && anyRefs.length > 0;
        const isArrRef = isArr && !!s.items?.$ref;
        let dc = "";
        if (isAnyArr && anyRefs[0].$ref) {
          const rn = anyRefs[0].$ref.split("/").pop()!;
          if (defs[rn]) dc = ` default { ${buildDefaultAnnotation(defs[rn], rn)} }`;
        } else if (isArrRef && typeof s.items?.$ref === "string") {
          const rn = s.items.$ref.split("/").pop()!;
          if (defs[rn]) dc = ` default { ${buildDefaultAnnotation(defs[rn], rn)} }`;
        } else if (isRef && typeof s.$ref === "string") {
          const rn = s.$ref.split("/").pop()!;
          if (defs[rn]) dc = ` default ${buildDefaultAnnotation(defs[rn], rn)}`;
        } else if (jt === "String") {
          const v = typeof s.default === "string" ? s.default : "";
          dc = ` default "${v}"`;
        } else if (jt === "boolean") {
          dc = ` default ${(s.default as boolean) ?? false}`;
        } else if (jt === "double") {
          dc = ` default ${(s.default as number) ?? 0}`;
        } else if (isArr) {
          dc = ` default {}`;
        }
        const comment = s.description ? `    /** ${s.description.replace(/\n/g, " ")} */\n` : "";
        return `${comment}    ${jt} ${k}()${dc};`;
      })
      .join("\n\n");
  }

  // Build pattern-based Entry and wrapper interfaces
  const pattern = Object.entries(defs)
    .filter(([, d]) => !!d.patternProperties)
    .map(([n, d]) => {
      const props = d.patternProperties!;
      const firstSchema = Object.values(props)[0];
      const itemSchema = firstSchema.items ?? { type: "string" };
      const bt = resolveJavaType(itemSchema);

      return `
  @Target(ElementType.TYPE)
  @Retention(RetentionPolicy.SOURCE)
  public @interface ${n}Entry {
    String key();
    ${bt}[] values();
  }`;
    });

  const wrappers = Object.entries(defs)
    .filter(([, d]) => !!d.patternProperties)
    .map(([n, _d]) => {
      const entryName = `${n}Entry`;
      return `
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.SOURCE)
public @interface ${n} {
  ${entryName}[] value() default {};
}`;
    });

  // Build normal interfaces for definitions with properties
  const normal = Object.entries(defs)
    .filter(([, d]) => !d.patternProperties)
    .map(([n, d]) => {
      const ra = `    String[] requiredFields() ${buildRequiredArray(d)};\n`;
      const bd = Object.keys(d.properties ?? {}).length ? generateProps(d) : `\n    ${n}Entry[] value() default {};`;
      return `
  @Target(ElementType.TYPE)
  @Retention(RetentionPolicy.SOURCE)
  public @interface ${n} {
${ra}${bd}
  }`;
    });

  // concatenate all interface blocks
  const all = [...pattern, ...wrappers, ...normal].join("\n");
  const out = `package ${packageName};

import java.lang.annotation.*;

public interface ${interfaceName} {${all}

}
`;

  // Write file
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputFile, out.trim(), "utf8");
  log.info(`Java annotations written to ${outputFile}`);
}
