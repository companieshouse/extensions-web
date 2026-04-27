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
  testMatch: ["**/test/**/*.spec.unit.[jt]s"],
  transform: {
    "^.+\\.tsx?$": ["ts-jest", { "tsconfig": "tsconfig.json" }],
  },
  setupFiles: ["<rootDir>/setup-mock-ioredis.js"],
  globalSetup: "./global.setup.ts"
};
