import app from '../../../app';
import * as request from 'supertest';
import {COOKIE_NAME} from "../../../session/config";

jest.mock("../../../services/redis.service");

const UNAVAILABLE_TEXT = "service is unavailable";

afterAll(() => {
  process.env.SERVICE_AVAILABLE = "on";
});

describe("Availability tests", () => {

  it("should show the service unavailable page", async () => {
    process.env.SERVICE_AVAILABLE = "off";

    const response = await request(app)
      .get("/extensions");
    expect(response.text).toContain(UNAVAILABLE_TEXT);
  });

  it("should show the service unavailable page with slash", async () => {
    process.env.SERVICE_AVAILABLE = "off";

    const response = await request(app)
      .get("/extensions/");
    expect(response.text).toContain(UNAVAILABLE_TEXT);
  });

  it("should show the service unavailable page for non start page", async () => {
    process.env.SERVICE_AVAILABLE = "off";

    const response = await request(app)
      .get("/extensions/company-number");
    expect(response.text).toContain(UNAVAILABLE_TEXT);
  });

  it("should NOT show the service unavailable page", async () => {
    process.env.SERVICE_AVAILABLE = "on";

    const response = await request(app)
      .get("/extensions")
      .set("Cookie", [`${COOKIE_NAME}=123`]);
    expect(response.text).not.toContain(UNAVAILABLE_TEXT);
    expect(response.text).toContain("apply for more time to file your annual accounts");
  });
});
