#!/usr/bin/env node
import { init } from "./cliRunner.js";

try {
  const currentNodeVersion = process.versions.node;
  const semver = currentNodeVersion.split(".");
  const major = parseInt(semver[0]);

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

  init(process.argv);
} catch (err) {
  process.stdout.write(String(err));
  process.exit(1);
}
