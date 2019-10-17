import app from "../../../app";
import * as request from "supertest";
import * as pageURLs from "../../../model/page.urls";
import {COOKIE_NAME} from "../../../session/config";
import * as moment from "moment";
import {loadSession} from "../../../services/redis.service";
import {loadMockSession, fullDummySession} from "../../mock.utils";
import * as pageUrls from "../../../model/page.urls";
import * as reasonService from "../../../services/reason.service";
import {ReasonWeb} from "../../../model/reason/extension.reason.web";

jest.mock("../../../services/redis.service");
jest.mock("../../../client/apiclient");
jest.mock("../../../services/reason.service");

const mockCacheService = (<unknown>loadSession as jest.Mock<typeof loadSession>);
const mockGetCurrentReason = (<unknown>reasonService.getCurrentReason as jest.Mock<typeof reasonService.getCurrentReason>);

const ILLNESS_END_DAY_MISSING: string = "You must enter a day";
const ILLNESS_END_MONTH_MISSING: string = "You must enter a month";
const ILLNESS_END_YEAR_MISSING: string = "You must enter a year";
const ILLNESS_END_DATE_INVALID: string = "Enter a real end date";
const ILLNESS_END_DATE_FUTURE: string = "End date must be today or in the past";
const ILLNESS_END_BEFORE_START_DATE: string = "End date must not precede start date";

const REASON_ID: string = "abc-123";

beforeEach( () => {
  loadMockSession(mockCacheService);
  mockGetCurrentReason.mockClear();
  mockGetCurrentReason.prototype.constructor.mockImplementation((): ReasonWeb => {
    return {
      id: "reason1",
      start_on: "2018-12-12",
      end_on: "2018-12-22"
    } as ReasonWeb;
  });
});

describe("illness end date url tests", () => {

  it("should find illness end date page with get", async () => {
    mockCacheService.prototype.constructor.mockImplementationOnce(fullDummySession);
    const res = await request(app)
      .get(pageURLs.EXTENSIONS_ILLNESS_END_DATE)
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`]);
    expect(res.status).toEqual(200);
  });

  it("should find illness end date page with get calls api when reason id is added for change", async () => {
    mockCacheService.prototype.constructor.mockImplementationOnce(fullDummySession);
    const res = await request(app)
      .get(pageURLs.EXTENSIONS_ILLNESS_END_DATE + "?reasonId=" + REASON_ID)
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`]);
    expect(res.status).toEqual(200);
  });

  it("should return 404 for end date page with put", async () => {
    const res = await request(app)
      .put(pageURLs.EXTENSIONS_ILLNESS_END_DATE)
      .set("Cookie", [`${COOKIE_NAME}=123`]);
    expect(res.status).toEqual(404);
  });
});

describe("illness end date validation tests", () => {

  it("should show 3 errors if end date day, month and year are missing", async () => {
    mockCacheService.prototype.constructor.mockImplementationOnce(fullDummySession);
    const res = await request(app)
      .post(pageURLs.EXTENSIONS_ILLNESS_END_DATE)
      .set("Accept", "application/json")
      .set("Cookie", [`${COOKIE_NAME}=123`]);
    expect(res.status).toEqual(200);
    expect(res.text).toContain(ILLNESS_END_DAY_MISSING);
    expect(res.text).toContain(ILLNESS_END_MONTH_MISSING);
    expect(res.text).toContain(ILLNESS_END_YEAR_MISSING);
  });

  it("should show error if end date day is missing", async () => {
    mockCacheService.prototype.constructor.mockImplementationOnce(fullDummySession);
    const res = await request(app)
      .post(pageURLs.EXTENSIONS_ILLNESS_END_DATE)
      .set("Accept", "application/json")
      .set("Cookie", [`${COOKIE_NAME}=123`])
      .send({"illness-end-day": "", "illness-end-month": "02", "illness-end-year": "2016"});
    expect(res.status).toEqual(200);
    expect(res.text).toContain(ILLNESS_END_DAY_MISSING);
    expect(res.text).not.toContain(ILLNESS_END_MONTH_MISSING);
    expect(res.text).not.toContain(ILLNESS_END_YEAR_MISSING);
    expect(mockGetCurrentReason).toBeCalledTimes(1);
  });

  it("should show error if end date month is missing", async () => {
    mockCacheService.prototype.constructor.mockImplementationOnce(fullDummySession);
    const res = await request(app)
      .post(pageURLs.EXTENSIONS_ILLNESS_END_DATE)
      .set("Accept", "application/json")
      .set("Cookie", [`${COOKIE_NAME}=123`])
      .send({"illness-end-day": "11", "illness-end-month": "", "illness-end-year": "2016"});
    expect(res.status).toEqual(200);
    expect(res.text).not.toContain(ILLNESS_END_DAY_MISSING);
    expect(res.text).toContain(ILLNESS_END_MONTH_MISSING);
    expect(res.text).not.toContain(ILLNESS_END_YEAR_MISSING);
    expect(mockGetCurrentReason).toBeCalledTimes(1);
  });

  it("should show error if end date year is missing", async () => {
    mockCacheService.prototype.constructor.mockImplementationOnce(fullDummySession);
    const res = await request(app)
      .post(pageURLs.EXTENSIONS_ILLNESS_END_DATE)
      .set("Accept", "application/json")
      .set("Cookie", [`${COOKIE_NAME}=123`])
      .send({"illness-end-day": "11", "illness-end-month": "11", "illness-end-year": ""});
    expect(res.status).toEqual(200);
    expect(res.text).not.toContain(ILLNESS_END_DAY_MISSING);
    expect(res.text).not.toContain(ILLNESS_END_MONTH_MISSING);
    expect(res.text).toContain(ILLNESS_END_YEAR_MISSING);
    expect(mockGetCurrentReason).toBeCalledTimes(1);
  });

  it("should show error message if date is not a valid date", async () => {
    mockCacheService.prototype.constructor.mockImplementationOnce(fullDummySession);
    const res = await request(app)
      .post(pageURLs.EXTENSIONS_ILLNESS_END_DATE)
      .set("Accept", "application/json")
      .set("Cookie", [`${COOKIE_NAME}=123`])
      .send({"illness-end-day": "32", "illness-end-month": "11", "illness-end-year": "2018"});
    expect(res.status).toEqual(200);
    expect(res.text).toContain(ILLNESS_END_DATE_INVALID);
    expect(mockGetCurrentReason).toBeCalledTimes(1);
  });

  it("should show error message if date is not a valid date (leap year)", async () => {
    mockCacheService.prototype.constructor.mockImplementationOnce(fullDummySession);
    const res = await request(app)
      .post(pageURLs.EXTENSIONS_ILLNESS_END_DATE)
      .set("Accept", "application/json")
      .set("Cookie", [`${COOKIE_NAME}=123`])
      .send({"illness-end-day": "29", "illness-end-month": "02", "illness-end-year": "2015"});
    expect(res.status).toEqual(200);
    expect(res.text).toContain(ILLNESS_END_DATE_INVALID);
    expect(mockGetCurrentReason).toBeCalledTimes(1);
  });

  it("should not show error message if date is a valid date (leap year)", async () => {
    mockCacheService.prototype.constructor.mockImplementationOnce(fullDummySession);
    mockGetCurrentReason.prototype.constructor.mockImplementationOnce(() => reasonWithStartDate("2015-12-12"));
    const res = await request(app)
      .post(pageURLs.EXTENSIONS_ILLNESS_END_DATE)
      .set("Accept", "application/json")
      .set("Cookie", [`${COOKIE_NAME}=123`])
      .send({"illness-end-day": "29", "illness-end-month": "02", "illness-end-year": "2016"});
    expect(res.status).toEqual(302);
    expect(res.text).not.toContain(ILLNESS_END_DATE_INVALID);
    expect(res.header.location).toEqual(pageUrls.EXTENSIONS_ILLNESS_INFORMATION);
    expect(mockGetCurrentReason).toBeCalledTimes(1);
  });

  it("should show error message if date contains invalid chars", async () => {
    mockCacheService.prototype.constructor.mockImplementationOnce(fullDummySession);
    const res = await request(app)
      .post(pageURLs.EXTENSIONS_ILLNESS_END_DATE)
      .set("Accept", "application/json")
      .set("Cookie", [`${COOKIE_NAME}=123`])
      .send({"illness-end-day": "aa", "illness-end-month": "bb", "illness-end-year": "cc"});
    expect(res.status).toEqual(200);
    expect(res.text).toContain(ILLNESS_END_DATE_INVALID);
    expect(mockGetCurrentReason).toBeCalledTimes(1);
  });

  it("should show error message if date is in the future", async () => {
    mockCacheService.prototype.constructor.mockImplementationOnce(fullDummySession);
    const res = await request(app)
      .post(pageURLs.EXTENSIONS_ILLNESS_END_DATE)
      .set("Accept", "application/json")
      .set("Cookie", [`${COOKIE_NAME}=123`])
      .send({"illness-end-day": "11", "illness-end-month": "05", "illness-end-year": "9999"});
    expect(res.status).toEqual(200);
    expect(res.text).toContain(ILLNESS_END_DATE_FUTURE);
    expect(mockGetCurrentReason).toBeCalledTimes(1);
  });

  it("should not show error message if date is today", async () => {
    mockCacheService.prototype.constructor.mockImplementationOnce(fullDummySession);
    const now = moment();
    const res = await request(app)
      .post(pageURLs.EXTENSIONS_ILLNESS_END_DATE)
      .set("Accept", "application/json")
      .set("Cookie", [`${COOKIE_NAME}=123`])
      .send({
        "illness-end-day": now.format("DD"),
        "illness-end-month": now.format("MM"),
        "illness-end-year": now.format("YYYY")
      });
    expect(res.status).toEqual(302);
    expect(res.text).not.toContain(ILLNESS_END_DATE_FUTURE);
    expect(res.header.location).toEqual(pageUrls.EXTENSIONS_ILLNESS_INFORMATION);
    expect(mockGetCurrentReason).toBeCalledTimes(1);
  });

  it("should not show error message if date is in the past", async () => {
    mockCacheService.prototype.constructor.mockImplementationOnce(fullDummySession);
    mockGetCurrentReason.prototype.constructor.mockImplementationOnce(() => reasonWithStartDate("1998-12-12"));
    const res = await request(app)
      .post(pageURLs.EXTENSIONS_ILLNESS_END_DATE)
      .set("Accept", "application/json")
      .set("Cookie", [`${COOKIE_NAME}=123`])
      .send({"illness-end-day": "11", "illness-end-month": "05", "illness-end-year": "1999"});
      expect(res.status).toEqual(302);
      expect(res.text).not.toContain(ILLNESS_END_DATE_FUTURE);
      expect(res.header.location).toEqual(pageUrls.EXTENSIONS_ILLNESS_INFORMATION);
      expect(mockGetCurrentReason).toBeCalledTimes(1);
  });

  it("should show error message if end date precedes start date", async () => {
    mockCacheService.prototype.constructor.mockImplementationOnce(fullDummySession);
    const res = await request(app)
      .post(pageURLs.EXTENSIONS_ILLNESS_END_DATE)
      .set("Accept", "application/json")
      .set("Cookie", [`${COOKIE_NAME}=123`])
      .send({"illness-end-day": "27", "illness-end-month": "02", "illness-end-year": "2018"});

    expect(res.status).toEqual(200);
    expect(res.text).toContain(ILLNESS_END_BEFORE_START_DATE);
    expect(mockGetCurrentReason).toBeCalledTimes(2);
  });
});

const reasonWithStartDate = (startDate: string) => {
  return {
    items: [{
      id: "reason1",
      start_on: startDate
    }],
  }
}
