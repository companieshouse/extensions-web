import * as request from "supertest";
import {ExtensionsCompanyProfile, getCompanyProfile} from "../../client/apiclient";
import * as mockUtils from "../mock.utils";
import app from "../../app";
import * as pageURLs from "../../model/page.urls";
import {COOKIE_NAME} from "../../session/config";
import { loadSession } from "../../services/redis.service";
import {createHistoryIfNone, getCompanyInContext} from "../../services/session.service";

jest.mock("../../client/apiclient");
jest.mock("../../services/redis.service");
jest.mock("../../services/session.service");

const mockCompanyProfile: jest.Mock = (<unknown>getCompanyProfile as jest.Mock<typeof getCompanyProfile>);
const mockCacheService = (<unknown>loadSession as jest.Mock<typeof loadSession>);
const mockGetCompanyInContext = (<unknown>getCompanyInContext as jest.Mock<typeof getCompanyInContext>);
const mockCreateHistoryIfNone = (<unknown>createHistoryIfNone as jest.Mock<typeof createHistoryIfNone>);

const ERROR_MSG = "Sorry, there is a problem with the service";
const ERROR_TITLE = "Sorry, there is a problem with the service - GOV.UK";
const AFTER_TWELVE_MONTHS_MSG = "We cannot grant an extension to the filing deadline";
const AFTER_TWELVE_MONTHS_TITLE = "You cannot use this service";

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
    expect(res.text).toContain(AFTER_TWELVE_MONTHS_MSG);
    expect(res.text).toContain(AFTER_TWELVE_MONTHS_TITLE);
  });

  it("should show error screen if company number search throws an error", async () => {
    mockCompanyProfile.mockRejectedValue(new Error());

    const res = await request(app)
      .get(pageURLs.EXTENSIONS_AFTER_TWELVE_MONTHS)
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
      .get(pageURLs.EXTENSIONS_AFTER_TWELVE_MONTHS)
      .set("referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`]);

    expect(res.status).toEqual(500);
    expect(mockCompanyProfile).toBeCalledTimes(0);
    expect(res.text).toContain(ERROR_MSG);
    expect(res.text).toContain(ERROR_TITLE);
  });

});
