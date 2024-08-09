jest.mock("../../services/redis.service");
jest.mock("../../services/session.service");

import * as request from "supertest";

import mockMiddlewares from "../mock.middleware";
import app from "../../app";
import * as pageURLs from "../../model/page.urls";
import {COOKIE_NAME} from "../../session/config";
import {loadSession} from "../../services/redis.service";
import {loadMockSession} from "../mock.utils";
import {createHistoryIfNone} from "../../services/session.service";

const mockCacheService = (<unknown>loadSession as jest.Mock<typeof loadSession>);
const mockCreateHistoryIfNone = (<unknown>createHistoryIfNone as jest.Mock<typeof createHistoryIfNone>);

export const UPLOAD_DOCUMENTS_DECISION_NOT_MADE = "You must tell us if you want to upload documents";

beforeEach( () => {
  mockMiddlewares.mockCsrfProtectionMiddleware.mockClear();

  loadMockSession(mockCacheService);
  mockCreateHistoryIfNone.prototype.constructor.mockImplementation(() => {
    return {
      page_history: [],
    };
  });
});

describe("document option url tests", () => {
  it("should find document option page with get", async () => {
    const res = await request(app)
      .get(pageURLs.EXTENSIONS_DOCUMENT_OPTION)
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`]);
    expect(res.status).toEqual(200);
  });

  it("should return 404 if document option page with put", async () => {
    const res = await request(app)
      .put(pageURLs.EXTENSIONS_DOCUMENT_OPTION)
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`]);
    expect(res.status).toEqual(404);
  });
});

describe("document option validation tests", () => {
  it("should receive error message asking for a decision when it has not been made", async () => {
    const res = await request(app)
      .post(pageURLs.EXTENSIONS_DOCUMENT_OPTION)
      .set("Accept", "application/json")
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`]);
    expect(res.status).toEqual(200);
    expect(res.text).toContain(UPLOAD_DOCUMENTS_DECISION_NOT_MADE);
  });

  it("should receive no error message asking for a decision when yes is selected", async () => {
    const res = await request(app)
      .post(pageURLs.EXTENSIONS_DOCUMENT_OPTION)
      .set("Accept", "application/json")
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`])
      .send({supportingDocuments: "yes"});
    expect(res.header.location).toEqual(pageURLs.EXTENSIONS_DOCUMENT_UPLOAD);
    expect(res.status).toEqual(302);
    expect(res.text).not.toContain(UPLOAD_DOCUMENTS_DECISION_NOT_MADE);
  });

  it("should receive no error message asking for a decision when no is selected", async () => {
    const res = await request(app)
      .post(pageURLs.EXTENSIONS_DOCUMENT_OPTION)
      .set("Accept", "application/json")
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`])
      .send({supportingDocuments: "no"});
    expect(res.header.location).toEqual(pageURLs.EXTENSIONS_ADD_EXTENSION_REASON);
    expect(res.status).toEqual(302);
    expect(res.text).not.toContain(UPLOAD_DOCUMENTS_DECISION_NOT_MADE);
  });
});

