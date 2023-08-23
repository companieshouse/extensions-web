jest.mock("../../services/redis.service");

import * as request from "supertest";
import app from "../../app";
import {EXTENSIONS_HEALTHCHECK} from "../../model/page.urls";

describe("HEALTHCHECK controller", () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("Should return status code 200 and OK when healthcheck url is invoked", async () => {
    const response = await request(app).get(EXTENSIONS_HEALTHCHECK);
    expect(response.status).toEqual(200);
    expect(response.text).toContain("OK");
  });
});