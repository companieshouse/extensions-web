module.exports = {
  roots: [
    "<rootDir>"
  ],
  testPathIgnorePatterns: [
    "/node_modules/",
    "/dist/"
  ],
  preset: "ts-jest",
  testEnvironment: "node",
  verbose: true,
  testMatch: ["**/test/**/*.spec.integration.[jt]s"],
  globals: {
    "ts-jest": {
      diagnostics: false,
    }
  },
  globalSetup: "./global.setup.ts"
};
