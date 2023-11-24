import * as request from "supertest";
import {ExtensionsCompanyProfile, getCompanyProfile, setExtensionRequestStatus} from "../../client/apiclient";
import app from "../../app";
import {COOKIE_NAME } from "../../session/config";
import {EXTENSIONS_CONFIRM_COMPANY} from "../../model/page.urls";
import {loadSession} from "../../services/redis.service";
import * as mockUtils from "../mock.utils";
import {
  addRequest,
  getCompanyInContext,
  hasExtensionRequest,
  createHistoryIfNone,
  getRequest
} from "../../services/session.service";
import * as pageURLs from "../../model/page.urls";
import {IExtensionRequest} from "../../session/types";
import {ExtensionRequestStatus} from "../../model/extension.request.status";
import logger from "../../logger";

jest.mock("../../client/api.enumerations");
jest.mock("../../client/apiclient");
jest.mock("../../services/redis.service");
jest.mock("../../services/session.service");
jest.mock("../../logger");

const GENERIC_ERROR = "Sorry, there is a problem with the service";
const TITLE = "Sorry, there is a problem with the service - GOV.UK";

const mockCompanyProfile = getCompanyProfile as jest.Mock;
const mockCacheService = loadSession as jest.Mock;
const mockGetCompanyInContext = getCompanyInContext as jest.Mock;
const mockHasExtensionRequest = hasExtensionRequest as jest.Mock;
const mockAddRequest = addRequest as jest.Mock;
const mockCreateHistoryIfNone = createHistoryIfNone as jest.Mock;
const mockSetExtensionRequestStatus = setExtensionRequestStatus as jest.Mock;
const mockGetRequest = getRequest as jest.Mock;
const mockLoggerError = logger.error as jest.Mock;

const EXTENSION_REQUEST_ID = "12345";

mockGetRequest.mockReturnValue(
  {
    extension_request_id: EXTENSION_REQUEST_ID,
  } as IExtensionRequest
);

 describe("company.details.controller tests", () => {

   beforeEach(() => {
     mockLoggerError.mockClear();
     mockSetExtensionRequestStatus.mockClear();
     mockGetRequest.mockClear();
     mockCompanyProfile.mockRestore();
     mockCacheService.mockRestore();
     mockUtils.loadMockSession(mockCacheService);
     mockGetCompanyInContext.mockReturnValueOnce("00006400");
     mockHasExtensionRequest.prototype.constructor.mockImplementation(() => {
       return true
     });

     mockAddRequest.prototype.constructor.mockImplementation(() => {
       return {
         company_number: "00006400",
         extension_request_id: "request1",
         reason_in_context_string: "reason1"
       }
     });

     mockCreateHistoryIfNone.prototype.constructor.mockImplementation(() => {
       return {
         page_history: [],
       };
     });
   });

  it("should return a company profile if company number exists in session with no overdue message", async () => {
    mockCompanyProfile.mockResolvedValue(mockUtils.getDummyCompanyProfile(false, true));

    const mockPresent: Date = new Date("2019-05-11");
    mockPresent.setHours(0, 0, 0);
    jest.spyOn(Date, "now").mockReturnValue(mockPresent.getTime());

    const res = await request(app).get(EXTENSIONS_CONFIRM_COMPANY)
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`]);

    expect(res.status).toEqual(200);
    expect(res.text).toContain(mockUtils.COMPANY_NAME);
    expect(res.text).toContain(mockUtils.COMPANY_NUMBER);
    expect(res.text).toContain(mockUtils.COMPANY_STATUS_ACTIVE);
    expect(res.text).toContain(mockUtils.COMPANY_TYPE);
    expect(res.text).toContain(mockUtils.COMPANY_INC_DATE);
    expect(res.text).not.toContain("Your accounts are overdue");
    expect(res.text).toContain(mockUtils.LINE_1);
    expect(res.text).toContain(mockUtils.LINE_2);
    expect(res.text).toContain(mockUtils.POST_CODE);
    expect(res.text).toContain(mockUtils.ACCOUNTS_NEXT_DUE_DATE);
  });

  it("should return a company profile with no accounts date row if no date is found", async () => {
    mockCompanyProfile.mockResolvedValue(mockUtils.getDummyCompanyProfileNoAccounts());

    const mockPresent: Date = new Date("2019-05-11");
    mockPresent.setHours(0, 0, 0);
    jest.spyOn(Date, "now").mockReturnValue(mockPresent.getTime());

    const res = await request(app).get(EXTENSIONS_CONFIRM_COMPANY)
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`]);

    expect(res.status).toEqual(200);
    expect(res.text).toContain(mockUtils.COMPANY_NAME);
    expect(res.text).toContain(mockUtils.COMPANY_NUMBER);
    expect(res.text).toContain(mockUtils.COMPANY_STATUS_ACTIVE);
    expect(res.text).toContain(mockUtils.COMPANY_TYPE);
    expect(res.text).toContain(mockUtils.COMPANY_INC_DATE);
    expect(res.text).not.toContain("Your accounts are overdue");
    expect(res.text).toContain(mockUtils.LINE_1);
    expect(res.text).toContain(mockUtils.LINE_2);
    expect(res.text).toContain(mockUtils.POST_CODE);
    expect(res.text).not.toContain("Accounts due");
  });

  it("should return a overdue message when flag true but date has not passed", async () => {
    mockCompanyProfile.mockResolvedValue(mockUtils.getDummyCompanyProfile(true, true));

    const mockPresent: Date = new Date("2019-05-11");
    mockPresent.setHours(0, 0, 0);
    jest.spyOn(Date, "now").mockReturnValue(mockPresent.getTime());

    const res = await request(app).get(EXTENSIONS_CONFIRM_COMPANY)
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`]);

    expect(res.status).toEqual(200);
    expect(res.text).toContain(mockUtils.COMPANY_NAME);
    expect(res.text).toContain(mockUtils.COMPANY_NUMBER);
    expect(res.text).toContain(mockUtils.COMPANY_STATUS_ACTIVE);
    expect(res.text).toContain(mockUtils.COMPANY_TYPE);
    expect(res.text).toContain(mockUtils.COMPANY_INC_DATE);
    expect(res.text).toContain("Your accounts are overdue");
    expect(res.text).toContain(mockUtils.LINE_1);
    expect(res.text).toContain(mockUtils.LINE_2);
    expect(res.text).toContain(mockUtils.POST_CODE);
    expect(res.text).toContain(mockUtils.ACCOUNTS_NEXT_DUE_DATE);
  });

  it("should return a overdue message when flag false but date has passed", async () => {
    mockCompanyProfile.mockResolvedValue(mockUtils.getDummyCompanyProfile(false, true));

    const mockPresent: Date = new Date("2019-05-13");
    mockPresent.setHours(0, 0, 0);
    jest.spyOn(Date, "now").mockReturnValue(mockPresent.getTime());

    const res = await request(app).get(EXTENSIONS_CONFIRM_COMPANY)
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`]);

    expect(res.status).toEqual(200);
    expect(res.text).toContain(mockUtils.COMPANY_NAME);
    expect(res.text).toContain(mockUtils.COMPANY_NUMBER);
    expect(res.text).toContain(mockUtils.COMPANY_STATUS_ACTIVE);
    expect(res.text).toContain(mockUtils.COMPANY_TYPE);
    expect(res.text).toContain(mockUtils.COMPANY_INC_DATE);
    expect(res.text).toContain("Your accounts are overdue");
    expect(res.text).toContain(mockUtils.LINE_1);
    expect(res.text).toContain(mockUtils.LINE_2);
    expect(res.text).toContain(mockUtils.POST_CODE);
    expect(res.text).toContain(mockUtils.ACCOUNTS_NEXT_DUE_DATE);
  });

  it("should return a overdue message when both flag true and date has passed", async () => {
    mockCompanyProfile.mockResolvedValue(mockUtils.getDummyCompanyProfile(false, true));

    const mockPresent: Date = new Date("2019-05-13");
    mockPresent.setHours(0, 0, 0);
    jest.spyOn(Date, "now").mockReturnValue(mockPresent.getTime());

    const res = await request(app).get(EXTENSIONS_CONFIRM_COMPANY)
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`]);

    expect(res.status).toEqual(200);
    expect(res.text).toContain(mockUtils.COMPANY_NAME);
    expect(res.text).toContain(mockUtils.COMPANY_NUMBER);
    expect(res.text).toContain(mockUtils.COMPANY_STATUS_ACTIVE);
    expect(res.text).toContain(mockUtils.COMPANY_TYPE);
    expect(res.text).toContain(mockUtils.COMPANY_INC_DATE);
    expect(res.text).toContain("Your accounts are overdue");
    expect(res.text).toContain(mockUtils.LINE_1);
    expect(res.text).toContain(mockUtils.LINE_2);
    expect(res.text).toContain(mockUtils.POST_CODE);
    expect(res.text).toContain(mockUtils.ACCOUNTS_NEXT_DUE_DATE);
  });

  it("should return the accounts overdue page when company accounts are overdue", async () => {
    mockCompanyProfile.mockResolvedValue(mockUtils.getDummyCompanyProfile(true, true));
    mockCacheService.prototype.constructor.mockImplementationOnce(mockUtils.fullDummySession);
    const mockPresent: Date = new Date("2019-05-11");
    mockPresent.setHours(0, 0, 0);
    jest.spyOn(Date, "now").mockReturnValue(mockPresent.getTime());
    const res = await request(app).post(EXTENSIONS_CONFIRM_COMPANY)
      .set("referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`]);

    expect(res.status).toEqual(200);
    expect(res.text).toContain("It's too late to apply for an extension");
    expect(res.text).toContain(mockUtils.ACCOUNTS_NEXT_DUE_DATE);
  });

  it("should not return the accounts overdue page when company accounts are not overdue", async () => {
    mockCompanyProfile.mockResolvedValue(mockUtils.getDummyCompanyProfile(false, true));
    mockCacheService.prototype.constructor.mockImplementationOnce(mockUtils.fullDummySession);
    const mockPresent: Date = new Date("2019-05-11");
    mockPresent.setHours(0, 0, 0);
    jest.spyOn(Date, "now").mockReturnValue(mockPresent.getTime());
    const res = await request(app).post(EXTENSIONS_CONFIRM_COMPANY)
      .set("referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`]);

    expect(res.status).toEqual(302);
    expect(res.text).not.toContain("It's too late to apply for an extension");
    expect(res.text).not.toContain(mockUtils.ACCOUNTS_NEXT_DUE_DATE);
  });

  it("should return the accounts overdue page when company accounts are not overdue but due date has passed", async () => {
    mockCompanyProfile.mockResolvedValue(mockUtils.getDummyCompanyProfile(false, true));
    const mockPresent: Date = new Date("2019-05-13");
    mockPresent.setHours(0, 0, 0);
    jest.spyOn(Date, "now").mockReturnValue(mockPresent.getTime());
    const res = await request(app).post(EXTENSIONS_CONFIRM_COMPANY)
      .set("referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`]);

    expect(res.status).toEqual(200);
    expect(res.text).toContain("It's too late to apply for an extension");
    expect(res.text).toContain(mockUtils.ACCOUNTS_NEXT_DUE_DATE);
  });

  it("should return the accounts overdue page when company accounts are both overdue and due date has passed", async () => {
    mockCompanyProfile.mockResolvedValue(mockUtils.getDummyCompanyProfile(true, true));
    const mockPresent: Date = new Date("2019-05-13");
    mockPresent.setHours(0, 0, 0);
    jest.spyOn(Date, "now").mockReturnValue(mockPresent.getTime());
    const res = await request(app).post(EXTENSIONS_CONFIRM_COMPANY)
      .set("referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`]);

    expect(res.status).toEqual(200);
    expect(res.text).toContain("It's too late to apply for an extension");
    expect(res.text).toContain(mockUtils.ACCOUNTS_NEXT_DUE_DATE);
  });

  it("should not return the accounts overdue page when company accounts are not overdue and date is the same", async () => {
    mockCompanyProfile.mockResolvedValue(mockUtils.getDummyCompanyProfile(false, true));
    const mockPresent: Date = new Date("2019-05-12");
    mockPresent.setHours(0, 0, 0);
    jest.spyOn(Date, "now").mockReturnValue(mockPresent.getTime());
    const res = await request(app).post(EXTENSIONS_CONFIRM_COMPANY)
      .set("referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`]);

    expect(res.status).toEqual(302);
    expect(res.text).not.toContain("It's too late to apply for an extension");
    expect(res.text).not.toContain(mockUtils.ACCOUNTS_NEXT_DUE_DATE);
  });

  it("should show error screen if company number search throws an error", async () => {
    mockCompanyProfile.mockRejectedValue(new Error());

    const res = await request(app)
      .get(EXTENSIONS_CONFIRM_COMPANY)
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`]);

    expect(res.status).toEqual(500);
    expect(res.text).toContain(GENERIC_ERROR);
    expect(res.text).toContain(TITLE);
  });

  it("should show error screen if company number not present", async () => {
    mockCacheService.mockClear();
    mockCacheService.prototype.constructor.mockImplementationOnce(() => undefined);

    const res = await request(app)
      .get(EXTENSIONS_CONFIRM_COMPANY)
      .set("referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`]);

    expect(res.status).toEqual(500);
    expect(mockCompanyProfile).toBeCalledTimes(0);
    expect(res.text).toContain(GENERIC_ERROR);
    expect(res.text).toContain(TITLE);
  });

  it("should return extension limit reached page when filing date is after configured period after due date", async () => {
    const dummyCompanyProfile: ExtensionsCompanyProfile = mockUtils.getDummyCompanyProfile(false, true);
    dummyCompanyProfile.accountingPeriodEndOn = new Date(2021, 1, 1, 2, 30, 31).toDateString();
    dummyCompanyProfile.accountsDue = new Date(2022, 1, 2, 1, 11, 10).toUTCString();
    mockCompanyProfile.mockResolvedValue(dummyCompanyProfile);

    const res = await request(app).post(EXTENSIONS_CONFIRM_COMPANY)
      .set("referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`]);

    expect(res.header.location).toEqual(pageURLs.EXTENSIONS_EXTENSION_LIMIT_REACHED);
    expect(res.status).toEqual(302);

    expect(mockSetExtensionRequestStatus).toBeCalledTimes(1);
    expect(mockSetExtensionRequestStatus.mock.calls[0][0]).toStrictEqual(ExtensionRequestStatus.REJECTED_MAX_EXT_LENGTH_EXCEEDED);
    expect(mockSetExtensionRequestStatus.mock.calls[0][1]).toStrictEqual(EXTENSION_REQUEST_ID);
    expect(mockSetExtensionRequestStatus.mock.calls[0][2]).toStrictEqual(mockUtils.COMPANY_NUMBER);
    expect(mockSetExtensionRequestStatus.mock.calls[0][3]).toStrictEqual(mockUtils.ACCESS_TOKEN);
  });

  it("should return extension limit reached page when filing date is on the configured period after due date", async () => {
    const dummyCompanyProfile: ExtensionsCompanyProfile = mockUtils.getDummyCompanyProfile(false, true);
    dummyCompanyProfile.accountingPeriodEndOn = new Date(2021, 1, 1, 16, 15, 3).toDateString();
    dummyCompanyProfile.accountsDue = new Date(2022, 1, 1, 1, 30, 56).toUTCString();
    mockCompanyProfile.mockResolvedValue(dummyCompanyProfile);

    const res = await request(app).post(EXTENSIONS_CONFIRM_COMPANY)
      .set("referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`]);

    expect(res.header.location).toEqual(pageURLs.EXTENSIONS_EXTENSION_LIMIT_REACHED);
    expect(res.status).toEqual(302);

    expect(mockSetExtensionRequestStatus).toBeCalledTimes(1);
    expect(mockSetExtensionRequestStatus.mock.calls[0][0]).toStrictEqual(ExtensionRequestStatus.REJECTED_MAX_EXT_LENGTH_EXCEEDED);
    expect(mockSetExtensionRequestStatus.mock.calls[0][1]).toStrictEqual(EXTENSION_REQUEST_ID);
    expect(mockSetExtensionRequestStatus.mock.calls[0][2]).toStrictEqual(mockUtils.COMPANY_NUMBER);
    expect(mockSetExtensionRequestStatus.mock.calls[0][3]).toStrictEqual(mockUtils.ACCESS_TOKEN);
  });

   it("should show error screen when unable to get request from session on extension limit check", async () => {
     const dummyCompanyProfile: ExtensionsCompanyProfile = mockUtils.getDummyCompanyProfile(false, true);
     dummyCompanyProfile.accountingPeriodEndOn = new Date(2021, 1, 1, 16, 15, 3).toDateString();
     dummyCompanyProfile.accountsDue = new Date(2022, 1, 1, 1, 30, 56).toUTCString();
     mockCompanyProfile.mockResolvedValue(dummyCompanyProfile);

     mockGetRequest.mockReturnValueOnce(undefined);

     const res = await request(app).post(EXTENSIONS_CONFIRM_COMPANY)
       .set("referer", "/")
       .set("Cookie", [`${COOKIE_NAME}=123`]);

     expect(res.status).toEqual(500);
     expect(setExtensionRequestStatus).toBeCalledTimes(0);
     expect(res.text).toContain(GENERIC_ERROR);
     expect(res.text).toContain(TITLE);

     expect(logger.error)
       .toHaveBeenNthCalledWith(1, expect.stringContaining("Unable to retrieve extension request from session"));
   });

  it("should not return extension limit reached page when filing date is before configured period after due date", async () => {
    const dummyCompanyProfile: ExtensionsCompanyProfile = mockUtils.getDummyCompanyProfile(false, true);
    dummyCompanyProfile.accountingPeriodEndOn = new Date(2021, 1, 2, 18, 16, 4).toDateString();
    dummyCompanyProfile.accountsDue = new Date(2022, 1, 1, 5, 11, 34).toUTCString();
    mockCompanyProfile.mockResolvedValue(dummyCompanyProfile);

    const res = await request(app).post(EXTENSIONS_CONFIRM_COMPANY)
      .set("referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`]);

    expect(res.header.location).toEqual(pageURLs.EXTENSIONS_CHOOSE_REASON);
    expect(res.status).toEqual(302);
  });

  it("should not return extension limit reached page when due date is empty", async () => {
    const dummyCompanyProfile: ExtensionsCompanyProfile = mockUtils.getDummyCompanyProfileNoAccounts();
    dummyCompanyProfile.isAccountsOverdue = false;
    mockCompanyProfile.mockResolvedValue(dummyCompanyProfile);

    const res = await request(app).post(EXTENSIONS_CONFIRM_COMPANY)
      .set("referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`]);

    expect(res.header.location).toEqual(pageURLs.EXTENSIONS_CHOOSE_REASON);
    expect(res.status).toEqual(302);
  });
});

