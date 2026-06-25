module.exports = {
  rootDir: ".",
  testEnvironment: "node",
  verbose: true,
  testMatch: ["**/test/**/*.spec.unit.[jt]s", "**/test/**/*.spec.integration.[jt]s"],
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: {
          module: "commonjs",
          target: "es6"
        }
      }
    ],
  },
  testPathIgnorePatterns: [
    "/node_modules/",
    "/dist/"
  ],
  globalSetup: "./src/test/global.setup.ts",
};
