import * as yaml from "js-yaml";

/**
 * YAML 1.2 core schema extended with merge-key (`<<`) support.
 *
 * js-yaml 5 defaults to YAML 1.2, which dropped the merge-key type from the
 * core schema. The spec YAML files rely on `<<: *anchor` merges, so we re-enable
 * just the merge tag without pulling in the rest of the YAML 1.1 semantics
 * (e.g. `yes`/`no` boolean coercion).
 */
const SCHEMA_WITH_MERGE = yaml.CORE_SCHEMA.withTags(yaml.mergeTag);

/**
 * Parses a YAML (or JSON) string using a schema that supports `<<` merge keys.
 * Drop-in replacement for `yaml.load` used across the toolkit.
 */
export function loadYaml(content: string): unknown {
  return yaml.load(content, { schema: SCHEMA_WITH_MERGE });
}
