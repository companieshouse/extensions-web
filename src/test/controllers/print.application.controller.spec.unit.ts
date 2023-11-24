import app from "../../app";
import * as request from "supertest";
import {EXTENSIONS_PRINT_APPLICATION} from "../../model/page.urls";
import {COOKIE_NAME} from "../../session/config";
import {loadMockSession, fullDummySession} from "../mock.utils";
import * as keys from "../../session/keys";
import {getCompanyProfile, getReasons, getFullRequest} from "../../client/apiclient";
import {loadSession} from "../../services/redis.service";
import Session from "../../session/session";
import * as mockUtils from "../mock.utils";

jest.mock("../../client/apiclient");
jest.mock("../../services/redis.service");

const EMAIL: string = "demo@ch.gov.uk";
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
        "id": "1234",
        "reason": "illness",
        "attachments": null,
        "start_on": "1999-05-06",
        "end_on": "1999-07-08",
        "affected_person": "bob",
        "reason_information": "stuff",
        "continued_illness": "maybe"
      }]
    }
  });
});

describe("print application controller", () => {

  it ("should render print application page with get", async () => {
    mockCompanyProfile.mockResolvedValue(mockUtils.getDummyCompanyProfile(false, true));
    mockCacheService.mockClear();
    mockCacheService.prototype.constructor.mockImplementationOnce(fullDummySession);

    const res = await request(app)
      .get(EXTENSIONS_PRINT_APPLICATION)
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`]);
    expect(res.status).toEqual(200);
    expect(res.text).toContain(PAGE_TITLE);

    expect(mockFullRequest).toBeCalledWith("00006400", "KGGGUYUYJHHVK1234", "request1");
  });

  it("should return correct company profile upon render", async () => {
    mockCompanyProfile.mockResolvedValue(mockUtils.getDummyCompanyProfile(false, true));
    mockCacheService.mockClear();
    mockCacheService.prototype.constructor.mockImplementationOnce(fullDummySession);

    const mockPresent: Date = new Date("2019-05-11");
    mockPresent.setHours(0, 0, 0);
    jest.spyOn(Date, "now").mockReturnValue(mockPresent.getTime());

    const res = await request(app).get(EXTENSIONS_PRINT_APPLICATION)
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`]);

    expect(res.status).toEqual(200);
    expect(res.text).toContain(mockUtils.COMPANY_NAME);
    expect(res.text).toContain(mockUtils.COMPANY_NUMBER);
    expect(res.text).toContain(mockUtils.COMPANY_STATUS_ACTIVE);
    expect(res.text).toContain(mockUtils.COMPANY_TYPE);
    expect(res.text).toContain(mockUtils.COMPANY_INC_DATE);
    expect(res.text).toContain(mockUtils.LINE_1);
    expect(res.text).toContain(mockUtils.LINE_2);
    expect(res.text).toContain(mockUtils.POST_CODE);
    expect(res.text).toContain(mockUtils.ACCOUNTS_NEXT_DUE_DATE);
    expect(res.text).toContain(EMAIL);
  });

  it("should return correct company profile with no accounts date row if no date is found", async () => {
    mockCompanyProfile.mockResolvedValue(mockUtils.getDummyCompanyProfileNoAccounts());
    mockCacheService.mockClear();
    mockCacheService.prototype.constructor.mockImplementationOnce(fullDummySession);

    const mockPresent: Date = new Date("2019-05-11");
    mockPresent.setHours(0, 0, 0);
    jest.spyOn(Date, "now").mockReturnValue(mockPresent.getTime());

    const res = await request(app).get(EXTENSIONS_PRINT_APPLICATION)
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`]);

    expect(res.status).toEqual(200);
    expect(res.text).toContain(mockUtils.COMPANY_NAME);
    expect(res.text).toContain(mockUtils.COMPANY_NUMBER);
    expect(res.text).toContain(mockUtils.COMPANY_STATUS_ACTIVE);
    expect(res.text).toContain(mockUtils.COMPANY_TYPE);
    expect(res.text).toContain(mockUtils.COMPANY_INC_DATE);
    expect(res.text).toContain(mockUtils.LINE_1);
    expect(res.text).toContain(mockUtils.LINE_2);
    expect(res.text).toContain(mockUtils.POST_CODE);
    expect(res.text).not.toContain("Accounts due");
    expect(res.text).toContain(EMAIL);
  });

  it ("should return 404 if print application page with put", async () => {
    const res = await request(app)
      .put(EXTENSIONS_PRINT_APPLICATION)
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`]);
    expect(res.status).toEqual(404);
  });

  it("should return the error page if email is missing from session", async () => {
    mockCacheService.mockClear();
    mockCacheService.prototype.constructor.mockResolvedValueOnce(dummySession(mockUtils.COMPANY_NUMBER, null));

    const resp = await request(app)
      .get(EXTENSIONS_PRINT_APPLICATION)
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`]);

    expect(resp.status).toEqual(500);
    expect(resp.text).not.toContain(EMAIL);
    expect(resp.text).not.toContain(mockUtils.COMPANY_NUMBER);
    expect(resp.text).not.toContain(PAGE_TITLE);
    expect(resp.text).toContain(ERROR_PAGE);
  });

  it("should return the error page if company number is missing from session", async () => {
    mockCacheService.mockClear();
    mockCacheService.prototype.constructor.mockResolvedValueOnce(dummySession(null, EMAIL));

    const resp = await request(app)
      .get(EXTENSIONS_PRINT_APPLICATION)
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`]);

    expect(resp.status).toEqual(500);
    expect(resp.text).not.toContain(EMAIL);
    expect(resp.text).not.toContain(mockUtils.COMPANY_NUMBER);
    expect(resp.text).not.toContain(PAGE_TITLE);
    expect(resp.text).toContain(ERROR_PAGE);
  });

  it ("should format reason dates correctly", async () => {
    mockCompanyProfile.mockResolvedValue(mockUtils.getDummyCompanyProfile(false, true));
    mockCacheService.mockClear();
    mockCacheService.prototype.constructor.mockImplementationOnce(fullDummySession);

    const res = await request(app)
      .get(EXTENSIONS_PRINT_APPLICATION)
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
