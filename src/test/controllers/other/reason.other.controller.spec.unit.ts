import app from "../../../app";
import * as request from "supertest";
import * as pageURLs from "../../../model/page.urls";
import {COOKIE_NAME} from "../../../session/config";
import {loadSession} from "../../../services/redis.service";
import {loadMockSession, fullDummySession} from "../../mock.utils";
import {updateReason} from "../../../services/reason.service";
import * as reasonService from "../../../services/reason.service";
import * as sessionService from "../../../services/session.service";
import {createHistoryIfNone} from "../../../services/session.service";


jest.mock("../../../services/redis.service");
jest.mock("../../../services/reason.service");
jest.mock("../../../services/session.service");
jest.mock("../../../client/apiclient");

const mockCacheService = (<unknown>loadSession as jest.Mock<typeof loadSession>);
const mockUpdateReasonService = (<unknown>updateReason as jest.Mock<typeof updateReason>);
const mockSetReasonInContextAsString = (<unknown>sessionService.setReasonInContextAsString  as jest.Mock<typeof sessionService.setReasonInContextAsString>);
const mockGetCurrentReason = (<unknown>reasonService.getCurrentReason as jest.Mock<typeof reasonService.getCurrentReason>);
const mockCreateHistoryIfNone = (<unknown>createHistoryIfNone  as jest.Mock<typeof createHistoryIfNone>);
const session = fullDummySession();

const NO_INFORMATION_INPUT = "You must give us more information";
const REASON_ID: string = "abc-123";

beforeEach(() => {
  loadMockSession(mockCacheService);
  mockUpdateReasonService.mockClear();
  mockUpdateReasonService.mockRestore();
  mockSetReasonInContextAsString.mockClear();
  mockGetCurrentReason.mockClear();
  mockCreateHistoryIfNone.prototype.constructor.mockImplementation(() => {
    return {
      page_history:[],
    };
  });
});

describe("reason other url tests", () => {

  it("should find reason other page with get", async () => {
    const res = await request(app)
      .get(pageURLs.EXTENSIONS_REASON_OTHER)
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`]);
    expect(res.status).toEqual(200);
    expect(mockSetReasonInContextAsString).not.toBeCalled();
    expect(mockGetCurrentReason).toBeCalled();
  });

  it("should find accounts information page with existing reason information when reason id is added for change", async () => {
    const res = await request(app)
      .get(pageURLs.EXTENSIONS_REASON_OTHER + "?reasonId=" + REASON_ID)
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`]);
    expect(res.status).toEqual(200);
    expect(mockSetReasonInContextAsString).toBeCalled();
    expect(mockGetCurrentReason).toBeCalled();
  });

  it("should return 404 if reason other page with put", async () => {
    const res = await request(app)
      .put(pageURLs.EXTENSIONS_REASON_OTHER)
      .set("Cookie", [`${COOKIE_NAME}=123`]);
    expect(res.status).toEqual(404);
  });
});

describe("reason other validation tests", () => {

  it("should receive error message requesting more information when text input is empty", async () => {
    const res = await request(app)
      .post(pageURLs.EXTENSIONS_REASON_OTHER)
      .set("Accept", "application/json")
      .set("Cookie", [`${COOKIE_NAME}=123`]);
    expect(res.status).toEqual(200);
    expect(res.text).toContain(NO_INFORMATION_INPUT);
    expect(mockUpdateReasonService).not.toHaveBeenCalled();
  });

  it("should receive error message requesting more information when text input is blank", async () => {
    const res = await request(app)
      .post(pageURLs.EXTENSIONS_REASON_OTHER)
      .set("Accept", "application/json")
      .set("Cookie", [`${COOKIE_NAME}=123`])
      .send({
        otherInformation: " "
      });
    expect(res.status).toEqual(200);
    expect(res.text).toContain(NO_INFORMATION_INPUT);
    expect(mockUpdateReasonService).not.toHaveBeenCalled();
  });

  it("should receive no error message requesting more information when text input is supplied", async () => {
    mockCacheService.prototype.constructor.mockImplementationOnce(() => session);
    const res = await request(app)
      .post(pageURLs.EXTENSIONS_REASON_OTHER)
      .set("Accept", "application/json")
      .set("Cookie", [`${COOKIE_NAME}=123`])
      .send({
         otherInformation: "Lorem ipsum dolor sit amet, consectetur adipiscing elit."
      });
    expect(res.header.location).toEqual(pageURLs.EXTENSIONS_EVIDENCE_OPTION);
    expect(res.status).toEqual(302);
    expect(res.text).not.toContain(NO_INFORMATION_INPUT);
    expect(mockUpdateReasonService).toHaveBeenCalledWith(session, {
      reason_information: "Lorem ipsum dolor sit amet, consectetur adipiscing elit."
    });
  });

  it("should replace non printable chars when capturing reason information", async () => {
    mockCacheService.prototype.constructor.mockImplementationOnce(() => session);
    const res = await request(app)
      .post(pageURLs.EXTENSIONS_REASON_OTHER)
      .set("Accept", "application/json")
      .set("Cookie", [`${COOKIE_NAME}=123`])
      .send({
        otherInformation: "Lorem ipsum dolor sit amet, \r\nconsectetur adipiscing elit."
      });
    expect(res.header.location).toEqual(pageURLs.EXTENSIONS_EVIDENCE_OPTION);
    expect(res.status).toEqual(302);
    expect(res.text).not.toContain(NO_INFORMATION_INPUT);
    expect(mockUpdateReasonService).toHaveBeenCalledWith(session, {
      reason_information: "Lorem ipsum dolor sit amet,  consectetur adipiscing elit."
    });
  });
});
