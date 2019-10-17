jest.mock("../../services/redis.service");

let mockAuthenticateForDownload: jest.Mock = jest.fn((req: Request, res: Response, next: NextFunction) => next());
jest.mock("../../authentication/middleware/download", () => {
  return {
    authenticateForDownload: mockAuthenticateForDownload
  }
});

import app from "../../app";
import * as request from "supertest";
import {COOKIE_NAME} from "../../session/config";
import {loadSession} from "../../services/redis.service";
import {loadMockSession} from "../mock.utils";
import {NextFunction, Request, Response} from "express";
import activeFeature from "../../feature.flag";

const mockCacheService = (<unknown>loadSession as jest.Mock<typeof loadSession>);

const DOWNLOAD_LANDING_PAGE_URL: string = "/extensions/download/company/1234/extensions/requests/5678/reasons/9999/attachments/8888/download";
const DOWNLOAD_FILE_URL: string = "/extensions/company/1234/extensions/requests/5678/reasons/9999/attachments/8888/download";

beforeEach(() => {
  loadMockSession(mockCacheService);
});

describe("Download attachment landing page tests", () => {

  it("Should show landing page", async () => {
    const response: request.Response = await request(app)
      .get(DOWNLOAD_LANDING_PAGE_URL)
      .set("Accept", "application/json")
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`]);

    expect(response.status).toBe(200);
    expect(response.text).toContain("Your document download will start soon");
    expect(mockAuthenticateForDownload).toHaveBeenCalled();
  });

  it("Should have an auto download set in the html", async () => {
    const response: request.Response = await request(app)
      .get(DOWNLOAD_LANDING_PAGE_URL)
      .set("Accept", "application/json")
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`]);

    expect(response.text).toContain("<meta http-equiv=\"refresh\" content=\"5;URL='" + DOWNLOAD_FILE_URL + "'\"/>");
    expect(mockAuthenticateForDownload).toHaveBeenCalled();
  });

  it("Should have a download link on the page", async () => {
    const response: request.Response = await request(app)
      .get(DOWNLOAD_LANDING_PAGE_URL)
      .set("Accept", "application/json")
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`]);

    expect(response.text).toContain("<a href=\"" + DOWNLOAD_FILE_URL + "\"");
    expect(response.text).not.toContain("download=\"");
    expect(mockAuthenticateForDownload).toHaveBeenCalled();
  })

});
