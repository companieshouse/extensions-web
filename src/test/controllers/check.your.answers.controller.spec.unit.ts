import app from "../../app";
import * as request from "supertest";
import * as pageURLs from "../../model/page.urls";
import {COOKIE_NAME} from "../../session/config";
import {loadMockSession, fullDummySession, EMAIL} from "../mock.utils";
import * as keys from "../../session/keys";
import {getCompanyProfile, getReasons, getFullRequest} from "../../client/apiclient";
import {loadSession} from "../../services/redis.service";
import Session from "../../session/session";
import {createHistoryIfNone, getRequest} from "../../services/session.service";

jest.mock("../../client/apiclient");
jest.mock("../../services/redis.service");
jest.mock("../../services/session.service");

const COMPANY_NUMBER: string = "00006400";
const TITLE: string = "Check your answers before sending your application";
const ERROR_PAGE: string = "Sorry, there is a problem with the service";

const mockCompanyProfile: jest.Mock = (<unknown>getCompanyProfile as jest.Mock<typeof getCompanyProfile>);
const mockCacheService = (<unknown>loadSession as jest.Mock<typeof loadSession>);
const mockReasons = (<unknown>getReasons as jest.Mock<typeof getReasons>);
const mockFullRequest = (<unknown>getFullRequest as jest.Mock<typeof getFullRequest>);
const mockGetRequest = (<unknown>getRequest as jest.Mock<typeof getRequest>);
const mockCreateHistoryIfNone = (<unknown>createHistoryIfNone  as jest.Mock<typeof createHistoryIfNone>);

beforeEach( () => {
  mockCompanyProfile.mockRestore();
  loadMockSession(mockCacheService);
  mockReasons.prototype.constructor.mockImplementation(() => {
    return {
      items: [{}]
    }
  });
  mockFullRequest.prototype.constructor.mockImplementation(() => {
    return {
      reasons: [{
        "id":"1234",
        "reason":"illness",
        "attachments":null,
        "start_on":"1999-05-06",
        "end_on":"1999-07-08",
        "affected_person":"bob",
        "reason_information":"stuff",
        "continued_illness":"maybe"
      }]
    }
  });
  mockGetRequest.prototype.constructor.mockImplementation(() => {
    return {
      company_number: "00006400",
      extension_request_id: "request1",
      reason_in_context_string: "reason1"
    }
  });
  mockCreateHistoryIfNone.prototype.constructor.mockImplementation(() => {
    return {
      page_history:[],
    };
  });
});

describe("check your answers url tests", () => {
  it ("should find check your answers page with get", async () => {
    mockCacheService.mockClear();
    mockCacheService.prototype.constructor.mockImplementationOnce(fullDummySession);

    const res = await request(app)
      .get(pageURLs.EXTENSIONS_CHECK_YOUR_ANSWERS)
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`]);
    expect(res.status).toEqual(200);
    expect(res.text).toContain(TITLE);
    expect(mockFullRequest).toBeCalledWith("00006400", "KGGGUYUYJHHVK1234", "request1");
  });

  it ("should display correct user email on page", async () => {
    mockCacheService.mockClear();
    mockCacheService.prototype.constructor.mockImplementationOnce(fullDummySession);

    const res = await request(app)
      .get(pageURLs.EXTENSIONS_CHECK_YOUR_ANSWERS)
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`]);
    expect(res.text).toContain("Contact email address");
    expect(res.text).toContain(EMAIL);
  });

  it ("should return 404 if check your answers page with put", async () => {
    const res = await request(app)
      .put(pageURLs.EXTENSIONS_CHECK_YOUR_ANSWERS)
      .set("Cookie", [`${COOKIE_NAME}=123`]);
    expect(res.status).toEqual(404);
  });

  it("should return the error page if company number is missing from session", async () => {
    mockCacheService.mockClear();
    mockCacheService.prototype.constructor.mockImplementationOnce((cookieId) => {
      const session: Session = Session.newWithCookieId(cookieId);
      session.data = {
        [keys.SIGN_IN_INFO]: {
          [keys.SIGNED_IN]: 1,
          [keys.USER_PROFILE]: {
            email: EMAIL
          }
        },
        [keys.EXTENSION_SESSION]: {}
      };
      return session;
    });

    const resp = await request(app)
      .get(pageURLs.EXTENSIONS_CONFIRMATION)
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`]);

    expect(resp.status).toEqual(500);
    expect(resp.text).not.toContain(EMAIL);
    expect(resp.text).not.toContain(COMPANY_NUMBER);
    expect(resp.text).not.toContain(TITLE);
    expect(resp.text).toContain(ERROR_PAGE);
  });

  it ("should forward to confirmation page on post", async () => {
    const res = await request(app)
      .post(pageURLs.EXTENSIONS_CHECK_YOUR_ANSWERS)
      .set("Cookie", [`${COOKIE_NAME}=123`]);
    expect(res.status).toEqual(302);
    expect(res.text).toContain(pageURLs.EXTENSIONS_CONFIRMATION);
  });

  it ("should format reason dates correctly", async () => {
    mockCacheService.mockClear();
    mockCacheService.prototype.constructor.mockImplementationOnce(fullDummySession);
    
    const res = await request(app)
      .get(pageURLs.EXTENSIONS_CHECK_YOUR_ANSWERS)
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`]);
    expect(res.status).toEqual(200);
    expect(res.text).toContain("6 May 1999");
    expect(res.text).toContain("8 July 1999");
  });
});
