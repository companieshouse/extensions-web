jest.mock("../../../services/redis.service");

let mockAuthenticateForDownload: jest.Mock = jest.fn((req: Request, res: Response, next: NextFunction) => next());
jest.mock("../../../authentication/middleware/download", () => {
  return {
    authenticateForDownload: mockAuthenticateForDownload
  }
});

import app from '../../../app';
import * as request from 'supertest';
import {COOKIE_NAME} from "../../../session/config";
import {loadMockSession} from "../../mock.utils";
import {NextFunction, Request, Response} from "express";
import {loadSession} from "../../../services/redis.service";

const mockCacheService = (<unknown>loadSession as jest.Mock<typeof loadSession>);

const UNAVAILABLE_TEXT = "service is unavailable";

afterAll(() => {
  process.env.SHOW_SERVICE_UNAVAILABLE_PAGE = "off";
});

beforeEach(() => {
  loadMockSession(mockCacheService);
});

describe("Availability tests", () => {

  it("should show the service unavailable page", async () => {
    process.env.SHOW_SERVICE_UNAVAILABLE_PAGE = "on";

    const response = await request(app)
      .get("/extensions");
    expect(response.text).toContain(UNAVAILABLE_TEXT);
  });

  it("should show the service unavailable page with slash", async () => {
    process.env.SHOW_SERVICE_UNAVAILABLE_PAGE = "on";

    const response = await request(app)
      .get("/extensions/");
    expect(response.text).toContain(UNAVAILABLE_TEXT);
  });

  it("should show the service unavailable page for non start page", async () => {
    process.env.SHOW_SERVICE_UNAVAILABLE_PAGE = "on";

    const response = await request(app)
      .get("/extensions/company-number");
    expect(response.text).toContain(UNAVAILABLE_TEXT);
  });

  it("should NOT show the service unavailable page", async () => {
    process.env.SHOW_SERVICE_UNAVAILABLE_PAGE = "off";

    const response = await request(app)
      .get("/extensions")
      .set("Cookie", [`${COOKIE_NAME}=123`]);
    expect(response.text).not.toContain(UNAVAILABLE_TEXT);
    expect(response.text).toContain("apply for more time to file your annual accounts");
  });

  it("should NOT show the service unavailable page for downloads when page is turned ON", async () => {
    process.env.SHOW_SERVICE_UNAVAILABLE_PAGE = "on";

    const response = await request(app)
      .get("/extensions/download/company/1234/extensions/requests/5678/reasons/623826183/attachments/a7c4f600/download")
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`]);
    expect(response.text).not.toContain(UNAVAILABLE_TEXT);
    expect(response.text).toContain("Your document download will start soon");
  });
});
