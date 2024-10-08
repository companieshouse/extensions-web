jest.mock("../../client/apiclient");
jest.mock("../../services/redis.service");
jest.mock("../../services/session.service");

import * as request from "supertest";

import mockMiddlewares from "../mock.middleware";
import app from "../../app";
import {ExtensionsCompanyProfile, getCompanyProfile} from "../../client/apiclient";
import * as mockUtils from "../mock.utils";
import * as pageURLs from "../../model/page.urls";
import {COOKIE_NAME} from "../../session/config";
import { loadSession } from "../../services/redis.service";
import {createHistoryIfNone, getCompanyInContext} from "../../services/session.service";

const mockCompanyProfile = getCompanyProfile as jest.Mock;
const mockCacheService = loadSession as jest.Mock;
const mockGetCompanyInContext = getCompanyInContext as jest.Mock;
const mockCreateHistoryIfNone = createHistoryIfNone as jest.Mock;

const ERROR_MSG = "Sorry, there is a problem with the service";
const ERROR_TITLE = "Sorry, there is a problem with the service - GOV.UK";
const AFTER_TWELVE_MONTHS_MSG = "We cannot grant an extension to the filing deadline";
const AFTER_TWELVE_MONTHS_TITLE = "You cannot use this service";
const EXPECTED_MAX_EXTENSION_PERIOD_IN_MONTHS = "12";

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

describe("extension limit reached controller tests", () => {

  it("should render the page", async() => {
    const dummyCompanyProfile: ExtensionsCompanyProfile = mockUtils.getDummyCompanyProfile(false, true);
    mockCompanyProfile.mockResolvedValue(dummyCompanyProfile);

    const res = await request(app).get(pageURLs.EXTENSIONS_EXTENSION_LIMIT_REACHED)
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`]);

    expect(res.status).toEqual(200);
    expect(res.text).toContain(AFTER_TWELVE_MONTHS_MSG);
    expect(res.text).toContain(AFTER_TWELVE_MONTHS_TITLE);
    expect(res.text).toContain(EXPECTED_MAX_EXTENSION_PERIOD_IN_MONTHS);
  });

  it("should show error screen if company number search throws an error", async () => {
    mockCompanyProfile.mockRejectedValue(new Error());

    const res = await request(app)
      .get(pageURLs.EXTENSIONS_EXTENSION_LIMIT_REACHED)
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
      .get(pageURLs.EXTENSIONS_EXTENSION_LIMIT_REACHED)
      .set("referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`]);

    expect(res.status).toEqual(500);
    expect(mockCompanyProfile).toBeCalledTimes(0);
    expect(res.text).toContain(ERROR_MSG);
    expect(res.text).toContain(ERROR_TITLE);
  });

});
