import app from "../../app";
import * as request from "supertest";
import {ExtensionsCompanyProfile, getCompanyProfile} from "../../client/apiclient";
import {COOKIE_NAME} from "../../session/config";
import * as pageURLs from "../../model/page.urls";
import * as mockUtils from "../mock.utils";
import {loadSession} from "../../services/redis.service";

jest.mock("../../services/redis.service");
jest.mock("../../client/api.enumerations");
jest.mock("../../client/apiclient");

const COMPANY_NUMBER = "00006400";
const NO_COMPANY_NUMBER_SUPPLIED = "No company number supplied";
const INVALID_COMPANY_NUMBER = "Invalid company number";
const COMPANY_NUMBER_TOO_LONG = "Company number too long";
const COMPANY_NUMBER_NOT_FOUND: string = "Company number not found";

const mockCompanyProfile: jest.Mock = (<unknown>getCompanyProfile as jest.Mock<typeof getCompanyProfile>);
const mockCacheService = (<unknown>loadSession as jest.Mock<typeof loadSession>);

beforeEach(() => {
  mockCompanyProfile.mockRestore();
  mockCacheService.mockRestore();

  mockUtils.loadMockSession(mockCacheService);
});

describe("company number validation tests", () => {

  it("should display company details for a valid company number", async() => {
    mockCompanyProfile.mockResolvedValue(mockUtils.getDummyCompanyProfile(true, true));

    const response = await request(app)
      .post(pageURLs.EXTENSIONS_COMPANY_NUMBER)
      .set("Accept", "application/json")
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`])
      .send({companyNumber: COMPANY_NUMBER});

    expect(response.header.location).toEqual(pageURLs.EXTENSIONS_CONFIRM_COMPANY);
    expect(response.status).toEqual(302);
    expect(mockCompanyProfile).toHaveBeenCalledWith(COMPANY_NUMBER, mockUtils.ACCESS_TOKEN);
  });

  it("should display company details for a valid company number - NOT overdue (padded number)", async() => {
    mockCompanyProfile.mockResolvedValue(mockUtils.getDummyCompanyProfile(false, true));

    const response = await request(app)
      .post(pageURLs.EXTENSIONS_COMPANY_NUMBER)
      .set("Accept", "application/json")
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`])
      .send({companyNumber: "6400"});

    expect(response.header.location).toEqual(pageURLs.EXTENSIONS_CONFIRM_COMPANY);
    expect(response.status).toEqual(302);
    expect(mockCompanyProfile).toHaveBeenCalledWith(COMPANY_NUMBER, mockUtils.ACCESS_TOKEN);
  });

  it("should pass validation using a company number with whitespace", async() => {
    mockCompanyProfile.mockResolvedValue(mockUtils.getDummyCompanyProfile(true, true));

    const response = await request(app)
      .post(pageURLs.EXTENSIONS_COMPANY_NUMBER)
      .set("Accept", "application/json")
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`])
      .send({companyNumber: " 00 00 6400  "});

    expect(response.header.location).toEqual(pageURLs.EXTENSIONS_CONFIRM_COMPANY);
    expect(response.status).toEqual(302);
    expect(mockCompanyProfile).toBeCalledWith(COMPANY_NUMBER, mockUtils.ACCESS_TOKEN);
  });

  it("should pass validation using a company number with 2 leading letters", async() => {
    mockCompanyProfile.mockResolvedValue(mockUtils.getDummyCompanyProfile(true, true));

    const response = await request(app)
      .post(pageURLs.EXTENSIONS_COMPANY_NUMBER)
      .set("Accept", "application/json")
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`])
      .send({companyNumber: "SC100079"});

    expect(response.header.location).toEqual(pageURLs.EXTENSIONS_CONFIRM_COMPANY);
    expect(response.status).toEqual(302);
    expect(mockCompanyProfile).toBeCalledWith("SC100079", mockUtils.ACCESS_TOKEN);
  });

  it("should pass validation using a company number with 2 leading letters (padded)", async() => {
    mockCompanyProfile.mockResolvedValue(mockUtils.getDummyCompanyProfile(true, true));

    const response = await request(app)
      .post(pageURLs.EXTENSIONS_COMPANY_NUMBER)
      .set("Accept", "application/json")
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`])
      .send({companyNumber: "SC79"});

    expect(response.header.location).toEqual(pageURLs.EXTENSIONS_CONFIRM_COMPANY);
    expect(response.status).toEqual(302);
    expect(mockCompanyProfile).toBeCalledWith("SC000079", mockUtils.ACCESS_TOKEN);
  });

  it("should pass validation using a company number with 1 leading letter", async() => {
    const response = await request(app)
      .post(pageURLs.EXTENSIONS_COMPANY_NUMBER)
      .set("Accept", "application/json")
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`])
      .send({companyNumber: "R1000079"});

    expect(mockCompanyProfile).toBeCalledWith("R1000079", mockUtils.ACCESS_TOKEN);
  });

  it("should pass validation using a company number with 1 leading letter (padded)", async() => {
    const response = await request(app)
      .post(pageURLs.EXTENSIONS_COMPANY_NUMBER)
      .set("Accept", "application/json")
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`])
      .send({companyNumber: "R79"});

    expect(mockCompanyProfile).toBeCalledWith("R0000079", mockUtils.ACCESS_TOKEN);
  });

  it("should create an error message when no company number is supplied (empty string)", async() => {
    const response = await request(app)
      .post(pageURLs.EXTENSIONS_COMPANY_NUMBER)
      .set("Accept", "application/json")
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`])
      .send({companyNumber: ""});

    expect(response.status).toEqual(200);
    expect(response).not.toBeUndefined();

    expect(response.text).toContain(NO_COMPANY_NUMBER_SUPPLIED);
    expect(response.text).not.toContain(INVALID_COMPANY_NUMBER);
    expect(response.text).not.toContain(COMPANY_NUMBER_TOO_LONG);
  });

  it("should create an error message when no company number is supplied (spaces)", async() => {
    const response = await request(app)
      .post(pageURLs.EXTENSIONS_COMPANY_NUMBER)
      .set("Accept", "application/json")
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`])
      .send({companyNumber: "    "});

    expect(response.status).toEqual(200);
    expect(response).not.toBeUndefined();
    expect(response.text).toContain(NO_COMPANY_NUMBER_SUPPLIED);
    expect(response.text).not.toContain(INVALID_COMPANY_NUMBER);
    expect(response.text).not.toContain(COMPANY_NUMBER_TOO_LONG);
  });

  it("should create an error message when company number is invalid (characters)", async() => {
    const response = await request(app)
      .post(pageURLs.EXTENSIONS_COMPANY_NUMBER)
      .set("Accept", "application/json")
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`])
      .send({companyNumber: "asdfg!!@"});

    expect(response.status).toEqual(200);
    expect(response).not.toBeUndefined();
    expect(response.text).not.toContain(NO_COMPANY_NUMBER_SUPPLIED);
    expect(response.text).toContain(INVALID_COMPANY_NUMBER);
    expect(response.text).not.toContain(COMPANY_NUMBER_TOO_LONG);
  });

  it("should create an error message when company number is not found", async() => {
    mockCompanyProfile.mockImplementation(() => {
      throw {
        message: COMPANY_NUMBER_NOT_FOUND,
        status: 404
      }
    });
    const response = await request(app)
      .post(pageURLs.EXTENSIONS_COMPANY_NUMBER)
      .set("Accept", "application/json")
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`])
      .send({companyNumber: "00012345"});

    expect(response.status).toEqual(200);
    expect(response).not.toBeUndefined();
    expect(response.text).not.toContain(NO_COMPANY_NUMBER_SUPPLIED);
    expect(response.text).not.toContain(INVALID_COMPANY_NUMBER);
    expect(response.text).not.toContain(COMPANY_NUMBER_TOO_LONG);
    expect(response.text).toContain(COMPANY_NUMBER_NOT_FOUND);
  });

  it("should create an error message when company number is too long", async() => {
    const response = await request(app)
      .post(pageURLs.EXTENSIONS_COMPANY_NUMBER)
      .set("Accept", "application/json")
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`])
      .send({companyNumber: "000064000"});

    expect(response.status).toEqual(200);
    expect(response).not.toBeUndefined();
    expect(response.text).not.toContain(NO_COMPANY_NUMBER_SUPPLIED);
    expect(response.text).not.toContain(INVALID_COMPANY_NUMBER);
    expect(response.text).toContain(COMPANY_NUMBER_TOO_LONG);
  });
});

describe("Too Soon To Apply tests", () => {
  it("should redirect to the too soon screen if due date too far in future", async() => {
    const companyProfileTooEarly: ExtensionsCompanyProfile = mockUtils.getDummyCompanyProfile(false, true);
    const tooEarlyAccountsDueDate: Date = new Date(Date.now());
    tooEarlyAccountsDueDate.setDate(
      tooEarlyAccountsDueDate.getDate() + Number(process.env.TOO_SOON_DAYS_BEFORE_DUE_DATE) + 1);

    companyProfileTooEarly.accountsDue = tooEarlyAccountsDueDate.toDateString();
    mockCompanyProfile.mockResolvedValue(companyProfileTooEarly);

    const response = await request(app)
      .post(pageURLs.EXTENSIONS_COMPANY_NUMBER)
      .set("Accept", "application/json")
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`])
      .send({companyNumber: "6400"});

    expect(response.header.location).toEqual(pageURLs.EXTENSIONS_TOO_SOON);
    expect(response.status).toEqual(302);
    expect(mockCompanyProfile).toHaveBeenCalledWith(COMPANY_NUMBER, mockUtils.ACCESS_TOKEN);
  });

  it("should redirect to the confirm company screen if due date is exactly the number " +
    "of days away specified in config", async() => {
    const companyProfileTooEarly: ExtensionsCompanyProfile = mockUtils.getDummyCompanyProfile(false, true);
    const exactlyOnLimitAccountsDueDate: Date = new Date(Date.now());
    exactlyOnLimitAccountsDueDate.setDate(
      exactlyOnLimitAccountsDueDate.getDate() + Number(process.env.TOO_SOON_DAYS_BEFORE_DUE_DATE));

    companyProfileTooEarly.accountsDue = exactlyOnLimitAccountsDueDate.toDateString();

    mockCompanyProfile.mockResolvedValue(companyProfileTooEarly);

    const response = await request(app)
      .post(pageURLs.EXTENSIONS_COMPANY_NUMBER)
      .set("Accept", "application/json")
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`])
      .send({companyNumber: "6400"});

    expect(response.header.location).toEqual(pageURLs.EXTENSIONS_CONFIRM_COMPANY);
    expect(response.status).toEqual(302);
    expect(mockCompanyProfile).toHaveBeenCalledWith(COMPANY_NUMBER, mockUtils.ACCESS_TOKEN);
  });

  it("should redirect to the confirm company screen if due date is within the number " +
    "of days away specified in config", async() => {
    const companyProfileTooEarly: ExtensionsCompanyProfile = mockUtils.getDummyCompanyProfile(false, true);
    const withinLimitAccountsDueDate: Date = new Date(Date.now());
    withinLimitAccountsDueDate.setDate(
      withinLimitAccountsDueDate.getDate() + (Number(process.env.TOO_SOON_DAYS_BEFORE_DUE_DATE) - 1));

    companyProfileTooEarly.accountsDue = withinLimitAccountsDueDate.toDateString();

    mockCompanyProfile.mockResolvedValue(companyProfileTooEarly);

    const response = await request(app)
      .post(pageURLs.EXTENSIONS_COMPANY_NUMBER)
      .set("Accept", "application/json")
      .set("Cookie", [`${COOKIE_NAME}=123`])
      .set("Referer", "/")
      .send({companyNumber: "6400"});

    expect(response.status).toEqual(302);
    expect(response.header.location).toEqual(pageURLs.EXTENSIONS_CONFIRM_COMPANY);
    expect(mockCompanyProfile).toHaveBeenCalledWith(COMPANY_NUMBER, mockUtils.ACCESS_TOKEN);
  });
});
