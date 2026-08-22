export default {
  modulePathIgnorePatterns: ["src/__tests__/generated", "src/generated", "dist"],
  coverageDirectory: "reports/jest-coverage",
  collectCoverage: true,
  extensionsToTreatAsEsm: [".ts"],
  moduleFileExtensions: ["js", "json", "ts", "d.ts"],
  reporters: ["default"],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  transform: {
    "^.+\\.ts$": [
      "@swc/jest",
      {
        jsc: {
          parser: { syntax: "typescript" },
          target: "es2022",
        },
        module: { type: "es6" },
        sourceMaps: "inline",
      },
    ],
  },
  watchPlugins: ["jest-watch-typeahead/filename", "jest-watch-typeahead/testname"],
  testTimeout: 600000,
};
