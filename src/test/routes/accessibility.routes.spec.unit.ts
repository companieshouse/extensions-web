import * as templatePaths from "../../model/template.paths";

afterAll(() => {
  process.env.ACCESSIBILITY_TEST_MODE = "off";
  process.env.NODE_ENV = "test";
});

beforeAll(() => {
  process.env.ACCESSIBILITY_TEST_MODE = "on";
});

beforeEach(() => {
  jest.resetModules();
})

describe("routes accessibility tests", () => {

  it("should add accessibility pages to routes in accessibility test mode", () => {

    let routes = require("../../routes/accessibility.routes");

    for (let route of routes.default.stack) {
      assertAccessibilityRoute(templatePaths.REMOVE_REASON, route);
      assertAccessibilityRoute(templatePaths.ILLNESS_END_DATE, route);
      assertAccessibilityRoute(templatePaths.CHECK_YOUR_ANSWERS, route);
      assertAccessibilityRoute(templatePaths.CONTINUED_ILLNESS, route);
      assertAccessibilityRoute(templatePaths.PRINT_APPLICATION, route);
      assertAccessibilityRoute(templatePaths.REASON_ILLNESS, route);
    }
    expect.assertions(6);
  });

  it("should throw error if accessibility test mode is active while production mode is active", () => {
    process.env.ACCESSIBILITY_TEST_MODE = "on";
    process.env.NODE_ENV = "production";
    try {
      require("../../routes/accessibility.routes");
    } catch (ex) {
      expect(ex.message).toEqual("Accessibility mode cannot be active in production mode. Turn off the ACCESSIBILITY_TEST_MODE flag!");
    }
    expect.assertions(1);
  });
});

const assertAccessibilityRoute = (path, route) => {
  if (route.route.path.includes(path)) {
    route.route.stack.forEach(middleware => {
      if (middleware.method === "get") {
        expect(middleware.name).toBe("accessibilityTestRoute");
      }
    })
  }
}
