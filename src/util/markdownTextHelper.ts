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
