export default {
  preset: "ts-jest/presets/default-esm",
  modulePathIgnorePatterns: ["src/__tests__/generated", "src/generated", "dist"],
  coverageDirectory: "reports/jest-coverage",
  collectCoverage: true,
  moduleFileExtensions: ["js", "json", "ts", "d.ts"],
  reporters: ["default"],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  watchPlugins: ["jest-watch-typeahead/filename", "jest-watch-typeahead/testname"],
  testTimeout: 600000,
  transform: {},
};
