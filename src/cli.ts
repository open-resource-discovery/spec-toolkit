#!/usr/bin/env node
import { init } from "./cliRunner.js";

try {
  const currentNodeVersion = process.versions.node;
  const semver = currentNodeVersion.split(".");
  const major = parseInt(semver[0], 10);

  if (major < 22) {
    process.stdout.write(
      "You are running Node " +
        currentNodeVersion +
        ".\n" +
        "spec-toolkit requires Node 22 or higher. \n" +
        "Please update your version of Node.",
    );
    process.exit(1);
  }

  await init(process.argv);
} catch (err) {
  process.stderr.write(`[error]: ${err instanceof Error ? err.message : String(err)}\n\n`);
  process.exit(1);
}
