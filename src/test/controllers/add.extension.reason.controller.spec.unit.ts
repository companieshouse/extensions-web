import app from "../../app";
import * as request from "supertest";
import * as pageURLs from "../../model/page.urls";
import {COOKIE_NAME} from "../../session/config";
import {loadSession} from "../../services/redis.service";
import {fullDummySession, loadMockSession} from "../mock.utils";
import {updateReason} from "../../services/reason.service";
import {createHistoryIfNone} from "../../services/session.service";

jest.mock("../../services/redis.service");
jest.mock("../../services/reason.service");
jest.mock("../../services/session.service");

const ADD_EXTENSION_REASON_DECISION_NOT_MADE: string =
  "You must tell us if there is another reason for your extension";

const mockCacheService = (<unknown>loadSession as jest.Mock<typeof loadSession>);
const mockReasonUpdate = (<unknown>updateReason as jest.Mock<typeof updateReason>);
const mockCreateHistoryIfNone = (<unknown>createHistoryIfNone  as jest.Mock<typeof createHistoryIfNone>);
const session = fullDummySession();

beforeEach( () => {
  loadMockSession(mockCacheService);
  mockReasonUpdate.mockClear();
  mockReasonUpdate.mockReset();
  mockCreateHistoryIfNone.prototype.constructor.mockImplementation(() => {
    return {
      page_history:[],
    };
  });
});

describe("add extension reason url tests", () => {
  it ("should find add extension reason page with get", async () => {
    const res = await request(app)
      .get(pageURLs.EXTENSIONS_ADD_EXTENSION_REASON)
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`]);
    expect(res.status).toEqual(200);
  });
  it ("should return 404 if add extension reason page with put", async () => {
    const res = await request(app)
      .put(pageURLs.EXTENSIONS_ADD_EXTENSION_REASON)
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`]);
    expect(res.status).toEqual(404);
  });
});

describe("add extension reason validation tests", () => {
  it("should receive error message asking for a decision when it has not been made", async () => {
    const res = await request(app)
      .post(pageURLs.EXTENSIONS_ADD_EXTENSION_REASON)
      .set("Accept", "application/json")
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`]);
    expect(res.status).toEqual(200);
    expect(res.text).toContain(ADD_EXTENSION_REASON_DECISION_NOT_MADE);
    expect(mockReasonUpdate).not.toHaveBeenCalled();
  });

  it("should receive no error message asking for a decision when yes is selected", async () => {
    mockCacheService.mockClear();
    mockCacheService.prototype.constructor.mockImplementationOnce(() => session);
    const res = await request(app)
      .post(pageURLs.EXTENSIONS_ADD_EXTENSION_REASON)
      .set("Accept", "application/json")
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`])
      .send({addExtensionReason: "yes"});
    expect(res.header.location).toEqual(pageURLs.EXTENSIONS_CHOOSE_REASON);
    expect(res.status).toEqual(302);
    expect(res.text).not.toContain(ADD_EXTENSION_REASON_DECISION_NOT_MADE);
    expect(mockReasonUpdate).toHaveBeenCalled();
  });

  it("should receive no error message asking for a decision when no is selected", async () => {
    const res = await request(app)
      .post(pageURLs.EXTENSIONS_ADD_EXTENSION_REASON)
      .set("Accept", "application/json")
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`])
      .send({addExtensionReason: "no"});
    expect(res.header.location).toEqual(pageURLs.EXTENSIONS_CHECK_YOUR_ANSWERS);
    expect(res.status).toEqual(302);
    expect(res.text).not.toContain(ADD_EXTENSION_REASON_DECISION_NOT_MADE);
    expect(mockReasonUpdate).toHaveBeenCalled();
  });
});

