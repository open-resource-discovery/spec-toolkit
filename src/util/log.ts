import { Logger } from "tslog";

/**
 * Logging instance and settings that are shared by all scripts in this repo
 */
export const log = new Logger({
  type: "pretty",
  pretty: {
    template: "{{hh}}:{{MM}}:{{ss}} {{logLevelName}} ",
  },
});
