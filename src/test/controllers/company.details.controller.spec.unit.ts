import * as request from "supertest";
import {ExtensionsCompanyProfile, getCompanyProfile} from "../../client/apiclient";
import app from "../../app";
import {COOKIE_NAME } from "../../session/config";
import {EXTENSIONS_CONFIRM_COMPANY} from "../../model/page.urls";
import {loadSession} from "../../services/redis.service";
import * as mockUtils from "../mock.utils";
import {addRequest, getCompanyInContext, hasExtensionRequest, createHistoryIfNone} from "../../services/session.service";
import * as pageURLs from "../../model/page.urls";

jest.mock("../../client/api.enumerations");
jest.mock("../../client/apiclient");
jest.mock("../../services/redis.service");
jest.mock("../../services/session.service");

const GENERIC_ERROR = "Sorry, there is a problem with the service";
const TITLE = "Sorry, there is a problem with the service - GOV.UK";

const mockCompanyProfile: jest.Mock = (<unknown>getCompanyProfile as jest.Mock<typeof getCompanyProfile>);
const mockCacheService = (<unknown>loadSession as jest.Mock<typeof loadSession>);
const mockGetCompanyInContext = (<unknown>getCompanyInContext as jest.Mock<typeof getCompanyInContext>);
const mockHasExtensionRequest = (<unknown>hasExtensionRequest as jest.Mock<typeof hasExtensionRequest>);
const mockAddRequest = (<unknown>addRequest as jest.Mock<typeof addRequest>);
const mockCreateHistoryIfNone = (<unknown>createHistoryIfNone as jest.Mock<typeof createHistoryIfNone>);

  beforeEach(() => {
    mockCompanyProfile.mockRestore();
    mockCacheService.mockRestore();
    mockUtils.loadMockSession(mockCacheService);
    mockGetCompanyInContext.mockReturnValueOnce(() => "00006400");
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
      page_history:[],
    };
  });
});

describe("company.details.controller tests", () => {

  it("should return a company profile if company number exists in session with no overdue message", async () => {
    mockCompanyProfile.mockResolvedValue(mockUtils.getDummyCompanyProfile(false, true));

    const mockPresent: Date = new Date("2019-05-11");
    mockPresent.setHours(0,0,0);
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
    mockPresent.setHours(0,0,0);
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
    mockPresent.setHours(0,0,0);
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
    mockPresent.setHours(0,0,0);
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
    mockPresent.setHours(0,0,0);
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
    mockPresent.setHours(0,0,0);
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
    mockPresent.setHours(0,0,0);
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
    mockPresent.setHours(0,0,0);
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
    mockPresent.setHours(0,0,0);
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
    mockPresent.setHours(0,0,0);
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

  it("should return filing date page when filing date is after configured period after due date", async () => {
    const dummyCompanyProfile: ExtensionsCompanyProfile = mockUtils.getDummyCompanyProfile(false, true);
    dummyCompanyProfile.accountingPeriodEndOn = new Date(2021,1,1,0,0,0).toDateString();
    dummyCompanyProfile.accountsDue = new Date(2022,1,2,0,0,0).toUTCString();
    mockCompanyProfile.mockResolvedValue(dummyCompanyProfile);

    const res = await request(app).post(EXTENSIONS_CONFIRM_COMPANY)
      .set("referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`]);

    expect(res.header.location).toEqual(pageURLs.EXTENSIONS_AFTER_TWELVE_MONTHS);
    expect(res.status).toEqual(302);
  });

  it("should return filing date page when filing date is on the configured period after due date", async () => {
    const dummyCompanyProfile: ExtensionsCompanyProfile = mockUtils.getDummyCompanyProfile(false, true);
    dummyCompanyProfile.accountingPeriodEndOn = new Date(2021,1,1,0,0,0).toDateString();
    dummyCompanyProfile.accountsDue = new Date(2022,1,1,0,0,0).toUTCString();
    mockCompanyProfile.mockResolvedValue(dummyCompanyProfile);

    const res = await request(app).post(EXTENSIONS_CONFIRM_COMPANY)
      .set("referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`]);

    expect(res.header.location).toEqual(pageURLs.EXTENSIONS_AFTER_TWELVE_MONTHS);
    expect(res.status).toEqual(302);
  });

  it("should not return filing date page when filing date is before configured period after due date", async () => {
    const dummyCompanyProfile: ExtensionsCompanyProfile = mockUtils.getDummyCompanyProfile(false, true);
    dummyCompanyProfile.accountingPeriodEndOn = new Date(2021,1,2,0,0,0).toDateString();
    dummyCompanyProfile.accountsDue = new Date(2022,1,1,0,0,0).toUTCString();
    mockCompanyProfile.mockResolvedValue(dummyCompanyProfile);

    const res = await request(app).post(EXTENSIONS_CONFIRM_COMPANY)
      .set("referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`]);

    expect(res.header.location).toEqual(pageURLs.EXTENSIONS_CHOOSE_REASON);
    expect(res.status).toEqual(302);
  });
}); 


