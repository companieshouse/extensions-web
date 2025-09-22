import { Request, Response } from "express";
import middleware from "../../../session/middleware/index";
import Session from "../../../session/session";
import * as redisService from "../../../services/redis.service";
import activeFeature from "../../../feature.flag";
import { COOKIE_NAME } from "../../../session/config";

jest.mock("../../../services/redis.service");
jest.mock("../../../session/session");
jest.mock("../../../logger");
jest.mock("../../../feature.flag");

const mockReq = (cookieValue?: string) => ({
  cookies: cookieValue ? { [COOKIE_NAME]: cookieValue } : {},
  get: jest.fn().mockReturnValue("test-agent"),
  ip: "127.0.0.1",
  chSession: undefined,
} as unknown as Request);

const mockCookie = jest.fn();

const mockRes = () => ({
  cookie: mockCookie,
} as unknown as Response);

const mockNext = jest.fn();

describe("session middleware", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("creates a new session if no cookie and feature enabled", async () => {
    (activeFeature as jest.Mock).mockReturnValue(true);
    const sessionInstance = { setClientSignature: jest.fn(), cookieId: "new-cookie" };
    (Session.newInstance as jest.Mock).mockReturnValue(sessionInstance);

    await middleware(mockReq(), mockRes(), mockNext);

    expect(Session.newInstance).toHaveBeenCalled();
    expect(sessionInstance.setClientSignature).toHaveBeenCalledWith("test-agent", "127.0.0.1");
    expect(redisService.saveSession).toHaveBeenCalledWith(sessionInstance);
    expect(mockCookie).toHaveBeenCalledWith(COOKIE_NAME, "new-cookie", { path: "/" });
    expect(mockNext).toHaveBeenCalled();
  });

  it("loads session from redis if cookie exists", async () => {
    (activeFeature as jest.Mock).mockReturnValue(false);
    (redisService.loadSession as jest.Mock).mockResolvedValue({ cookieId: "existing-cookie" });

    const req = mockReq("existing-cookie");
    const res = mockRes();

    await middleware(req, res, mockNext);

    expect(redisService.loadSession).toHaveBeenCalledWith("existing-cookie");
    expect(req.chSession).toEqual({ cookieId: "existing-cookie" });
    expect(mockNext).toHaveBeenCalled();
  });
});