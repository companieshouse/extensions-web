import Session from "../../session/session";
import * as keys from "../../session/keys";

describe("Session tests", () => {

  it("should create a 28 character length session key as data id", () => {
    const session: Session = Session.newInstance();

    expect(session.sessionKey().length).toEqual(28);
    expect(session.cookieId.length).toBeGreaterThan(28);
    expect(session.data[".id"]).toEqual(session.sessionKey());
  });

  it("should use the supplied cookieId", () => {
    const session: Session = Session.newWithCookieId("Key");

    expect(session.cookieId).toEqual("Key");
  });

  it("should set last access and expire time", () => {
    jest.spyOn(Date.prototype, "getTime").mockReturnValueOnce(1e10);

    const session: Session = Session.newInstance();

    const timeLimitStr = process.env.DEFAULT_SESSION_EXPIRATION || "1";
    const timeLimit = parseInt(timeLimitStr);
    expect(session.data["expires"]).toEqual(1e7 + timeLimit);
    expect(session.data["last_access"]).toEqual(1e7);
  });

  it("should set client signature", () => {
    const session: Session = Session.newInstance();

    const userAgent = "userAgent";
    const ip = "1.1.1.1";

    session.setClientSignature(userAgent, ip);

    const expectedSignature = "487046e44f15ce0a0b94703b5416db78f4e903ce";

    expect(session.data[keys.CLIENT_SIG]).toEqual(expectedSignature);
  });
});
