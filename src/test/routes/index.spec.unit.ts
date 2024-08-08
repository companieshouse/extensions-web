jest.mock("redis", () => {
  return {
    createClient: jest.fn().mockReturnThis(),
    on: jest.fn().mockReturnThis(),
  }
});
jest.mock("../../services/redis.service");
jest.mock("../../controllers/company.details.controller");
jest.mock("../../controllers/company.number.controller");

import app from '../../app';
import * as request from 'supertest';
import {COOKIE_NAME} from "../../session/config";
import {loadSession} from "../../services/redis.service";
import {loadMockSession} from "../mock.utils";

const mockCacheService = (<unknown>loadSession as jest.Mock<typeof loadSession>);

beforeEach(() => {
  mockCacheService.mockRestore();

  loadMockSession(mockCacheService);
});

describe("Basic Url Tests", () => {

  it("should find start page url", async () => {
    const response = await request(app)
      .get("/extensions")
      .set("Cookie", [`${COOKIE_NAME}=123`]);
    expect(response.status).toEqual(200);
    expect(response.text).toContain("Accessibility statement");
  });

  it("should find company-number page", async () => {
    const response = await request(app)
      .get("/extensions/company-number")
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`]);
    expect(response.status).toEqual(200);
    expect(response.text).toContain("Accessibility statement");
  });

  it("should return 404 if page doesnt exist", async() => {
    const response = await request(app)
      .get("/gibberish")
      .set("Cookie", [`${COOKIE_NAME}=123`]);
    expect(response.status).toEqual(404);
  });
});
