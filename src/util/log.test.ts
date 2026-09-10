import { afterEach, describe, expect, mock, test } from "../testHelpers/nodeTest.js";
import { log, logBanner, logSection, logWritten } from "./log.js";

describe("logging helpers", () => {
  afterEach(() => mock.restoreAll());

  test("formats sections consistently", () => {
    const info = mock.spyOn(log, "info");

    logSection("GENERATE DOCUMENTATION");

    expect(info.mock.calls.map((call) => call.arguments)).toEqual([
      [""],
      ["--------------------------------------------------------------------------"],
      ["GENERATE DOCUMENTATION"],
      ["--------------------------------------------------------------------------"],
    ]);
  });

  test("formats banners consistently", () => {
    const info = mock.spyOn(log, "info");

    logBanner("SUCCESS");

    expect(info.mock.calls.map((call) => call.arguments)).toEqual([
      [""],
      ["=========================================================================="],
      ["SUCCESS"],
      ["=========================================================================="],
    ]);
  });

  test("uses one format for generated files", () => {
    const info = mock.spyOn(log, "info");

    logWritten("generated/docs/spec.md");

    expect(info).toHaveBeenCalledWith("Written: generated/docs/spec.md");
  });
});
