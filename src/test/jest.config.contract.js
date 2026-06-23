module.exports = {
  rootDir: "../../.",
  testEnvironment: "node",
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
  testMatch: ["**/test/**/*.spec.contract.[jt]s"],
  testPathIgnorePatterns: [
    "/node_modules/",
    "/dist/"
  ],
  globalSetup: "./src/test/global.setup.ts"
};
