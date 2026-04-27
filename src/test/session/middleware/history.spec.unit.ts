jest.mock("ioredis", () => require('../../helpers/mock-ioredis')());
jest.mock("redis", () => require('../../helpers/mock-redis')());
jest.mock("../../../services/redis.service");
jest.mock("../../../services/session.service");
jest.mock("../../../client/apiclient");

import app from "../../../app";
import request from "supertest";
import Session from "../../../session/session";
import * as keys from "../../../session/keys";
import * as pageUrls from "../../../model/page.urls";
import { COOKIE_NAME } from "../../../session/config";
import { loadMockSession } from "../../mock.utils";
import { loadSession } from "../../../services/redis.service";
import {
  createHistoryIfNone,
  getCompanyInContext,
  updateHistory,
} from "../../../services/session.service";
import * as mockUtils from "../../mock.utils";
import { getCompanyProfile } from "../../../client/apiclient";

const mockCacheService = (<unknown>loadSession) as jest.Mock<
  typeof loadSession
>;
const mockUpdateHistory = (<unknown>updateHistory) as jest.Mock<
  typeof updateHistory
>;
const mockCreateHistoryIfNone = (<unknown>createHistoryIfNone) as jest.Mock<
  typeof createHistoryIfNone
>;
const mockCompanyProfile: jest.Mock = (<unknown>getCompanyProfile) as jest.Mock<
  typeof getCompanyProfile
>;
const mockGetCompanyInContext = (<unknown>getCompanyInContext) as jest.Mock<
  typeof getCompanyInContext
>;

beforeEach(() => {
  loadMockSession(mockCacheService);
  mockCreateHistoryIfNone.mockClear();
  mockCreateHistoryIfNone.prototype.constructor.mockImplementation(() => {
    return {
      page_history: [],
    };
  });
  mockCacheService.mockClear();
  mockCacheService.prototype.constructor.mockImplementationOnce((cookieId: string) => {
    const session: Session = Session.newWithCookieId(cookieId);
    session.data = {
      [keys.SIGN_IN_INFO]: {
        [keys.SIGNED_IN]: 1,
      },
      [keys.PAGE_HISTORY]: {
        page_history: [],
      },
    };
    return session;
  });
});

describe("back navigation tests", () => {
  it("should contain the correct back button url - company number", async () => {
    const res = await request(app)
      .get(pageUrls.EXTENSIONS_COMPANY_NUMBER)
      .set("Referer", pageUrls.EXTENSIONS)
      .set("Cookie", [`${COOKIE_NAME}=123`]);
    expect(res.status).toEqual(200);
    expect(mockUpdateHistory).toHaveBeenCalledWith(
      { page_history: [] },
      {
        _cookieId: "123",
        _data: {
          page_history: { page_history: [] },
          signin_info: { signed_in: 1 },
        },
      },
      pageUrls.EXTENSIONS
    );
  });

  it("should contain the correct back button url - company details", async () => {
    mockCompanyProfile.mockResolvedValue(
      mockUtils.getDummyCompanyProfile(false, true)
    );
    mockGetCompanyInContext.mockReturnValueOnce(() => "00006400");
    const res = await request(app)
      .get(pageUrls.EXTENSIONS_CONFIRM_COMPANY)
      .set("Referer", pageUrls.EXTENSIONS_COMPANY_NUMBER)
      .set("Cookie", [`${COOKIE_NAME}=123`]);
    expect(res.status).toEqual(200);
    expect(mockUpdateHistory).toHaveBeenCalledWith(
      { page_history: [] },
      {
        _cookieId: "123",
        _data: {
          page_history: { page_history: [] },
          signin_info: { signed_in: 1 },
        },
      },
      pageUrls.EXTENSIONS_COMPANY_NUMBER
    );
  });

  it("should contain the correct back button url - choose reason", async () => {
    const res = await request(app)
      .get(pageUrls.EXTENSIONS_CHOOSE_REASON)
      .set("Referer", pageUrls.EXTENSIONS_CONFIRM_COMPANY)
      .set("Cookie", [`${COOKIE_NAME}=123`]);
    expect(res.status).toEqual(200);
    expect(mockUpdateHistory).toHaveBeenCalledWith(
      { page_history: [] },
      {
        _cookieId: "123",
        _data: {
          page_history: { page_history: [] },
          signin_info: { signed_in: 1 },
        },
      },
      pageUrls.EXTENSIONS_CONFIRM_COMPANY
    );
  });

  it("should contain the correct back button url - add reason", async () => {
    const res = await request(app)
      .get(pageUrls.EXTENSIONS_ADD_EXTENSION_REASON)
      .set("Referer", pageUrls.EXTENSIONS_DOCUMENT_OPTION)
      .set("Cookie", [`${COOKIE_NAME}=123`]);
    expect(res.status).toEqual(200);
    expect(mockUpdateHistory).toHaveBeenCalledWith(
      { page_history: [] },
      {
        _cookieId: "123",
        _data: {
          page_history: { page_history: [] },
          signin_info: { signed_in: 1 },
        },
      },
      pageUrls.EXTENSIONS_DOCUMENT_OPTION
    );
  });
});
