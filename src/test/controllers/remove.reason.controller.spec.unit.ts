jest.mock("../../services/redis.service");
jest.mock("../../client/apiclient");

import * as request from "supertest";

import mockMiddlewares from "../mock.middleware";
import app from "../../app";
import * as pageURLs from "../../model/page.urls";
import { COOKIE_NAME } from "../../session/config";
import * as keys from "../../session/keys";
import { getDummyCompanyProfile } from "../mock.utils";
import {
  getCompanyProfile,
  removeExtensionReasonFromRequest,
  getReasons,
} from "../../client/apiclient";
import Session from "../../session/session";
import { loadSession } from "../../services/redis.service";

const mockCompanyProfile: jest.Mock = (<unknown>getCompanyProfile) as jest.Mock<
  typeof getCompanyProfile
>;
const mockRedisService = (<unknown>loadSession) as jest.Mock<
  typeof loadSession
>;
const mockReasons = (<unknown>getReasons) as jest.Mock<typeof getReasons>;
const mockRemoveReason = (<unknown>(
  removeExtensionReasonFromRequest
)) as jest.Mock<typeof removeExtensionReasonFromRequest>;
const EMAIL: string = "demo@ch.gov.uk";
const COMPANY_NUMBER: string = "00006400";

const REMOVE_REASON_CONFIRMATION_NOT_SELECTED: string =
  "You must tell us if you want to remove this reason";
const ERROR_SUMMARY_TITLE: string = "There is a problem";

const QUERY_ID = "?id=1";

beforeEach(() => {
  mockMiddlewares.mockCsrfProtectionMiddleware.mockClear();

  mockCompanyProfile.mockRestore();
  mockRedisService.mockRestore();
  mockReasons.mockClear();
  mockRemoveReason.mockClear();
  mockRedisService.prototype.constructor.mockResolvedValue(dummySession());
  mockReasons.prototype.constructor.mockImplementation(() => {
    return {
      items: [{}],
    };
  });
  mockCompanyProfile.mockResolvedValue(getDummyCompanyProfile(true, true));
});

describe("remove reason url tests", () => {
  it("should find remove reason page with get", async () => {
    const res = await request(app)
      .get(pageURLs.EXTENSIONS_REMOVE_REASON + QUERY_ID)
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`]);
    expect(res.status).toEqual(200);
  });

  it("should return 404 if remove reason page with put", async () => {
    const res = await request(app)
      .put(pageURLs.EXTENSIONS_REMOVE_REASON + QUERY_ID)
      .set("referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`]);
    expect(res.status).toEqual(404);
  });
});

describe("Extension reason tests", () => {
  it("should remove a reason if yes is clicked", async () => {
    const res = await request(app)
      .post(pageURLs.EXTENSIONS_REMOVE_REASON)
      .set("referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`])
      .send({ removeReason: "yes" });
    expect(res.status).toEqual(302);
    expect(res.header.location).toEqual("/extensions/check-your-answers");

    expect(mockRemoveReason).toHaveBeenCalledWith(
      dummySession().extensionSession().extension_requests[0],
      "ACCESS_TOKEN"
    );
    expect(mockReasons).toHaveBeenCalledWith(
      dummySession().extensionSession().extension_requests[0],
      "ACCESS_TOKEN"
    );
  });

  it("should not remove any extension reason if no clicked", async () => {
    const res = await request(app)
      .post(pageURLs.EXTENSIONS_REMOVE_REASON)
      .set("referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`])
      .send({ removeReason: "no" });
    expect(res.status).toEqual(302);
    expect(res.header.location).toEqual("/extensions/check-your-answers");
    expect(mockRemoveReason).not.toHaveBeenCalled();
    expect(mockReasons).not.toHaveBeenCalled();
  });

  it("should redirect to choose-reason if the only extension reason is removed", async () => {
    mockRedisService.prototype.constructor.mockResolvedValue(dummySession());
    mockReasons.prototype.constructor.mockImplementation(() => {
      return {
        items: [],
      };
    });
    const res = await request(app)
      .post(pageURLs.EXTENSIONS_REMOVE_REASON)
      .set("referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`])
      .send({ removeReason: "yes" });
    expect(res.status).toEqual(302);
    expect(res.header.location).toEqual("/extensions/choose-reason");

    expect(mockRemoveReason).toHaveBeenCalledWith(
      dummySession().extensionSession().extension_requests[0],
      "ACCESS_TOKEN"
    );
    expect(mockReasons).toHaveBeenCalledWith(
      dummySession().extensionSession().extension_requests[0],
      "ACCESS_TOKEN"
    );
  });

  it("should render remove-reason page with an error message if yes/no confirmation not selected", async () => {
    const res = await request(app)
      .post(pageURLs.EXTENSIONS_REMOVE_REASON)
      .set("referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`]);
    expect(res.status).toEqual(200);
    expect(res.text).toContain(REMOVE_REASON_CONFIRMATION_NOT_SELECTED);
    expect(res.text).toContain(ERROR_SUMMARY_TITLE);

    expect(mockRemoveReason).not.toHaveBeenCalled();
    expect(mockReasons).toHaveBeenCalled();
    expect(mockReasons).toHaveBeenCalledWith(
      {
        company_number: "00006400",
        extension_request_id: "request1",
      },
      "ACCESS_TOKEN"
    );
  });
});

const dummySession = () => {
  let session = Session.newInstance();
  session.data = {
    [keys.SIGN_IN_INFO]: {
      [keys.SIGNED_IN]: 1,
      [keys.ACCESS_TOKEN]: {
        [keys.ACCESS_TOKEN]: "ACCESS_TOKEN",
      },
      [keys.USER_PROFILE]: {
        email: EMAIL,
      },
    },
    [keys.EXTENSION_SESSION]: {
      [keys.COMPANY_IN_CONTEXT]: COMPANY_NUMBER,
      [keys.EXTENSION_REQUESTS]: [
        {
          [keys.COMPANY_NUMBER]: COMPANY_NUMBER,
          extension_request_id: "request1",
          reason_in_context_string: "reason1",
        },
      ],
    },
  };
  return session;
};
