const path = require('path');

module.exports = {
  roots: [
    "<rootDir>"
  ],
  testPathIgnorePatterns: [
    "/dist/"
  ],
  preset: "ts-jest",
  testEnvironment: "node",
  verbose: true,
  testMatch: ["**/test/**/*.spec.unit.[jt]s"],
  transform: {
    "^.+\\.[tj]sx?$": ["ts-jest", { "tsconfig": path.resolve(__dirname, 'tsconfig.jest.json') }]
  },
  transformIgnorePatterns: ["/node_modules/(?!(uuid|@companieshouse)/)"],
  moduleNameMapper: {
    "^uuid$": "<rootDir>/node_modules/uuid/dist-node/index.js"
  },
  setupFiles: ["<rootDir>/setup-mock-ioredis.js"],
  globalSetup: "./global.setup.ts"
};
