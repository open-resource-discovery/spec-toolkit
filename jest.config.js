import fs from "fs";
import { pathsToModuleNameMapper } from "ts-jest";

function loadJson(path) {
  return JSON.parse(fs.readFileSync(new URL(path, import.meta.url)));
}

const tsconfig = loadJson("./tsconfig.json");
const { compilerOptions } = tsconfig;

export default {
  preset: "ts-jest/presets/default-esm",
  modulePathIgnorePatterns: ["src/__tests__/generated", "src/generated", "dist"],
  coverageDirectory: "reports/jest-coverage",
  collectCoverage: true,
  moduleFileExtensions: ["js", "json", "ts", "d.ts"],
  reporters: ["default"],
  modulePaths: [compilerOptions.baseUrl],
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, { useESM: true }),
  watchPlugins: ["jest-watch-typeahead/filename", "jest-watch-typeahead/testname"],
  testTimeout: 600000,
  transform: {},
};
