jest.mock("../../client/apiclient");
jest.mock("../../services/redis.service");
jest.mock("../../services/session.service");

import * as request from "supertest";
import {ExtensionsCompanyProfile, getCompanyProfile} from "../../client/apiclient";
import * as mockUtils from "../mock.utils";
import app from "../../app";
import * as pageURLs from "../../model/page.urls";
import {COOKIE_NAME} from "../../session/config";
import { loadSession } from "../../services/redis.service";
import {createHistoryIfNone, getCompanyInContext} from "../../services/session.service";

const mockCompanyProfile: jest.Mock = (<unknown>getCompanyProfile as jest.Mock<typeof getCompanyProfile>);
const mockCacheService = (<unknown>loadSession as jest.Mock<typeof loadSession>);
const mockGetCompanyInContext = (<unknown>getCompanyInContext as jest.Mock<typeof getCompanyInContext>);
const mockCreateHistoryIfNone = (<unknown>createHistoryIfNone as jest.Mock<typeof createHistoryIfNone>);

beforeEach(() => {
  mockCompanyProfile.mockRestore();
  mockCacheService.mockRestore();
  mockUtils.loadMockSession(mockCacheService);
  mockGetCompanyInContext.mockReturnValueOnce(() => "00006400");

  mockCreateHistoryIfNone.prototype.constructor.mockImplementation(() => {
    return {
      page_history:[],
    };
  });
});

describe("twelve months controller tests",() => {

  it("should render the page", async() => {
    const dummyCompanyProfile: ExtensionsCompanyProfile = mockUtils.getDummyCompanyProfile(false, true);
    mockCompanyProfile.mockResolvedValue(dummyCompanyProfile);

    const res = await request(app).get(pageURLs.EXTENSIONS_AFTER_TWELVE_MONTHS)
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`]);

    expect(res.status).toEqual(200);
  });
});
