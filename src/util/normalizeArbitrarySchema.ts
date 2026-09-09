import type { SpecJsonSchema, SpecJsonSchemaRoot } from "../generated/spec/spec-v1/types/index.js";
import { log } from "./log.js";

/**
 * Normalize an arbitrary JSON Schema into the shape the spec-toolkit renderer
 * and validator expect, reporting each deviation from the strong authoring
 * conventions as a warning in tolerant mode or an error in strict mode.
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
  inferredObjectNodes: SpecJsonSchema[];
}

export interface NormalizeOptions {
  strict?: boolean;
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
  const normalizedBase = base || "Object";
  let name = normalizedBase;
  let i = 2;
  while (taken.has(name)) {
    name = `${normalizedBase}${i}`;
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
export function normalizeArbitrarySchema(schema: SpecJsonSchemaRoot, options: NormalizeOptions = {}): NormalizeResult {
  // Deep copy; never touch the input.
  const root = JSON.parse(JSON.stringify(schema)) as SpecJsonSchemaRoot & Record<string, unknown>;
  if (!root.definitions) root.definitions = {};
  const defs = root.definitions as Record<string, SpecJsonSchema>;
  const taken = new Set<string>(Object.keys(defs));
  const warnings: string[] = [];
  let strictViolationCount = 0;
  const inferredObjectNodes: SpecJsonSchema[] = [];

  const warn = (msg: string, strictViolation = true): void => {
    warnings.push(msg);
    if (options.strict && strictViolation) {
      strictViolationCount += 1;
      log.error(msg);
    } else log.warn(msg);
  };

  // spec-toolkit only understands `definitions` (not `$defs`). Merge both
  // containers without overwriting an existing definition and rewrite local
  // references so deleting `$defs` cannot leave dangling pointers.
  const modernDefs = root.$defs as Record<string, SpecJsonSchema> | undefined;
  if (modernDefs && typeof modernDefs === "object" && !Array.isArray(modernDefs)) {
    const renamed = new Map<string, string>();
    for (const [name, definition] of Object.entries(modernDefs)) {
      const targetName = uniqueName(name, taken);
      defs[targetName] = definition;
      renamed.set(name, targetName);
    }

    const rewriteModernRefs = (value: unknown): void => {
      if (!value || typeof value !== "object") return;
      if (Array.isArray(value)) {
        for (const item of value) rewriteModernRefs(item);
        return;
      }
      const record = value as Record<string, unknown>;
      if (typeof record.$ref === "string") {
        const match = record.$ref.match(/^#\/\$defs\/([^/]+)(.*)$/);
        if (match) {
          record.$ref = `#/definitions/${renamed.get(match[1]) ?? match[1]}${match[2]}`;
        }
      }
      for (const child of Object.values(record)) rewriteModernRefs(child);
    };

    rewriteModernRefs(root);
    delete root.$defs;
    warn('Normalized: "$defs" entries and references moved to "definitions" for documentation generation.');
  }

  const resolveLocalPointer = (ref: string): unknown => {
    if (!ref.startsWith("#/")) return undefined;
    return ref
      .slice(2)
      .split("/")
      .map((part) => part.replace(/~1/g, "/").replace(/~0/g, "~"))
      .reduce<unknown>((value, part) => {
        if (!value || typeof value !== "object") return undefined;
        return (value as Record<string, unknown>)[part];
      }, root);
  };

  const removeDanglingAssociationTargets = (node: unknown): void => {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) {
      for (const item of node) removeDanglingAssociationTargets(item);
      return;
    }
    const record = node as Record<string, unknown>;
    const associationTargets = record["x-association-target"];
    if (Array.isArray(associationTargets)) {
      const resolvableTargets = associationTargets.filter((target): target is string => {
        if (typeof target !== "string") return false;
        if (resolveLocalPointer(target) !== undefined) return true;
        const [, container, definitionName, propertyName] = target.split("/");
        const definition = container === "definitions" ? defs[definitionName] : undefined;
        return !!definition && (!propertyName || !!definition.properties?.[propertyName]);
      });
      if (resolvableTargets.length !== associationTargets.length) {
        warn(
          "Normalized: dangling x-association-target removed for documentation generation (authored file unchanged).",
          false,
        );
      }
      if (resolvableTargets.length > 0) record["x-association-target"] = resolvableTargets;
      else delete record["x-association-target"];
    }
    for (const value of Object.values(record)) removeDanglingAssociationTargets(value);
  };
  removeDanglingAssociationTargets(root);

  const deepReferenceAliases = new Map<string, string>();
  const aliasedObjects = new WeakMap<object, string>();
  const rewriteDeepReferences = (node: unknown): void => {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) {
      for (const item of node) rewriteDeepReferences(item);
      return;
    }
    const record = node as Record<string, unknown>;
    if (typeof record.$ref === "string" && record.$ref.startsWith("#/")) {
      const originalRef = record.$ref;
      const pointerParts = originalRef.slice(2).split("/");
      const isDirectDefinition = pointerParts.length === 2 && pointerParts[0] === "definitions";
      if (!isDirectDefinition) {
        let aliasRef = deepReferenceAliases.get(originalRef);
        if (!aliasRef) {
          const target = resolveLocalPointer(originalRef);
          if (target && typeof target === "object") {
            const targetSchema = target as SpecJsonSchema;
            const name = uniqueName(
              targetSchema.title ? pascalCase(targetSchema.title) : pascalCase(pointerParts.slice(1).join(" ")),
              taken,
            );
            aliasRef = `#/definitions/${name}`;
            deepReferenceAliases.set(originalRef, aliasRef);
            aliasedObjects.set(target, aliasRef);
            defs[name] = JSON.parse(JSON.stringify(targetSchema)) as SpecJsonSchema;
            rewriteDeepReferences(defs[name]);
            warn(
              `Normalized: deep reference "${originalRef}" copied to ${aliasRef} for documentation generation (authored file unchanged).`,
            );
          }
        }
        if (aliasRef) record.$ref = aliasRef;
      }
    }
    for (const value of Object.values(record)) rewriteDeepReferences(value);
  };
  rewriteDeepReferences(root);

  for (const [definitionName, definition] of Object.entries(defs)) {
    if (
      definition &&
      typeof definition === "object" &&
      !definition.title &&
      (!definition.$ref || definition.$ref.startsWith("#"))
    ) {
      definition.title = definitionName;
      warn(
        `Normalized: definition "${definitionName}" has no "title"; used its definition name for documentation generation (authored file unchanged).`,
      );
    }
  }

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

  const isRequiredOnlyConstraint = (node: SpecJsonSchema): boolean =>
    !!node &&
    typeof node === "object" &&
    !Array.isArray(node) &&
    Object.keys(node).length === 1 &&
    Array.isArray(node.required) &&
    node.required.length === 1;

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
   * `skipSelfHoist` is true for a direct definition or composition branch.
   * Their children are still normalized before the caller decides whether to hoist them.
   */
  const walk = (
    node: SpecJsonSchema,
    pathParts: string[],
    atRoot: boolean,
    skipSelfHoist: boolean,
    inCompositionBranch = false,
  ): SpecJsonSchema => {
    if (!node || typeof node !== "object") return node;
    if (Array.isArray(node)) {
      return node.map((item, idx) =>
        walk(item, pathParts.concat(String(idx)), false, false),
      ) as unknown as SpecJsonSchema;
    }

    // Add a missing `type` where the node is clearly an object.
    if (looksLikeObject(node)) {
      node.type = "object";
      inferredObjectNodes.push(node);
      warn(
        `Normalized: node at "${pathParts.join(".") || "(root)"}" has object keywords but no "type"; assumed "object".`,
      );
    }

    if (
      options.strict &&
      !node.type &&
      !node.$ref &&
      !node.allOf &&
      !node.anyOf &&
      !node.oneOf &&
      !(inCompositionBranch && (node.const !== undefined || !!node.enum)) &&
      !node.if &&
      !(node as Record<string, unknown>)["x-ref-to-doc"] &&
      !isConstraintOnly(node)
    ) {
      warn(
        `Strict mode: node at "${pathParts.join(".") || "(root)"}" has no construct the documentation renderer recognizes.`,
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
        const isSupportedRequiredOnlyAnyOf =
          key === "anyOf" && branches.length > 0 && branches.every(isRequiredOnlyConstraint);
        node[key] = branches.map((sub: SpecJsonSchema, idx: number) => {
          // A pure constraint branch (conditional requiredness, no shape) is
          // left in place; the renderer surfaces it as a condition note.
          if (isConstraintOnly(sub)) {
            // The existing renderer supports discriminator-style allOf
            // conditions whose `then` selects a definition by $ref. Only the
            // conditional-requiredness fallback is tolerant-only.
            const isSupportedConditionalRef = key === "allOf" && !!sub.if && !!sub.then?.$ref;
            if (options.strict && !isSupportedConditionalRef && !isSupportedRequiredOnlyAnyOf) {
              warn(
                `Strict mode: inline ${key} constraint branch at "${pathParts.join(".") || "(root)"}" is unsupported.`,
              );
            }
            return sub;
          }
          const walked = walk(sub, pathParts.concat(`${key}${idx}`), false, true, true);
          // A branch with only a scalar/empty-object `type`, `const`, or `enum`
          // renders inline fine; only branches carrying a shape need hoisting.
          const isBareType =
            walked &&
            typeof walked === "object" &&
            !Array.isArray(walked) &&
            !walked.$ref &&
            !walked.properties &&
            !walked.patternProperties &&
            (typeof walked.type === "string" || walked.const !== undefined || !!walked.enum);
          // A typed schema may use inline scalar branches as annotations (for
          // example, SpecJsonSchemaType is `type: string` with a descriptive
          // `oneOf`). The existing renderer handles those through the declared
          // parent type. An untyped oneOf/anyOf depends on the inline branches
          // to determine its type and reaches the unsupported renderer path.
          // allOf branches are always interpreted as composition by the object
          // renderer, so its historical $ref requirement still applies.
          if (options.strict && isBareType && (key === "allOf" || !node.type)) {
            warn(`Strict mode: inline ${key} branch at "${pathParts.join(".") || "(root)"}" must use a $ref.`);
          }
          // The renderer requires every allOf/anyOf/oneOf branch to be a `$ref`
          // (except an allOf `if`/`then.$ref` conditional, which it renders).
          if (
            walked &&
            typeof walked === "object" &&
            !Array.isArray(walked) &&
            !walked.$ref &&
            !isBareType &&
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
    if (!atRoot && !skipSelfHoist && isObjectNode(node)) {
      const aliasRef = aliasedObjects.get(node);
      if (aliasRef) return { $ref: aliasRef };
      return hoist(node, pathParts, "inline nested object");
    }
    return node;
  };

  const walked = walk(root as unknown as SpecJsonSchema, [], true, false) as unknown as SpecJsonSchemaRoot;
  walked.definitions = defs;
  if (options.strict && strictViolationCount > 0) {
    throw new Error(
      `Strict schema mode rejected ${strictViolationCount} unsupported schema construct(s). ` +
        'Set "generalConfig.schemaMode" to "tolerant" to normalize supported deviations and continue generation.',
    );
  }
  return { schema: walked, warnings, inferredObjectNodes };
}
