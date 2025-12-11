jest.mock("ioredis");
jest.mock("../../session/store/redis.store");
jest.mock("../../feature.flag");
jest.mock("../../logger");
jest.mock("redis", () => {
  return {
    createClient: jest.fn().mockReturnThis(),
    on: jest.fn().mockReturnThis(),
  }
});

import { loadSession, saveSession } from "../../services/redis.service";
import Session from "../../session/session";
import redisStore from "../../session/store/redis.store";
import activeFeature from "../../feature.flag";
import logger from "../../logger";

const mockLoggerInfo = logger.info as jest.Mock;
const mockActiveFeature = activeFeature as jest.Mock;
const mockRedisStoreSave = redisStore.save as jest.Mock;
const mockRedisStoreGetData = redisStore.getData as jest.Mock;

const COOKIE_ID = "123456789";

describe("redis service tests", () => {

  beforeEach(() => {
    jest.resetAllMocks();
    mockActiveFeature.mockReturnValue(false);

  });

  it("Should call save on redisStore", async () => {
    const session = Session.newInstance();

    await saveSession(session);

    expect(mockRedisStoreSave).toHaveBeenCalledTimes(1);
    expect(mockRedisStoreSave.mock.calls[0][0]).toEqual(session);
  });

  it("Should log session info on save when flag is on", async () => {
    mockActiveFeature.mockReturnValue(true);
    const session = Session.newInstance();

    await saveSession(session);

    const logMessage = mockLoggerInfo.mock.calls[0][0];
    expect(logMessage).toContain("SAVING session");
  });

  it("Should not log session info on save when flag is off", async () => {
    mockActiveFeature.mockReturnValue(false);
    const session = Session.newInstance();

    await saveSession(session);

    expect(mockLoggerInfo).not.toHaveBeenCalled();
  });

  it("Should call getData on redisStore", async () => {
    const session: Session = await loadSession(COOKIE_ID);

    expect(mockRedisStoreGetData).toHaveBeenCalledTimes(1);
    expect(mockRedisStoreGetData.mock.calls[0][0]).toEqual(session.sessionKey());
  });

  it("Should log session info on load when flag is on", async () => {
    mockActiveFeature.mockReturnValue(true);

    await loadSession(COOKIE_ID);

    const logMessage1 = mockLoggerInfo.mock.calls[0][0];
    expect(logMessage1).toContain("LOADING session");

    const logMessage2 = mockLoggerInfo.mock.calls[1][0];
    expect(logMessage2).toContain("LOADED session")
  });

  it("Should not log session info on load when flag is off", async () => {
    mockActiveFeature.mockReturnValue(false);

    await loadSession(COOKIE_ID);

    expect(mockLoggerInfo).not.toHaveBeenCalled();
  });

  it("Should hide access tokens from log", async () => {
    mockActiveFeature.mockReturnValue(true);
    const session = Session.newInstance();
    session.data = {
        signin_info: {
            access_token: {
                access_token: "ABCDE",
                refresh_token: "FGHIJ"
            },
            user_profile: {
              forename: "BOB",
              surname: "SMITH"
            }
        }
    }

    await saveSession(session);

    const logMessage = mockLoggerInfo.mock.calls[0][0];
    expect(logMessage).toContain("*** HIDDEN ***");
    expect(logMessage).not.toContain("ABCDE");
    expect(logMessage).not.toContain("FGHIJ");
    expect(logMessage).not.toContain("BOB");
    expect(logMessage).not.toContain("SMITH");
  });
});
