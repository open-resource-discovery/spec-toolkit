import { CORE_SCHEMA, load, mergeTag } from "js-yaml";

const schema = CORE_SCHEMA.withTags(mergeTag);

export function loadYaml<T = unknown>(input: string): T {
  return load(input, { schema }) as T;
}
