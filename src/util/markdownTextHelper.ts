/**
 * Generates a YAML Frontmatter header with common needed meta information
 */
export function getMarkdownFrontMatter(mdFrontmatter?: { [key: string]: string | undefined }): string {
  let text = "";
  if (mdFrontmatter) {
    text += "---\n";
    for (const [key, value] of Object.entries(mdFrontmatter)) {
      if (value !== undefined) {
        text += `${key}: "${value}"\n`;
      }
    }
    text += "---\n\n";
  }
  return text;
}
