import { Logger } from "tslog";

/**
 * Logging instance and settings that are shared by all scripts in this repo
 */
export const log = new Logger({
  minLevel: 3,
  type: "pretty",
  pretty: {
    template: "{{hh}}:{{MM}}:{{ss}} {{logLevelName}} ",
  },
});

const sectionRule = "-".repeat(74);
const bannerRule = "=".repeat(74);

export function logSection(title: string): void {
  log.info("");
  log.info(sectionRule);
  log.info(title);
  log.info(sectionRule);
}

export function logBanner(title: string): void {
  log.info("");
  log.info(bannerRule);
  log.info(title);
  log.info(bannerRule);
}

export function logWritten(filePath: string): void {
  log.info(`Written: ${filePath}`);
}
