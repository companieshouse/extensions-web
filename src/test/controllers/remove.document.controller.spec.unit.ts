jest.mock("../../client/apiclient");
jest.mock("../../services/redis.service");

import * as request from "supertest";

import mockMiddlewares from "../mock.middleware";
import app from "../../app";
import * as pageURLs from "../../model/page.urls";
import { COOKIE_NAME } from "../../session/config";
import { fullDummySession, missingTokenDummySession } from "../mock.utils";
import { loadSession } from "../../services/redis.service";
import {
  getCompanyProfile,
  getFullRequest,
  getReasons,
  removeAttachment,
} from "../../client/apiclient";
import { ReasonWeb } from "../../model/reason/extension.reason.web";

const mockCompanyProfile: jest.Mock = (<unknown>getCompanyProfile) as jest.Mock<
  typeof getCompanyProfile
>;
const mockCacheService = (<unknown>loadSession) as jest.Mock<
  typeof loadSession
>;
const mockRemoveAttachment = (<unknown>removeAttachment) as jest.Mock<
  typeof removeAttachment
>;
const mockGetFullRequest = (<unknown>getFullRequest) as jest.Mock<
  typeof getFullRequest
>;
const mockReasons = (<unknown>getReasons) as jest.Mock<typeof getReasons>;

const REMOVE_DOCUMENT_DECISION_NOT_MADE: string =
  "You must tell us if you want to remove the document";
const QUERY_ID: string = "?documentID=attachment1";

beforeEach(() => {
  mockMiddlewares.mockCsrfProtectionMiddleware.mockClear();

  mockCompanyProfile.mockRestore();
  mockRemoveAttachment.mockClear();
  mockCacheService.mockClear();
  mockRemoveAttachment.prototype.constructor.mockImplementation(() => "");
  mockReasons.prototype.constructor.mockImplementation(() => {
    return {
      items: [
        {
          id: "reason1",
        },
      ],
    };
  });
  mockGetFullRequest.prototype.constructor.mockImplementation(() => {
    return {
      id: "request1",
      reasons: [
        {
          id: "reason1",
          attachments: [
            {
              id: "attachment1",
              name: "",
            },
          ],
        } as ReasonWeb,
      ],
      created_by: {
        id: "XXX",
      },
    };
  });
});

describe("remove document url tests", () => {
  it("should find remove document page with get", async () => {
    mockCacheService.prototype.constructor.mockImplementationOnce(
      fullDummySession
    );
    const res = await request(app)
      .get(pageURLs.EXTENSIONS_REMOVE_DOCUMENT + QUERY_ID)
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`]);
    expect(res.status).toEqual(200);
  });
  it("should return 404 if remove document page with put", async () => {
    mockCacheService.prototype.constructor.mockImplementationOnce(
      fullDummySession
    );
    const res = await request(app)
      .put(pageURLs.EXTENSIONS_REMOVE_DOCUMENT + QUERY_ID)
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`]);
    expect(res.status).toEqual(404);
  });
  it("should return 500 if missing session data", async () => {
    mockCacheService.prototype.constructor.mockImplementationOnce(
      missingTokenDummySession
    );
    const res = await request(app)
      .get(pageURLs.EXTENSIONS_REMOVE_DOCUMENT + QUERY_ID)
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`]);
    expect(res.status).toEqual(500);
  });
});

describe("remove document controller tests", () => {
  it("does delete an existing document when yes is selected", async () => {
    mockCacheService.prototype.constructor.mockImplementationOnce(
      fullDummySession
    );
    const res = await request(app)
      .post(pageURLs.EXTENSIONS_REMOVE_DOCUMENT + QUERY_ID)
      .set("Accept", "application/json")
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`])
      .send({ removeDocument: "yes" });
    expect(res.status).toEqual(302);
    expect(res.text).not.toContain(REMOVE_DOCUMENT_DECISION_NOT_MADE);
    expect(mockRemoveAttachment).toHaveBeenCalledWith(
      "00006400",
      "KGGGUYUYJHHVK1234",
      "request1",
      "reason1",
      "attachment1"
    );
  });

  it("does not delete an existing document when no is selected", async () => {
    mockCacheService.prototype.constructor.mockImplementationOnce(
      fullDummySession
    );
    const res = await request(app)
      .post(pageURLs.EXTENSIONS_REMOVE_DOCUMENT + QUERY_ID)
      .set("Accept", "application/json")
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`])
      .send({ removeDocument: "no" });
    expect(res.status).toEqual(302);
    expect(res.text).not.toContain(REMOVE_DOCUMENT_DECISION_NOT_MADE);
    expect(mockRemoveAttachment).not.toHaveBeenCalledWith(
      "00006400",
      "KGGGUYUYJHHVK1234",
      "request1",
      "reason1",
      "attachment1"
    );
  });

  it("should receive error message asking for a decision when it has not been made", async () => {
    mockCacheService.prototype.constructor.mockImplementationOnce(
      fullDummySession
    );
    const res = await request(app)
      .post(pageURLs.EXTENSIONS_REMOVE_DOCUMENT + QUERY_ID)
      .set("Accept", "application/json")
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`]);
    expect(res.status).toEqual(200);
    expect(res.text).toContain(REMOVE_DOCUMENT_DECISION_NOT_MADE);
    expect(mockRemoveAttachment).not.toHaveBeenCalledWith(
      "00006400",
      "KGGGUYUYJHHVK1234",
      "request1",
      "reason1",
      "attachment1"
    );
  });
});
