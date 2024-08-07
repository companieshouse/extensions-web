import {NextFunction, Request, Response} from "express";
import app from "../../app";
import * as pageURLs from "../../model/page.urls";
import * as request from "supertest";
import {COOKIE_NAME} from "../../session/config";
import {loadSession} from "../../services/redis.service";
import {EMAIL, getDummyCompanyProfile} from "../mock.utils";
import { CsrfError } from "@companieshouse/web-security-node";
import * as removeReasonController from "../../controllers/remove.reason.controller";
import { getCompanyProfile, removeExtensionReasonFromRequest, getReasons } from "../../client/apiclient";
import Session from "../../session/session";
import * as keys from "../../session/keys";

jest.mock("../../services/redis.service");
jest.mock("../../client/apiclient");
jest.mock("../../../src/controllers/remove.reason.controller");

const mockCompanyProfile: jest.Mock = (<unknown>getCompanyProfile as jest.Mock<typeof getCompanyProfile>);
const mockRedisService = (<unknown>loadSession as jest.Mock<typeof loadSession>);
const mockReasons = (<unknown>getReasons as jest.Mock<typeof getReasons>);
const mockRemoveReason = (<unknown>removeExtensionReasonFromRequest as jest.Mock<typeof removeExtensionReasonFromRequest>);
const mockRemoveReasonGetRoute: jest.Mock = (<unknown>removeReasonController.removeReasonGetRoute as jest.Mock<typeof removeReasonController.removeReasonGetRoute>);

const CSRF_ERROR_PAGE_HEADING = "Sorry, something went wrong";
const CSRF_ERROR_PAGE_TEXT = "We have not been able to save the information you submitted on the previous screen.";
const CSRF_TOKEN_ERROR = "CSRF token mismatch";
const COMPANY_NUMBER = "00006400";

// test skipped, need to work on it more when activating csrfProtectionMiddleware
describe.skip("error csrf", () => {
  beforeEach(() => {
    mockCompanyProfile.mockRestore();
    mockRedisService.mockRestore();
    mockReasons.mockClear();
    mockRemoveReason.mockClear();
    mockRedisService.prototype.constructor.mockResolvedValue(dummySession());
    mockReasons.prototype.constructor.mockImplementation(() => {
      return {
        items: [{}]
      }
    });
    mockCompanyProfile.mockResolvedValue(getDummyCompanyProfile(true, true));
    mockRemoveReasonGetRoute.mockClear();
  });

  it("Should render the CSRF error page", async () => {

    mockRemoveReasonGetRoute.mockImplementationOnce((req: Request, res: Response, next: NextFunction) => { throw new CsrfError(CSRF_TOKEN_ERROR); });

    const QUERY_ID = "?id=1";

    const response = await request(app)
    .get(pageURLs.EXTENSIONS_REMOVE_REASON + QUERY_ID)
    .set("Referer", "/")
    .set("Cookie", [`${COOKIE_NAME}=123`]);

    expect(mockRemoveReasonGetRoute).toHaveBeenCalledTimes(1);

    expect(response.status).toEqual(403);
    expect(response.text).toContain(CSRF_ERROR_PAGE_HEADING);
    expect(response.text).toContain(CSRF_ERROR_PAGE_TEXT);
  });
})

const dummySession = () => {
  let session = Session.newInstance();
  session.data = {
    [keys.SIGN_IN_INFO]: {
      [keys.SIGNED_IN]: 1,
      [keys.ACCESS_TOKEN]: {
        [keys.ACCESS_TOKEN]: "ACCESS_TOKEN",
      },
      [keys.USER_PROFILE]: {
        email: EMAIL
      }
    },
    [keys.EXTENSION_SESSION]: {
      [keys.COMPANY_IN_CONTEXT]: COMPANY_NUMBER,
      [keys.EXTENSION_REQUESTS]: [{
        [keys.COMPANY_NUMBER]: COMPANY_NUMBER,
        extension_request_id: "request1",
        reason_in_context_string: "reason1",
      }]
    }
  };
  return session;
};