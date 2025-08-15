import { SpecJsonSchema, SpecJsonSchemaRoot } from "../generated/spec/spec-v1/types/index.js";
import { log } from "./log.js";
import GfmEscape from "gfm-escape";
const escaper = new GfmEscape({ table: true });

export function escapeMdInTable(md: string = ""): string {
  // TODO: Improve this by not making every linebreak a <br>, just two line-breaks should become a paragraph
  // This will be easier once we convert the markdown table to an HTML table
  return md.split("\n").join("<br/>");
}

/**
 * Escapes text input to work within markdown tables
 * @see https://www.npmjs.com/package/gfm-escape
 *
 * TODO: Simplify this, e.g. only take text. Use separate function to escape code.
 */
export function escapeTextInTable(text: string | string[] | unknown, jsonStringify = true, inlineCode = true): string {
  let result = text || "";

  // Convert this to a string. Either use JSON.stringify or string casting
  if (jsonStringify) {
    result = JSON.stringify(result);
  } else {
    result = `${text}`; // cast to text

    result = escaper.escape(result, { inTable: true });
  }

  if (inlineCode) {
    result = `\`${result}\``;
  }
  return result as string;
}

export function escapeRegexpInTable(text: string): string {
  const escapedRegexp = text
    .split("\\")
    .join(`\\\\`)
    .split("|")
    .join(`\\|`)
    .split("{")
    .join(`\\{`)
    .split("}")
    .join(`\\}`)
    .split(":")
    .join(`\\:`)
    .split("*")
    .join(`\\*`);
  return `<code className="regex">${escapedRegexp}</code>`;
}

export function escapeHtmlChars(input: string): string {
  input = input.replace(/&/g, "&amp;");
  input = input.replace(/</g, "&lt;");
  input = input.replace(/>/g, "&gt;");
  return input;
}

/**
 * Generates a YAML Frontmatter header with common needed meta information
 */
export function getMarkdownFrontMatter(mdFrontmatter?: { [key: string]: string }): string {
  let text = "";
  if (mdFrontmatter) {
    text += "---\n";
    for (const [key, value] of Object.entries(mdFrontmatter)) {
      text += `${key}: "${value}"\n`;
    }
    text += "---\n\n";
  }
  return text;
}

/**
 * Calculate Anchor Links removing special characters
 */
export function getAnchorLinkFromTitle(link: string | undefined): string {
  if (!link) {
    throw new Error(`Cannot create anchor link for undefined target`);
  }
  let cleanLink = `#${link.toLowerCase().split(" ").join("-")}`;
  cleanLink = cleanLink.replace(/@/g, "");
  cleanLink = cleanLink.replace(/\./g, "");
  cleanLink = cleanLink.replace(/\(/g, "");
  cleanLink = cleanLink.replace(/\)/g, "");
  cleanLink = cleanLink.replace(/\*/g, "");
  //cleanLink = cleanLink.replace(/-/g,'')
  return cleanLink;
}

/**
 * Takes a $ref link and returns a markdown link
 */
export function getMdLinkFromRef($ref: string, context: SpecJsonSchema, rootJsonSchema: SpecJsonSchemaRoot): string {
  const split = $ref.split("/");
  const entityName = split[2];
  const propertyName = split[3] || undefined;

  const referencedSchema = rootJsonSchema.definitions[entityName];

  if (!referencedSchema) {
    throw new Error(`Could not resolve $ref "${$ref}" for \n ${JSON.stringify(context, null, 2)}`);
  }

  if (!referencedSchema.title) {
    referencedSchema.title = propertyName || entityName;
    log.warn(`Referenced Schema is missing the title property. Falling back to property name from $ref: ${$ref}`);
    if (!referencedSchema.title) {
      throw new Error(
        `Referenced Schema is missing the title property:\n ${JSON.stringify(referencedSchema, null, 2)}`,
      );
    }
  }

  let link = `[${referencedSchema.title}](${getAnchorLinkFromTitle(referencedSchema.title)})`;

  if (propertyName) {
    if (!referencedSchema.properties || !referencedSchema.properties[propertyName]) {
      throw new Error(`Could not resolve $ref "${$ref}" for\n ${JSON.stringify(context, null, 2)}`);
    }
    link = `[${propertyName}](${getAnchorLinkFromTitle(referencedSchema.title)}_${propertyName.toLowerCase()}))`;
  }
  return link;
}

export function addVerticalSeparator(result: string): string {
  if (!result.includes("<hr/>")) {
    result += "<hr/>";
  } else {
    result += "<br/>";
  }
  return result;
}
