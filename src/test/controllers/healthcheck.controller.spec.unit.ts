jest.mock("../../services/redis.service");
jest.mock("../../session/middleware");

import * as request from "supertest";

import mockMiddlewares from "../mock.middleware";
import app from "../../app";
import {EXTENSIONS_HEALTHCHECK} from "../../model/page.urls";
import sessionMiddleware from "../../session/middleware";

const mockCustomExtensionsSessionMiddleware = sessionMiddleware as jest.Mock;

describe("HEALTHCHECK controller", () => {

  beforeEach(() => {
    mockMiddlewares.mockCsrfProtectionMiddleware.mockClear();

    jest.clearAllMocks();
  });

  test("Should return status code 200 and OK when healthcheck url is invoked", async () => {
    const response = await request(app).get(EXTENSIONS_HEALTHCHECK);
    expect(response.status).toEqual(200);
    expect(response.text).toContain("OK");
  });

  test("Should not run csrf or session middleware", async () => {
    await request(app).get(EXTENSIONS_HEALTHCHECK);
    expect(mockMiddlewares.mockCsrfProtectionMiddleware).not.toHaveBeenCalled();
    expect(mockMiddlewares.mockSessionMiddleware).not.toHaveBeenCalled();
    expect(mockCustomExtensionsSessionMiddleware).not.toHaveBeenCalled();
  })
});