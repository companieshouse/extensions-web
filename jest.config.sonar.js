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
  testMatch: ["**/test/**/*.spec.unit.[jt]s", "**/test/**/*.spec.integration.[jt]s"],
  transform: {
    "^.+\\.tsx?$": "ts-jest",
  },
  globalSetup: "./src/test/global.setup.ts",
};
