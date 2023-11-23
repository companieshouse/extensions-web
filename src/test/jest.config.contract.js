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
  testMatch: ["**/test/**/*.spec.contract.[jt]s"],
  transform: {
    "^.+\\.tsx?$": "ts-jest",
  },
  globalSetup: "./global.setup.ts"
};
