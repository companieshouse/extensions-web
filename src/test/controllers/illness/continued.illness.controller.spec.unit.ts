import app from "../../../app";
import * as request from 'supertest';
import * as pageURLs from "../../../model/page.urls";
import {COOKIE_NAME} from "../../../session/config";
import {loadSession} from "../../../services/redis.service";
import {loadMockSession, fullDummySession, sessionWithChangingDetails} from "../../mock.utils";
import * as reasonService from "../../../services/reason.service";
import * as sessionService from "../../../services/session.service";
import {createHistoryIfNone} from "../../../services/session.service";

jest.mock("../../../services/redis.service");
jest.mock("../../../services/reason.service");
jest.mock("../../../services/session.service");
jest.mock("../../../client/apiclient");

const mockCacheService = (<unknown>loadSession as jest.Mock<typeof loadSession>);
const mockSetReasonInContextAsString = (<unknown>sessionService.setReasonInContextAsString as jest.Mock<typeof sessionService.setReasonInContextAsString>);
const mockGetCurrentReason = (<unknown>reasonService.getCurrentReason as jest.Mock<typeof reasonService.getCurrentReason>);
const mockCreateHistoryIfNone = (<unknown>createHistoryIfNone as jest.Mock<typeof createHistoryIfNone>);
const mockUpdateCurrentReason = (<unknown>reasonService.updateReason as jest.Mock<typeof reasonService.updateReason>);

const REASON_ID: string = "abc-123";
const STILL_ILL_ANSWER_NOT_PROVIDED: string =
  "You must tell us if this is a continued illness";

beforeEach(() => {
  mockGetCurrentReason.mockClear();
  loadMockSession(mockCacheService);
  mockGetCurrentReason.prototype.constructor.mockImplementationOnce(() => {
    return {
      items: [{
        id: "reason1",
        start_on: "2018-12-12"
      }],
    }
  });
  mockCreateHistoryIfNone.prototype.constructor.mockImplementation(() => {
    return {
      page_history: [],
    };
  });
  mockUpdateCurrentReason.mockClear();
});

describe("continued illness url tests", () => {
  it("should find continued illness page with get", async () => {
    mockCacheService.prototype.constructor.mockImplementationOnce(fullDummySession);
    const res = await request(app)
      .get(pageURLs.EXTENSIONS_CONTINUED_ILLNESS)
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`]);
    expect(res.status).toEqual(200);
    expect(mockSetReasonInContextAsString).not.toBeCalled();
    expect(mockGetCurrentReason).toBeCalled();
  });

  it("should find continued illness page with existing reason information when reason id is added for change", async () => {
    const res = await request(app)
      .get(pageURLs.EXTENSIONS_CONTINUED_ILLNESS + "?reasonId=" + REASON_ID)
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`]);
    expect(res.status).toEqual(200);
    expect(mockSetReasonInContextAsString).toBeCalled();
    expect(mockGetCurrentReason).toBeCalled();
  });

  it ("should return 404 if continued illness page with put", async () => {
    const res = await request(app)
      .put(pageURLs.EXTENSIONS_CONTINUED_ILLNESS)
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`]);
    expect(res.status).toEqual(404);
  });

  it ("should return 500 if continued illness page with missing session", async () => {
    mockGetCurrentReason.mockRestore();
    mockGetCurrentReason.mockClear();
    mockGetCurrentReason.mockImplementation(() => {
      throw new Error("invalid session data when processing reason");
    });
    const res = await request(app)
      .get(pageURLs.EXTENSIONS_CONTINUED_ILLNESS)
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`]);
    expect(res.status).toEqual(500);
  });
});

describe("continued illness validation tests", () => {

  it("should receive error message when an answer is not provided", async () => {
    mockCacheService.prototype.constructor.mockImplementationOnce(fullDummySession);
    const res = await request(app)
      .post(pageURLs.EXTENSIONS_CONTINUED_ILLNESS)
      .set("Accept", "application/json")
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`]);
    expect(res.status).toEqual(200);
    expect(res.text).toContain(STILL_ILL_ANSWER_NOT_PROVIDED);
    expect(mockGetCurrentReason).toBeCalled();
  });

  it("should receive no error message when an answer of yes is provided", async () => {
    mockCacheService.prototype.constructor.mockImplementationOnce(fullDummySession);
    const res = await request(app)
      .post(pageURLs.EXTENSIONS_CONTINUED_ILLNESS)
      .set("Accept", "application/json")
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`])
      .send({continuedIllness: "yes"});
    expect(res.header.location).toEqual(pageURLs.EXTENSIONS_ILLNESS_INFORMATION);
    expect(res.status).toEqual(302);
    expect(res.text).not.toContain(STILL_ILL_ANSWER_NOT_PROVIDED);
    expect(mockGetCurrentReason).not.toBeCalled();
  });

  it("should receive no error message when an answer of no is provided", async () => {
    mockCacheService.prototype.constructor.mockImplementationOnce(sessionWithChangingDetails);
    const res = await request(app)
      .post(pageURLs.EXTENSIONS_CONTINUED_ILLNESS)
      .set("Accept", "application/json")
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`])
      .send({continuedIllness: "no"});
    expect(res.header.location).toEqual(pageURLs.EXTENSIONS_ILLNESS_END_DATE);
    expect(res.status).toEqual(302);
    expect(res.text).not.toContain(STILL_ILL_ANSWER_NOT_PROVIDED);
    expect(mockGetCurrentReason).not.toBeCalled();
  });

  it("should redirect to check-answers screen if yes selected with changingDetails in session", async () => {
    mockCacheService.prototype.constructor.mockImplementationOnce(sessionWithChangingDetails);
    const res = await request(app)
      .post(pageURLs.EXTENSIONS_CONTINUED_ILLNESS)
      .set("Accept", "application/json")
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`])
      .send({continuedIllness: "yes"});
    expect(res.header.location).toEqual(pageURLs.EXTENSIONS_CHECK_YOUR_ANSWERS);
    expect(res.status).toEqual(302);
    expect(mockGetCurrentReason).not.toBeCalled();
  });

  it("should receive no error message when an answer of yes is provided", async () => {
    mockCacheService.prototype.constructor.mockImplementationOnce(fullDummySession);
    mockUpdateCurrentReason.mockImplementation(() => {
      throw new Error("invalid session data when processing reason");
    });
    const res = await request(app)
      .post(pageURLs.EXTENSIONS_CONTINUED_ILLNESS)
      .set("Accept", "application/json")
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`])
      .send({continuedIllness: "yes"});
    expect(res.status).toEqual(500);
    expect(mockGetCurrentReason).not.toBeCalled();
  });
});

