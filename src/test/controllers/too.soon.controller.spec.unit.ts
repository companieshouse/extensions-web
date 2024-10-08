jest.mock("../../client/apiclient");
jest.mock("../../services/redis.service");
jest.mock("../../services/session.service");

import * as request from "supertest";

import mockMiddlewares from "../mock.middleware";
import app from "../../app";
import {ExtensionsCompanyProfile, getCompanyProfile} from "../../client/apiclient";
import {loadSession} from "../../services/redis.service";
import {createHistoryIfNone, getCompanyInContext} from "../../services/session.service";
import * as mockUtils from "../mock.utils";
import {COOKIE_NAME} from "../../session/config";
import * as pageURLs from "../../model/page.urls";

const mockCompanyProfile: jest.Mock = (<unknown>getCompanyProfile as jest.Mock<typeof getCompanyProfile>);
const mockCacheService = (<unknown>loadSession as jest.Mock<typeof loadSession>);
const mockGetCompanyInContext = (<unknown>getCompanyInContext as jest.Mock<typeof getCompanyInContext>);
const mockCreateHistoryIfNone = (<unknown>createHistoryIfNone as jest.Mock<typeof createHistoryIfNone>);

const ERROR_MSG = "Sorry, there is a problem with the service";
const ERROR_TITLE = "Sorry, there is a problem with the service - GOV.UK";
const TOO_SOON_MSG = "It's too soon to apply for an extension";
const TOO_SOON_TITLE = "Accounts not due";

beforeEach(() => {
  mockMiddlewares.mockCsrfProtectionMiddleware.mockClear();

  mockCompanyProfile.mockRestore();
  mockCacheService.mockRestore();
  mockUtils.loadMockSession(mockCacheService);
  mockGetCompanyInContext.mockReturnValueOnce(() => "00006400");

  mockCreateHistoryIfNone.prototype.constructor.mockImplementation(() => {
    return {
      page_history: [],
    };
  });
});

afterAll(() => {
  // reset back to default value
  process.env.TOO_SOON_DAYS_BEFORE_DUE_DATE = "273";
});

describe("too.soon.controller tests", () => {

  it("should render the too soon page", async () => {
    process.env.TOO_SOON_DAYS_BEFORE_DUE_DATE = "273";
    const dummyCompanyProfile: ExtensionsCompanyProfile = mockUtils.getDummyCompanyProfile(false, true);
    mockCompanyProfile.mockResolvedValue(dummyCompanyProfile);

    const res = await request(app).get(pageURLs.EXTENSIONS_TOO_SOON)
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`]);

    expect(res.status).toEqual(200);
    expect(res.text).toContain("12 May 2019");
    expect(res.text).toContain("12 August 2018");
    expect(res.text).toContain(TOO_SOON_MSG);
    expect(res.text).toContain(TOO_SOON_TITLE);
  });

  it("should show error screen if company number search throws an error", async () => {
    mockCompanyProfile.mockRejectedValue(new Error());

    const res = await request(app)
      .get(pageURLs.EXTENSIONS_TOO_SOON)
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`]);

    expect(res.status).toEqual(500);
    expect(res.text).toContain(ERROR_MSG);
    expect(res.text).toContain(ERROR_TITLE);
  });

  it("should show error screen if company number not present", async () => {
    mockCacheService.mockClear();
    mockCacheService.prototype.constructor.mockImplementationOnce(() => undefined);

    const res = await request(app)
      .get(pageURLs.EXTENSIONS_TOO_SOON)
      .set("referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`]);

    expect(res.status).toEqual(500);
    expect(mockCompanyProfile).toBeCalledTimes(0);
    expect(res.text).toContain(ERROR_MSG);
    expect(res.text).toContain(ERROR_TITLE);
  });
});
