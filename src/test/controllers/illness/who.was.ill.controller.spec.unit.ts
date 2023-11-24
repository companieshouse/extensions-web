import app from "../../../app";
import * as request from "supertest";
import * as pageURLs from "../../../model/page.urls";
import {COOKIE_NAME} from "../../../session/config";
import {loadMockSession, fullDummySession} from "../../mock.utils";
import {loadSession} from "../../../services/redis.service";
import {updateReason} from "../../../services/reason.service";
import * as reasonService from "../../../services/reason.service";
import * as sessionService from "../../../services/session.service";
import {createHistoryIfNone} from "../../../services/session.service";

jest.mock("../../../services/redis.service");
jest.mock("../../../services/reason.service");
jest.mock("../../../services/session.service");
jest.mock("../../../client/apiclient");

const mockCacheService = (<unknown>loadSession as jest.Mock<typeof loadSession>);
const mockUpdateReason = (<unknown>updateReason as jest.Mock<typeof updateReason>);
const mockSetReasonInContextAsString = (<unknown>sessionService.setReasonInContextAsString as jest.Mock<typeof sessionService.setReasonInContextAsString>);
const mockGetCurrentReason = (<unknown>reasonService.getCurrentReason as jest.Mock<typeof reasonService.getCurrentReason>);
const mockCreateHistoryIfNone = (<unknown>createHistoryIfNone as jest.Mock<typeof createHistoryIfNone>);

const REASON_ID: string = "abc-123";
const WHO_WAS_ILL_NOT_SELECTED = "You must select a person";
const WHO_WAS_ILL_OTHER_TEXT_NOT_PROVIDED = "You must tell us the person";

beforeEach( () => {
  mockCacheService.mockRestore();
  loadMockSession(mockCacheService);
  mockUpdateReason.mockRestore();
  mockUpdateReason.mockClear();
  mockSetReasonInContextAsString.mockClear();
  mockGetCurrentReason.mockClear();
  mockCreateHistoryIfNone.prototype.constructor.mockImplementation(() => {
    return {
      page_history: [],
    };
  });
});

describe("who was ill url tests", () => {

  it("should find who was ill page with get", async () => {
    const res = await request(app)
      .get(pageURLs.EXTENSIONS_REASON_ILLNESS)
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`]);
    expect(res.status).toEqual(200);
    expect(mockSetReasonInContextAsString).not.toBeCalled();
    expect(mockGetCurrentReason).toBeCalled();
  });

  it("should find who was ill page with existing reason information when reason id is added for change", async () => {
    const res = await request(app)
      .get(pageURLs.EXTENSIONS_REASON_ILLNESS + "?reasonId=" + REASON_ID)
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`]);
    expect(res.status).toEqual(200);
    expect(mockSetReasonInContextAsString).toBeCalled();
    expect(mockGetCurrentReason).toBeCalled();
  });

  it("should return 404 if who was ill page with put", async () => {
    const res = await request(app)
      .put(pageURLs.EXTENSIONS_REASON_ILLNESS)
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`]);
    expect(res.status).toEqual(404);
  });
});

describe("who was ill validation tests", () => {

  it("should receive error message instructing user to select a person when person is undefined", async () => {
    const res = await request(app)
      .post(pageURLs.EXTENSIONS_REASON_ILLNESS)
      .set("Accept", "application/json")
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`]);
    expect(res.status).toEqual(200);
    expect(res.text).toContain(WHO_WAS_ILL_NOT_SELECTED);
    expect(mockUpdateReason).not.toHaveBeenCalled();
  });

  it("should receive error message instructing user to tell the person when 'someone else' is selected with no description", async () => {
    const res = await request(app)
      .post(pageURLs.EXTENSIONS_REASON_ILLNESS)
      .set("Accept", "application/json")
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`])
      .send({illPerson: "other"});
    expect(res.status).toEqual(200);
    expect(res.text).toContain(WHO_WAS_ILL_OTHER_TEXT_NOT_PROVIDED);
    expect(mockUpdateReason).not.toHaveBeenCalled();
  });

  it("should receive error message instructing user to tell the person when 'someone else' is selected with blank description", async () => {
    const res = await request(app)
      .post(pageURLs.EXTENSIONS_REASON_ILLNESS)
      .set("Accept", "application/json")
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`])
      .send({
        illPerson: "other",
        otherPerson: "  "
      });
    expect(res.status).toEqual(200);
    expect(res.text).toContain(WHO_WAS_ILL_OTHER_TEXT_NOT_PROVIDED);
    expect(mockUpdateReason).not.toHaveBeenCalled();
  });

  it("should receive no error message when person is given", async () => {
    mockCacheService.prototype.constructor.mockImplementationOnce(fullDummySession);
    const res = await request(app)
      .post(pageURLs.EXTENSIONS_REASON_ILLNESS)
      .set("Accept", "application/json")
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`])
      .send({illPerson: "illness"});
    expect(res.status).toEqual(302);
    expect(res.text).not.toContain(WHO_WAS_ILL_NOT_SELECTED);
    expect(res.text).not.toContain(WHO_WAS_ILL_OTHER_TEXT_NOT_PROVIDED);
    expect(mockUpdateReason).toHaveBeenCalledWith(fullDummySession(), {
      affected_person: "illness"
    });
  });

  it("should receive no error message when reason is other and description is given", async () => {
    mockCacheService.prototype.constructor.mockImplementationOnce(fullDummySession);
    const res = await request(app)
      .post(pageURLs.EXTENSIONS_REASON_ILLNESS)
      .set("Accept", "application/json")
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`])
      .send({
        illPerson: "other",
        otherPerson: "Lorem ipsum dolor sit amet, consectetur adipiscing elit."
      });
    expect(res.status).toEqual(302);
    expect(res.text).not.toContain(WHO_WAS_ILL_NOT_SELECTED);
    expect(res.text).not.toContain(WHO_WAS_ILL_OTHER_TEXT_NOT_PROVIDED);
    expect(mockUpdateReason).toHaveBeenCalledWith(fullDummySession(), {
      affected_person: "Lorem ipsum dolor sit amet, consectetur adipiscing elit."
    });
  });
});
