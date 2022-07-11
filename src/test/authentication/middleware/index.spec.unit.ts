import * as request from 'supertest';
import app from '../../../app';
import {COOKIE_NAME} from "../../../session/config";
import * as keys from "../../../session/keys"
import {loadSession} from "../../../services/redis.service";
import {loadMockSession} from "../../mock.utils";
import Session from "../../../session/session";

jest.mock("../../../controllers/company.details.controller");
jest.mock("../../../controllers/company.number.controller");
jest.mock("../../../services/redis.service");

const mockCacheService = (<unknown>loadSession as jest.Mock<typeof loadSession>);

beforeEach(() => {
  mockCacheService.mockRestore();
  loadMockSession(mockCacheService);
});

describe("Authentication middleware", () => {

  it("should not redirect to signin if loading start page", async () => {
    const response = await request(app)
      .get("/extensions");
    expect(response.status).toEqual(200);
  });

  it("should load start page if loading start page with trailing slash", async () => {
    const response = await request(app)
      .get("/extensions/")
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`]);
    expect(response.status).toEqual(200);
  });

  it("should redirect to start page if loading start page with trailing slash and no referer", async () => {
    const response = await request(app)
      .get("/extensions/")
      .set("Cookie", [`${COOKIE_NAME}=123`])
      .expect("Location", "/extensions");
    expect(response.status).toEqual(302);
  });

  it("should not redirect to signin if loading accessibility statement page", async () => {
    const response = await request(app)
      .get("/extensions/accessibility-statement")
      .set("Referer", "/extensions");
    expect(response.status).toEqual(200);
    expect(response.text).toContain("Accessibility statement for the Apply to extend your filing deadline service");
  });

  it("should redirect to signin if /extensions/* called and not signed in", async () => {
    setNotSignedIn();
    const response = await request(app)
      .get("/extensions/company-number")
      .set("Referer", "/extensions/company-number")
      .expect("Location", "/signin?return_to=/extensions");
    expect(response.status).toEqual(302);
  });

  it("should not redirect to signin if navigating from /extensions page and not signed in", async () => {
    setNotSignedIn();
    const response = await request(app)
      .get("/extensions/company-number")
      .set("Referer", "/extensions")
      .expect("Location", "/signin?return_to=/extensions/company-number");
    expect(response.status).toEqual(302);
  });


  it("should not redirect to signin if /extensions/* called while signed in", async () => {
    const response = await request(app)
      .get("/extensions/company-number")
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`]);
    expect(response.status).toEqual(200);
  });

  it("should redirect to original request url if /extensions/*/download called and not signed in", async () => {
    setNotSignedIn();
    const url: string = "/extensions/download/company/1234/extensions/requests/5678/reasons/623826183/attachments/a7c4f600/download";
    const response = await request(app)
      .get(url)
      .set("Referer", "/")
      .expect("Location", "/signin?return_to=" + url);
    expect(response.status).toEqual(302);
  });
});

const setNotSignedIn = () => {
  mockCacheService.prototype.constructor.mockImplementationOnce((cookieId) => {
    const session: Session = Session.newWithCookieId(cookieId);
    session.data = {
      [keys.COMPANY_NUMBER]: "00006400",
      [keys.SIGN_IN_INFO]: {
        [keys.SIGNED_IN]: 0
      }
    };
    return session;
  });
};
