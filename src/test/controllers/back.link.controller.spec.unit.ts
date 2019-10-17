import app from "../../app";
import * as request from "supertest";
import {loadSession} from "../../services/redis.service";
import {updateHistory} from "../../services/session.service";
import Session from "../../session/session";
import {loadMockSession} from "../mock.utils";
import * as keys from "../../session/keys";
import * as pageURLs from "../../model/page.urls";
import {COOKIE_NAME} from "../../session/config";

jest.mock("../../services/redis.service");
jest.mock("../../services/session.service");

const mockCacheService = (<unknown> loadSession as jest.Mock<typeof loadSession>);
const mockUpdateHistory = (<unknown>updateHistory as jest.Mock<typeof updateHistory>);

beforeEach(() => {
  loadMockSession(mockCacheService);
  mockCacheService.mockClear();
  mockUpdateHistory.mockClear();
  mockCacheService.prototype.constructor.mockImplementationOnce((cookieId) => {
    const session: Session = Session.newWithCookieId(cookieId);
    session.data = {
      [keys.SIGN_IN_INFO]: {
        [keys.SIGNED_IN]: 1,
      },
      [keys.PAGE_HISTORY]: {
        page_history:["/extensions/first-page", "/extensions/page-before-that", "/extensions/previous-page"],
      }
    };
    return session;
  });
});

describe("click back link tests", () => {
  it("should remove last page",async ()=> {
    const res = await request(app)
      .get(pageURLs.EXTENSIONS_BACK_LINK)
      .set("referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`]);

    expect(res.status).toEqual(302);
    expect(mockUpdateHistory).toBeCalledWith(
      {page_history:["/extensions/first-page", "/extensions/page-before-that"]},
      {
        _cookieId: "123",
        _data: {
          page_history:
            {page_history: ["/extensions/first-page", "/extensions/page-before-that"]},
          signin_info: {signed_in: 1}
        }
      });
  });

  it("should remove last two pages when referer is the same as top page on history stack",async ()=> {
    const res = await request(app)
      .get(pageURLs.EXTENSIONS_BACK_LINK)
      .set("referer", "http:/test:1234/extensions/previous-page")
      .set("Cookie", [`${COOKIE_NAME}=123`]);

    expect(res.status).toEqual(302);
    expect(mockUpdateHistory).toBeCalledWith(
      {page_history:["/extensions/first-page"]},
      {
        _cookieId: "123",
        _data: {
          page_history:
            {page_history: ["/extensions/first-page"]},
          signin_info: {signed_in: 1}
        }
      });
  });

  it("should remove last page when referer is undefined",async ()=> {
    const res = await request(app)
      .get(pageURLs.EXTENSIONS_BACK_LINK)
      .set("Cookie", [`${COOKIE_NAME}=123`]);
    expect(res.status).toEqual(302);
    expect(mockUpdateHistory).toBeCalledWith(
      {page_history:["/extensions/first-page", "/extensions/page-before-that"]},
      {
        _cookieId: "123",
        _data: {
          page_history:
            {page_history: ["/extensions/first-page", "/extensions/page-before-that"]},
          signin_info: {signed_in: 1}
        }
      });

  });
});
