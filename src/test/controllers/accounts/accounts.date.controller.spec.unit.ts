import app from "../../../app";
import * as request from "supertest";
import * as PageURLs from "../../../model/page.urls";
import {COOKIE_NAME} from "../../../session/config";
import * as moment from "moment";
import {EXTENSIONS_ACCOUNTS_INFORMATION} from "../../../model/page.urls";
import {loadSession} from "../../../services/redis.service";
import {fullDummySession} from "../../mock.utils";
import {updateReason} from "../../../services/reason.service";
import * as reasonService from "../../../services/reason.service";

jest.mock("../../../services/redis.service");
jest.mock("../../../services/reason.service");
jest.mock("../../../client/apiclient");

const mockCacheService = (<unknown>loadSession as jest.Mock<typeof loadSession>);
const mockUpdateReason = (<unknown>updateReason as jest.Mock<typeof updateReason>);
const mockGetCurrentReason = (<unknown>reasonService.getCurrentReason as jest.Mock<typeof reasonService.getCurrentReason>);

const FULL_DATE_MISSING: string = "Enter a date";
const DAY_MISSING: string = "Enter a day";
const DAY_AND_MONTH_MISSING = "Enter a day and a month";
const DAY_AND_YEAR_MISSING = "Enter a day and a year";
const MONTH_MISSING: string = "Enter a month";
const MONTH_AND_YEAR_MISSING: string = "Enter a month and a year";
const YEAR_MISSING: string = "Enter a year";
const DATE_INVALID: string = "Enter a real date";
const DATE_FUTURE: string = "Date must be today or in the past";
const DATE_TITLE: string = "When did the accounting issue happen?";

const REASON_ID: string = "abc-123";

beforeEach( () => {
  mockCacheService.prototype.constructor.mockImplementation(fullDummySession);
  mockUpdateReason.mockClear();
  mockUpdateReason.mockRestore();
  mockGetCurrentReason.mockClear();
});

describe("accounting issue date url tests", () => {

  it("should find accounts date page with get", async () => {
    const res = await request(app)
      .get(PageURLs.EXTENSIONS_REASON_ACCOUNTING_ISSUE)
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`]);
    expect(res.status).toEqual(200);
    expect(res.text).toContain(DATE_TITLE);
    expect(mockGetCurrentReason).toBeCalledWith({
      "_cookieId": "cookie",
      "_data": {
        "extension_session": {
          "company_in_context": "00006400",
          "extension_requests": [
            {
              "company_number": "00006400",
              "extension_request_id": "request1",
              "reason_in_context_string": "reason1"
            }
          ]
        },
        "page_history": {"page_history": ["/"]},
        "signin_info": {
          "access_token": {"access_token": "KGGGUYUYJHHVK1234"},
          "signed_in": 1,
          "user_profile": {"email": "demo@ch.gov.uk"}
        }
      }
    });
  });

  it("should find accounts date page with get calls api when reason id is added for change", async () => {
    const res = await request(app)
      .get(PageURLs.EXTENSIONS_REASON_ACCOUNTING_ISSUE + "?reasonId=" + REASON_ID)
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`]);
    expect(res.status).toEqual(200);
    expect(res.text).toContain(DATE_TITLE);
    expect(mockGetCurrentReason).toBeCalledWith({
      "_cookieId": "cookie",
      "_data": {
        "extension_session": {
          "company_in_context": "00006400",
          "extension_requests": [
            {
              "company_number": "00006400",
              "extension_request_id": "request1",
              "reason_in_context_string": "abc-123"
            }
          ]
        },
        "page_history": {"page_history": ["/"]},
        "signin_info": {
          "access_token": {"access_token": "KGGGUYUYJHHVK1234"},
          "signed_in": 1,
          "user_profile": {"email": "demo@ch.gov.uk"}
        }
      }
    });
  });

  it("should return 404 for accounts date page with put", async () => {
    const res = await request(app)
      .put(PageURLs.EXTENSIONS_REASON_ACCOUNTING_ISSUE)
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`]);
    expect(res.status).toEqual(404);
  });

  it("should return 500 when missing session data", async () => {
    mockGetCurrentReason.mockImplementation(() => {
      throw new Error("invalid session data when processing reason");
    });
    const res = await request(app)
      .get(PageURLs.EXTENSIONS_REASON_ACCOUNTING_ISSUE)
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`]);
    expect(res.status).toEqual(500);
    expect(mockGetCurrentReason).toBeCalledWith({
      "_cookieId": "cookie",
      "_data": {
        "extension_session": {
          "company_in_context": "00006400",
          "extension_requests": [
            {
              "company_number": "00006400",
              "extension_request_id": "request1",
              "reason_in_context_string": "reason1"
            }
          ]
        },
        "page_history": {"page_history": ["/"]},
        "signin_info": {
          "access_token": {"access_token": "KGGGUYUYJHHVK1234"},
          "signed_in": 1,
          "user_profile": {"email": "demo@ch.gov.uk"}
        }
      }
    });
  });
});

describe("accounts date validation tests", () => {

  it("should show 1 error if accounting issue date day, month and year are missing", async () => {
    const res = await request(app)
      .post(PageURLs.EXTENSIONS_REASON_ACCOUNTING_ISSUE)
      .set("Accept", "application/json")
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`])
      .send({"accounts-date-day": "", "accounts-date-month": "", "accounts-date-year": ""});
    expect(res.status).toEqual(200);
    expect(res.text).toContain(FULL_DATE_MISSING);
    expect(res.text).not.toContain(DAY_MISSING);
    expect(res.text).not.toContain(MONTH_MISSING);
    expect(res.text).not.toContain(YEAR_MISSING);
    expect(mockUpdateReason).not.toHaveBeenCalled();
  });

  it("should show error if accounting issue date day is missing", async () => {
    const res = await request(app)
      .post(PageURLs.EXTENSIONS_REASON_ACCOUNTING_ISSUE)
      .set("Accept", "application/json")
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`])
      .send({"accounts-date-day": "", "accounts-date-month": "02", "accounts-date-year": "2016"});
    expect(res.status).toEqual(200);
    expect(res.text).toContain(DAY_MISSING);
    expect(res.text).not.toContain(MONTH_MISSING);
    expect(res.text).not.toContain(YEAR_MISSING);
    expect(mockUpdateReason).not.toHaveBeenCalled();
  });

  it("should show error if accounting issue date day and month is missing", async () => {
    const res = await request(app)
      .post(PageURLs.EXTENSIONS_REASON_ACCOUNTING_ISSUE)
      .set("Accept", "application/json")
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`])
      .send({"accounts-date-day": "", "accounts-date-month": "", "accounts-date-year": "2016"});
    expect(res.status).toEqual(200);
    expect(res.text).toContain(DAY_AND_MONTH_MISSING);
    expect(res.text).not.toContain(MONTH_MISSING);
    expect(res.text).not.toContain(YEAR_MISSING);
    expect(mockUpdateReason).not.toHaveBeenCalled();
  });

  it("should show error if accounting issue date day and year is missing", async () => {
    const res = await request(app)
      .post(PageURLs.EXTENSIONS_REASON_ACCOUNTING_ISSUE)
      .set("Accept", "application/json")
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`])
      .send({"accounts-date-day": "", "accounts-date-month": "02", "accounts-date-year": ""});
    expect(res.status).toEqual(200);
    expect(res.text).toContain(DAY_AND_YEAR_MISSING);
    expect(res.text).not.toContain(MONTH_MISSING);
    expect(res.text).not.toContain(YEAR_MISSING);
    expect(mockUpdateReason).not.toHaveBeenCalled();
  });

  it("should show error if accounting issue date month is missing", async () => {
    const res = await request(app)
      .post(PageURLs.EXTENSIONS_REASON_ACCOUNTING_ISSUE)
      .set("Accept", "application/json")
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`])
      .send({"accounts-date-day": "11", "accounts-date-month": "", "accounts-date-year": "2016"});
    expect(res.status).toEqual(200);
    expect(res.text).not.toContain(DAY_MISSING);
    expect(res.text).toContain(MONTH_MISSING);
    expect(res.text).not.toContain(YEAR_MISSING);
    expect(mockUpdateReason).not.toHaveBeenCalled();
  });

  it("should show error if accounting issue date month and year is missing", async () => {
    const res = await request(app)
      .post(PageURLs.EXTENSIONS_REASON_ACCOUNTING_ISSUE)
      .set("Accept", "application/json")
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`])
      .send({"accounts-date-day": "11", "accounts-date-month": "", "accounts-date-year": ""});
    expect(res.status).toEqual(200);
    expect(res.text).toContain(MONTH_AND_YEAR_MISSING);
    expect(res.text).not.toContain(DAY_MISSING);
    expect(res.text).not.toContain(YEAR_MISSING);
    expect(mockUpdateReason).not.toHaveBeenCalled();
  });

  it("should show error if accounting issue date year is missing", async () => {
    const res = await request(app)
      .post(PageURLs.EXTENSIONS_REASON_ACCOUNTING_ISSUE)
      .set("Accept", "application/json")
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`])
      .send({"accounts-date-day": "11", "accounts-date-month": "11", "accounts-date-year": ""});
    expect(res.status).toEqual(200);
    expect(res.text).not.toContain(DAY_MISSING);
    expect(res.text).not.toContain(MONTH_MISSING);
    expect(res.text).toContain(YEAR_MISSING);
    expect(mockUpdateReason).not.toHaveBeenCalled();
  });

  it("should show error message if date is not a valid date", async () => {
    const res = await request(app)
      .post(PageURLs.EXTENSIONS_REASON_ACCOUNTING_ISSUE)
      .set("Accept", "application/json")
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`])
      .send({"accounts-date-day": "31", "accounts-date-month": "06", "accounts-date-year": "2018"});
    expect(res.status).toEqual(200);
    expect(res.text).toContain(DATE_INVALID);
    expect(mockUpdateReason).not.toHaveBeenCalled();
  });

  it("should show error message if date is not a valid date (leap year)", async () => {
    const res = await request(app)
      .post(PageURLs.EXTENSIONS_REASON_ACCOUNTING_ISSUE)
      .set("Accept", "application/json")
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`])
      .send({"accounts-date-day": "29", "accounts-date-month": "2", "accounts-date-year": "2015"});
    expect(res.status).toEqual(200);
    expect(res.text).toContain(DATE_INVALID);
    expect(mockUpdateReason).not.toHaveBeenCalled();
  });

  it("should not show error message if date is a valid date (leap year)", async () => {
    const res = await request(app)
      .post(PageURLs.EXTENSIONS_REASON_ACCOUNTING_ISSUE)
      .set("Accept", "application/json")
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`])
      .send({"accounts-date-day": "29", "accounts-date-month": "2", "accounts-date-year": "2016"});
    expect(res.status).toEqual(302);
    expect(res.text).not.toContain(DATE_INVALID);
    const dummySession = fullDummySession();
    expect(mockUpdateReason).toHaveBeenCalledWith(dummySession, {
      start_on: "2016-02-29",
    });
  });

  it("should show error message if date contains invalid chars", async () => {
    const res = await request(app)
      .post(PageURLs.EXTENSIONS_REASON_ACCOUNTING_ISSUE)
      .set("Accept", "application/json")
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`])
      .send({"accounts-date-day": "aa", "accounts-date-month": "bb", "accounts-date-year": "cc"});
    expect(res.status).toEqual(200);
    expect(res.text).toContain(DATE_INVALID);
    expect(mockUpdateReason).not.toHaveBeenCalled();
  });

  it("should show error message if date is in the future", async () => {
    const res = await request(app)
      .post(PageURLs.EXTENSIONS_REASON_ACCOUNTING_ISSUE)
      .set("Accept", "application/json")
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`])
      .send({"accounts-date-day": "11", "accounts-date-month": "05", "accounts-date-year": "9999"});
    expect(res.status).toEqual(200);
    expect(res.text).toContain(DATE_FUTURE);
    expect(mockUpdateReason).not.toHaveBeenCalled();
  });

  it("should not show error message if date is today", async () => {
    const now = moment();

    const res = await request(app)
      .post(PageURLs.EXTENSIONS_REASON_ACCOUNTING_ISSUE)
      .set("Accept", "application/json")
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`])
      .send({
        "accounts-date-day": now.format("DD"),
        "accounts-date-month": now.format("MM"),
        "accounts-date-year": now.format("YYYY")
      });
    expect(res.status).toEqual(302);
    expect(res.text).not.toContain(DATE_FUTURE);
    expect(res.header.location).toEqual(EXTENSIONS_ACCOUNTS_INFORMATION);
    expect(mockUpdateReason).toHaveBeenCalled();
  });

  it("should not show error message if date is in the past", async () => {
    const res = await request(app)
      .post(PageURLs.EXTENSIONS_REASON_ACCOUNTING_ISSUE)
      .set("Accept", "application/json")
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`])
      .send({"accounts-date-day": "11", "accounts-date-month": "05", "accounts-date-year": "1999"});
    expect(res.status).toEqual(302);
    expect(res.text).not.toContain(DATE_FUTURE);
    const dummySession = fullDummySession();
    expect(mockUpdateReason).toHaveBeenCalledWith(dummySession, {
      start_on: "1999-05-11",
    });
  });

  it("should not show error message if date is in the past with single digit day and month", async () => {
    const res = await request(app)
      .post(PageURLs.EXTENSIONS_REASON_ACCOUNTING_ISSUE)
      .set("Accept", "application/json")
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`])
      .send({"accounts-date-day": "3", "accounts-date-month": "5", "accounts-date-year": "1999"});
    expect(res.status).toEqual(302);
    expect(res.text).not.toContain(DATE_FUTURE);

    const dummySession = fullDummySession();
    expect(mockUpdateReason).toHaveBeenCalledWith(dummySession, {
      start_on: "1999-05-03",
    });
  });
});
