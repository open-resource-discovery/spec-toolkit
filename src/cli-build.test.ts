import fs from "node:fs";
import path from "node:path";
import { describe, expect, test } from "./testHelpers/nodeTest.js";

describe("built CLI", () => {
  test("is executable for npm link workflows", () => {
    const cliPath = path.resolve("dist/cli.js");

    expect(fs.statSync(cliPath).mode & 0o111).toBeGreaterThan(0);
  });
});
