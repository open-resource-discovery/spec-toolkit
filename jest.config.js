import { pathsToModuleNameMapper } from "ts-jest";

export default {
  preset: "ts-jest/presets/default-esm",
  modulePathIgnorePatterns: ["src/__tests__/generated", "src/generated", "dist"],
  coverageDirectory: "reports/jest-coverage",
  collectCoverage: true,
  moduleFileExtensions: ["js", "json", "ts", "d.ts"],
  reporters: ["default"],
  moduleNameMapper: pathsToModuleNameMapper({}),
  watchPlugins: ["jest-watch-typeahead/filename", "jest-watch-typeahead/testname"],
  testTimeout: 600000,
  transform: {},
};
