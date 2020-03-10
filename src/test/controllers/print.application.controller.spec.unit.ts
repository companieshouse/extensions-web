import app from "../../app";
import * as request from "supertest";
import * as pageURLs from "../../model/page.urls";
import {COOKIE_NAME} from "../../session/config";
import {loadMockSession, fullDummySession} from "../mock.utils";
import * as keys from "../../session/keys";
import {getCompanyProfile, getReasons, getFullRequest} from "../../client/apiclient";
import {loadSession} from "../../services/redis.service";
import Session from "../../session/session";

jest.mock("../../client/apiclient");
jest.mock("../../services/redis.service");

const EMAIL: string = "demo@ch.gov.uk";
const COMPANY_NUMBER: string = "00006400";
const PAGE_TITLE: string = "Print a copy of your application";
const ERROR_PAGE: string = "Sorry, there is a problem with the service";

const mockCompanyProfile: jest.Mock = (<unknown>getCompanyProfile as jest.Mock<typeof getCompanyProfile>);
const mockCacheService = (<unknown>loadSession as jest.Mock<typeof loadSession>);
const mockReasons = (<unknown>getReasons as jest.Mock<typeof getReasons>);
const mockFullRequest = (<unknown>getFullRequest as jest.Mock<typeof getFullRequest>);

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
});

describe("print application controller", () => {

  it ("should render print application page with get", async () => {
    mockCacheService.mockClear();
    mockCacheService.prototype.constructor.mockImplementationOnce(fullDummySession);

    const res = await request(app)
      .get(pageURLs.EXTENSIONS_PRINT_APPLICATION)
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`]);
    expect(res.status).toEqual(200);
    expect(res.text).toContain(PAGE_TITLE);

    expect(mockFullRequest).toBeCalledWith("00006400", "KGGGUYUYJHHVK1234", "request1");
  });

  it ("should return 404 if print application page with put", async () => {
    const res = await request(app)
      .put(pageURLs.EXTENSIONS_PRINT_APPLICATION)
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`]);
    expect(res.status).toEqual(404);
  });

  it("should return the error page if email is missing from session", async () => {
    mockCacheService.mockClear();
    mockCacheService.prototype.constructor.mockResolvedValueOnce(dummySession(COMPANY_NUMBER, null));

    const resp = await request(app)
      .get(pageURLs.EXTENSIONS_PRINT_APPLICATION)
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`]);

    expect(resp.status).toEqual(500);
    expect(resp.text).not.toContain(EMAIL);
    expect(resp.text).not.toContain(COMPANY_NUMBER);
    expect(resp.text).not.toContain(PAGE_TITLE);
    expect(resp.text).toContain(ERROR_PAGE);
  });

  it("should return the error page if company number is missing from session", async () => {
    mockCacheService.mockClear();
    mockCacheService.prototype.constructor.mockResolvedValueOnce(dummySession(null, EMAIL));

    const resp = await request(app)
      .get(pageURLs.EXTENSIONS_PRINT_APPLICATION)
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`]);

    expect(resp.status).toEqual(500);
    expect(resp.text).not.toContain(EMAIL);
    expect(resp.text).not.toContain(COMPANY_NUMBER);
    expect(resp.text).not.toContain(PAGE_TITLE);
    expect(resp.text).toContain(ERROR_PAGE);
  });

  it ("should format reason dates correctly", async () => {
    mockCacheService.mockClear();
    mockCacheService.prototype.constructor.mockImplementationOnce(fullDummySession);

    const res = await request(app)
      .get(pageURLs.EXTENSIONS_PRINT_APPLICATION)
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`]);
    expect(res.status).toEqual(200);
    expect(res.text).toContain("6 May 1999");
    expect(res.text).toContain("8 July 1999");
  });
});

const dummySession = (companyNumber, email) => {
  let session: Session = Session.newInstance();
  session.data = {
    [keys.SIGN_IN_INFO]: {
      [keys.SIGNED_IN]: 1,
      [keys.USER_PROFILE]: {
        email
      }
    },
    [keys.EXTENSION_SESSION]: {
      [keys.COMPANY_IN_CONTEXT]: companyNumber,
      [keys.EXTENSION_REQUESTS]: [{
        [keys.COMPANY_NUMBER]: "00006400",
        "extension_request_id": "request1",
        "reason_in_context_string": "reason1",
        [keys.EXTENSION_REASONS]: [
          {
            reasonNumber: 1,
            reasonId: "reason1",
            reason: "illness",
            removalCandidate: false
          }
        ]
      }],
    }
  };
  return session;
};
