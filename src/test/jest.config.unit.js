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
  moduleNameMapper: {
    "^ioredis$": "<rootDir>/src/test/__mocks__/ioredis.js"
  },
  globalSetup: "./global.setup.ts"
};
