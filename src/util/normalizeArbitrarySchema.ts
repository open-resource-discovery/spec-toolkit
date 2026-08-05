import type { SpecJsonSchema, SpecJsonSchemaRoot } from "../generated/spec/spec-v1/types/index.js";
import { log } from "./log.js";

/**
 * Normalize an arbitrary JSON Schema into the shape the spec-toolkit renderer
 * and validator expect, WARNING (not throwing) on each deviation from the
 * strong authoring conventions.
 *
 * The renderer (`markdown/generateMarkdownUtils.ts`) and the strict validator
 * (`util/validation.ts`) assume schemas authored to spec-toolkit's conventions:
 *   - nested objects live in `#/definitions` and are referenced by `$ref`
 *     (no inline `type: object` below the root);
 *   - every `oneOf`/`anyOf`/`allOf` branch is a `$ref`;
 *   - every schema node declares a `type`.
 * Real-world and machine-generated schemas routinely break these. Rather than
 * reject them, this pass rewrites an in-memory COPY into the accepted shape so
 * documentation can still be generated, and records a warning for each rewrite
 * so authors can see what was synthesized (and, if they prefer, move it into
 * `#/definitions` themselves).
 *
 * What it does NOT do: it never touches the authored file on disk, and it never
 * changes the meaning of the schema for validation of instances (the hoisted
 * definitions are structurally equivalent to the inline ones they replace).
 *
 * True unsupported features (constructs that cannot be rendered meaningfully)
 * are left for the caller to skip; this pass only removes the friction that a
 * preprocessor can legitimately remove.
 */

export interface NormalizeResult {
  schema: SpecJsonSchemaRoot;
  warnings: string[];
}

function pascalCase(str: string): string {
  return String(str)
    .replace(/[^A-Za-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("");
}

function uniqueName(base: string, taken: Set<string>): string {
  let name = base || "Object";
  let i = 2;
  while (taken.has(name)) {
    name = `${base}${i}`;
    i += 1;
  }
  taken.add(name);
  return name;
}

/**
 * Normalize an arbitrary JSON Schema for documentation generation.
 *
 * @param schema parsed JSON Schema (never mutated)
 */
export function normalizeArbitrarySchema(schema: SpecJsonSchemaRoot): NormalizeResult {
  // Deep copy; never touch the input.
  const root = JSON.parse(JSON.stringify(schema)) as SpecJsonSchemaRoot & Record<string, unknown>;
  // spec-toolkit only understands `definitions` (not `$defs`); consolidate.
  if ((root as Record<string, unknown>).$defs && !root.definitions) {
    root.definitions = (root as Record<string, unknown>).$defs as Record<string, SpecJsonSchema>;
    delete (root as Record<string, unknown>).$defs;
  }
  if (!root.definitions) root.definitions = {};
  const defs = root.definitions as Record<string, SpecJsonSchema>;
  const taken = new Set<string>(Object.keys(defs));
  const warnings: string[] = [];

  const warn = (msg: string): void => {
    warnings.push(msg);
    log.warn(msg);
  };

  const isObjectNode = (node: SpecJsonSchema): boolean =>
    !!node &&
    typeof node === "object" &&
    !Array.isArray(node) &&
    node.type === "object" &&
    !node.$ref &&
    !(node as Record<string, unknown>)["x-ref-to-doc"];

  // A node that carries object-ish keywords but forgot `type: object`.
  const looksLikeObject = (node: SpecJsonSchema): boolean =>
    !!node &&
    typeof node === "object" &&
    !Array.isArray(node) &&
    !node.type &&
    !node.$ref &&
    !node.oneOf &&
    !node.anyOf &&
    !node.allOf &&
    !node.enum &&
    node.const === undefined &&
    !(node as Record<string, unknown>)["x-ref-to-doc"] &&
    (!!node.properties || !!node.patternProperties || node.additionalProperties !== undefined);

  // A composition branch (or subschema) that only expresses constraints
  // (`required`, `if`/`then`/`else`) with no documentable shape of its own.
  // These express conditional requiredness, not a type; hoisting them produces
  // meaningless empty definitions, so we leave them in place and warn instead.
  const isConstraintOnly = (node: SpecJsonSchema): boolean =>
    !!node &&
    typeof node === "object" &&
    !Array.isArray(node) &&
    !node.$ref &&
    !node.type &&
    !node.properties &&
    !node.patternProperties &&
    !node.enum &&
    node.const === undefined &&
    (node.required !== undefined || node.if !== undefined || node.then !== undefined || node.else !== undefined);

  const hoist = (node: SpecJsonSchema, pathParts: string[], reason: string): SpecJsonSchema => {
    const base = node.title ? pascalCase(node.title) : pascalCase(pathParts.filter(Boolean).join(" ")) || "Object";
    const name = uniqueName(base, taken);
    if (!node.title) node.title = name; // title lives on the definition, not the $ref
    defs[name] = node;
    warn(
      `Normalized: ${reason} at "${pathParts.join(".") || "(root)"}" hoisted to #/definitions/${name} for documentation generation (authored file unchanged).`,
    );
    return { $ref: `#/definitions/${name}` };
  };

  /**
   * Walk a schema subtree.
   * `atRoot` is true only for the top-level schema (allowed to be an object).
   * `isDefEntry` is true for a direct entry of definitions (already flat).
   */
  const walk = (node: SpecJsonSchema, pathParts: string[], atRoot: boolean, isDefEntry: boolean): SpecJsonSchema => {
    if (!node || typeof node !== "object") return node;
    if (Array.isArray(node)) {
      return node.map((item, idx) =>
        walk(item, pathParts.concat(String(idx)), false, false),
      ) as unknown as SpecJsonSchema;
    }

    // Add a missing `type` where the node is clearly an object.
    if (!atRoot && looksLikeObject(node)) {
      node.type = "object";
      warn(
        `Normalized: node at "${pathParts.join(".") || "(root)"}" has object keywords but no "type"; assumed "object".`,
      );
    }

    for (const key of ["properties", "patternProperties", "definitions"] as const) {
      const container = node[key] as Record<string, SpecJsonSchema> | undefined;
      if (container && typeof container === "object") {
        const isDefs = key === "definitions";
        for (const propName of Object.keys(container)) {
          container[propName] = walk(container[propName], pathParts.concat(propName), false, isDefs);
        }
      }
    }
    // Recurse into subschema-bearing keywords that hold documentable shapes.
    // Note: `if`/`then`/`else` are deliberately NOT recursed into for hoisting —
    // they express conditional constraints (requiredness), not types to
    // document, and hoisting their inline objects yields meaningless empty
    // definitions. They are left untouched for the renderer to note as conditions.
    for (const key of ["items", "additionalProperties", "contains", "not"] as const) {
      const child = node[key];
      if (child && typeof child === "object") {
        node[key] = walk(child as SpecJsonSchema, pathParts.concat(key), false, false) as never;
      }
    }
    for (const key of ["allOf", "anyOf", "oneOf"] as const) {
      const branches = node[key];
      if (Array.isArray(branches)) {
        node[key] = branches.map((sub: SpecJsonSchema, idx: number) => {
          // A pure constraint branch (conditional requiredness, no shape) is
          // left in place; the renderer surfaces it as a condition note.
          if (isConstraintOnly(sub)) {
            return sub;
          }
          const walked = walk(sub, pathParts.concat(`${key}${idx}`), false, false);
          // A bare primitive branch (a scalar `type`, or a `const`/`enum` with
          // no shape of its own) renders inline fine; no need to hoist it.
          const isBarePrimitive =
            walked &&
            typeof walked === "object" &&
            !Array.isArray(walked) &&
            !walked.$ref &&
            !walked.properties &&
            !walked.patternProperties &&
            ((typeof walked.type === "string" && walked.type !== "object") ||
              walked.const !== undefined ||
              !!walked.enum);
          // The renderer requires every allOf/anyOf/oneOf branch to be a `$ref`
          // (except an allOf `if`/`then.$ref` conditional, which it renders).
          if (
            walked &&
            typeof walked === "object" &&
            !Array.isArray(walked) &&
            !walked.$ref &&
            !isBarePrimitive &&
            !(walked.if && walked.then) &&
            !isConstraintOnly(walked)
          ) {
            return hoist(walked, pathParts.concat(`${key}${idx}`), `inline ${key} branch`);
          }
          return walked;
        }) as never;
      }
    }

    // Hoist this node if it is an inline nested object (never the root, never a
    // direct definitions entry).
    if (!atRoot && !isDefEntry && isObjectNode(node)) {
      return hoist(node, pathParts, "inline nested object");
    }
    return node;
  };

  const walked = walk(root as unknown as SpecJsonSchema, [], true, false) as unknown as SpecJsonSchemaRoot;
  walked.definitions = defs;
  return { schema: walked, warnings };
}
