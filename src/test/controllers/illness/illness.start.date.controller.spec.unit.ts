import app from "../../../app";
import * as request from "supertest";
import * as PageURLs from "../../../model/page.urls";
import {COOKIE_NAME} from "../../../session/config";
import * as moment from "moment";
import {EXTENSIONS_CONTINUED_ILLNESS} from "../../../model/page.urls";
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
const ILLNESS_START_DATE_FUTURE: string = "Start date must be today or in the past";
const ILLNESS_START_DATE_TITLE: string = "When did the illness start";

const REASON_ID: string = "abc-123";

beforeEach( () => {
  mockCacheService.prototype.constructor.mockImplementation(fullDummySession);
  mockUpdateReason.mockClear();
  mockUpdateReason.mockRestore();
});

describe("illness start date url tests", () => {

  it("should find illness start date page with get", async () => {
    const res = await request(app)
      .get(PageURLs.EXTENSIONS_ILLNESS_START_DATE)
      .set("Referer", "/test")
      .set("Cookie", [`${COOKIE_NAME}=123`]);
    expect(res.status).toEqual(200);
    expect(res.text).toContain(ILLNESS_START_DATE_TITLE);
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
        "page_history": {"page_history": ["/test"]},
        "signin_info": {
          "access_token": {"access_token": "KGGGUYUYJHHVK1234"},
          "signed_in": 1,
          "user_profile": {"email": "demo@ch.gov.uk"}
        }
      }
    });
  });

  it("should find illness start date page with get calls api when reason id is added for change", async () => {
    const res = await request(app)
      .get(PageURLs.EXTENSIONS_ILLNESS_START_DATE + "?reasonId=" + REASON_ID)
      .set("Referer", "/test")
      .set("Cookie", [`${COOKIE_NAME}=123`]);
    expect(res.status).toEqual(200);
    expect(res.text).toContain(ILLNESS_START_DATE_TITLE);
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
        "page_history": {"page_history": ["/test"]},
        "signin_info": {
          "access_token": {"access_token": "KGGGUYUYJHHVK1234"},
          "signed_in": 1,
          "user_profile": {"email": "demo@ch.gov.uk"}
        }
      }
    });
  });

  it("should return 404 for start date page with put", async () => {
    const res = await request(app)
      .put(PageURLs.EXTENSIONS_ILLNESS_START_DATE)
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`]);
    expect(res.status).toEqual(404);
  });
});

describe("illness start date validation tests", () => {

  it("should show 1 error if start date day, month and year are missing", async () => {
    const res = await request(app)
      .post(PageURLs.EXTENSIONS_ILLNESS_START_DATE)
      .set("Accept", "application/json")
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`])
      .send({"illness-start-day": "", "illness-start-month": "", "illness-start-year": ""});
    expect(res.status).toEqual(200);
    expect(res.text).toContain(FULL_DATE_MISSING);
    expect(res.text).not.toContain(DAY_MISSING);
    expect(res.text).not.toContain(MONTH_MISSING);
    expect(res.text).not.toContain(YEAR_MISSING);
    expect(mockUpdateReason).not.toHaveBeenCalled();
  });

  it("should show error if start date day is missing", async () => {
    const res = await request(app)
      .post(PageURLs.EXTENSIONS_ILLNESS_START_DATE)
      .set("Accept", "application/json")
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`])
      .send({"illness-start-day": "", "illness-start-month": "02", "illness-start-year": "2016"});
    expect(res.status).toEqual(200);
    expect(res.text).toContain(DAY_MISSING);
    expect(res.text).not.toContain(MONTH_MISSING);
    expect(res.text).not.toContain(YEAR_MISSING);
    expect(mockUpdateReason).not.toHaveBeenCalled();
  });

  it("should show error if start date day and month are missing", async () => {
    const res = await request(app)
      .post(PageURLs.EXTENSIONS_ILLNESS_START_DATE)
      .set("Accept", "application/json")
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`])
      .send({"illness-start-day": "", "illness-start-month": "", "illness-start-year": "2016"});
    expect(res.status).toEqual(200);
    expect(res.text).toContain(DAY_AND_MONTH_MISSING);
    expect(res.text).not.toContain(MONTH_MISSING);
    expect(res.text).not.toContain(YEAR_MISSING);
    expect(mockUpdateReason).not.toHaveBeenCalled();
  });

  it("should show error if start date day and year are missing", async () => {
    const res = await request(app)
      .post(PageURLs.EXTENSIONS_ILLNESS_START_DATE)
      .set("Accept", "application/json")
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`])
      .send({"illness-start-day": "", "illness-start-month": "10", "illness-start-year": ""});
    expect(res.status).toEqual(200);
    expect(res.text).toContain(DAY_AND_YEAR_MISSING);
    expect(res.text).not.toContain(MONTH_MISSING);
    expect(res.text).not.toContain(YEAR_MISSING);
    expect(mockUpdateReason).not.toHaveBeenCalled();
  });

  it("should show error if start date month is missing", async () => {
    const res = await request(app)
      .post(PageURLs.EXTENSIONS_ILLNESS_START_DATE)
      .set("Accept", "application/json")
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`])
      .send({"illness-start-day": "11", "illness-start-month": "", "illness-start-year": "2016"});
    expect(res.status).toEqual(200);
    expect(res.text).not.toContain(DAY_MISSING);
    expect(res.text).toContain(MONTH_MISSING);
    expect(res.text).not.toContain(YEAR_MISSING);
    expect(mockUpdateReason).not.toHaveBeenCalled();
  });

  it("should show error if start date month and year are missing", async () => {
    const res = await request(app)
      .post(PageURLs.EXTENSIONS_ILLNESS_START_DATE)
      .set("Accept", "application/json")
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`])
      .send({"illness-start-day": "10", "illness-start-month": "", "illness-start-year": ""});
    expect(res.status).toEqual(200);
    expect(res.text).toContain(MONTH_AND_YEAR_MISSING);
    expect(res.text).not.toContain(DAY_MISSING);
    expect(res.text).not.toContain(YEAR_MISSING);
    expect(mockUpdateReason).not.toHaveBeenCalled();
  });

  it("should show error if start date year is missing", async () => {
    const res = await request(app)
      .post(PageURLs.EXTENSIONS_ILLNESS_START_DATE)
      .set("Accept", "application/json")
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`])
      .send({"illness-start-day": "11", "illness-start-month": "11", "illness-start-year": ""});
    expect(res.status).toEqual(200);
    expect(res.text).not.toContain(DAY_MISSING);
    expect(res.text).not.toContain(MONTH_MISSING);
    expect(res.text).toContain(YEAR_MISSING);
    expect(mockUpdateReason).not.toHaveBeenCalled();
  });

  it("should show error message if date is not a valid date", async () => {
    const res = await request(app)
      .post(PageURLs.EXTENSIONS_ILLNESS_START_DATE)
      .set("Accept", "application/json")
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`])
      .send({"illness-start-day": "31", "illness-start-month": "06", "illness-start-year": "2018"});
    expect(res.status).toEqual(200);
    expect(res.text).toContain(DATE_INVALID);
    expect(mockUpdateReason).not.toHaveBeenCalled();
  });

  it("should show error message if date is not a valid date (leap year)", async () => {
    const res = await request(app)
      .post(PageURLs.EXTENSIONS_ILLNESS_START_DATE)
      .set("Accept", "application/json")
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`])
      .send({"illness-start-day": "29", "illness-start-month": "2", "illness-start-year": "2015"});
    expect(res.status).toEqual(200);
    expect(res.text).toContain(DATE_INVALID);
    expect(mockUpdateReason).not.toHaveBeenCalled();
  });

  it("should not show error message if date is a valid date (leap year)", async () => {
    const res = await request(app)
      .post(PageURLs.EXTENSIONS_ILLNESS_START_DATE)
      .set("Accept", "application/json")
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`])
      .send({"illness-start-day": "29", "illness-start-month": "2", "illness-start-year": "2016"});
    expect(res.status).toEqual(302);
    expect(res.text).not.toContain(DATE_INVALID);
    const dummySession = fullDummySession();
    expect(mockUpdateReason).toHaveBeenCalledWith(dummySession, {
      start_on: "2016-02-29",
    });
  });

  it("should show error message if date contains invalid chars", async () => {
    const res = await request(app)
      .post(PageURLs.EXTENSIONS_ILLNESS_START_DATE)
      .set("Accept", "application/json")
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`])
      .send({"illness-start-day": "aa", "illness-start-month": "bb", "illness-start-year": "cc"});
    expect(res.status).toEqual(200);
    expect(res.text).toContain(DATE_INVALID);
    expect(mockUpdateReason).not.toHaveBeenCalled();
  });

  it("should show error message if date is in the future", async () => {
    const res = await request(app)
      .post(PageURLs.EXTENSIONS_ILLNESS_START_DATE)
      .set("Accept", "application/json")
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`])
      .send({"illness-start-day": "11", "illness-start-month": "05", "illness-start-year": "9999"});
    expect(res.status).toEqual(200);
    expect(res.text).toContain(ILLNESS_START_DATE_FUTURE);
    expect(mockUpdateReason).not.toHaveBeenCalled();
  });

  it("should not show error message if date is today", async () => {
    const now = moment();

    const res = await request(app)
      .post(PageURLs.EXTENSIONS_ILLNESS_START_DATE)
      .set("Accept", "application/json")
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`])
      .send({
        "illness-start-day": now.format("DD"),
        "illness-start-month": now.format("MM"),
        "illness-start-year": now.format("YYYY")
      });
    expect(res.status).toEqual(302);
    expect(res.text).not.toContain(ILLNESS_START_DATE_FUTURE);
    expect(res.header.location).toEqual(EXTENSIONS_CONTINUED_ILLNESS);
    expect(mockUpdateReason).toHaveBeenCalled();
  });

  it("should not show error message if date is in the past", async () => {
    const res = await request(app)
      .post(PageURLs.EXTENSIONS_ILLNESS_START_DATE)
      .set("Accept", "application/json")
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`])
      .send({"illness-start-day": "11", "illness-start-month": "05", "illness-start-year": "1999"});
    expect(res.status).toEqual(302);
    expect(res.text).not.toContain(ILLNESS_START_DATE_FUTURE);
    const dummySession = fullDummySession();
    expect(mockUpdateReason).toHaveBeenCalledWith(dummySession, {
      start_on: "1999-05-11",
    });
  });

  it("should not show error message if date is in the past with single digit day and month", async () => {
    const res = await request(app)
      .post(PageURLs.EXTENSIONS_ILLNESS_START_DATE)
      .set("Accept", "application/json")
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`])
      .send({"illness-start-day": "3", "illness-start-month": "5", "illness-start-year": "1999"});
    expect(res.status).toEqual(302);
    expect(res.text).not.toContain(ILLNESS_START_DATE_FUTURE);

    const dummySession = fullDummySession();
    expect(mockUpdateReason).toHaveBeenCalledWith(dummySession, {
      start_on: "1999-05-03",
    });
  });
});
