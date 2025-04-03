import logger from "../logger";
import Session from "../session/session";
import redisStore from "../session/store/redis.store";
import activeFeature from "../feature.flag";

/**
 * Saves a session to redis.
 * @param chSession
 */
const saveSession = async (chSession: Session): Promise<void> => {
  logSignInInfo(chSession, "SAVING");
  await redisStore.save(chSession);
};

/**
 * Loads a session from the redis store.
 * @param cookieId
 */
const loadSession = async (cookieId: string): Promise<Session> => {
  const session: Session = Session.newWithCookieId(cookieId);
  const sessionKey = session.sessionKey();

  if (activeFeature(process.env.LOG_SIGNIN_INFO)) {
    logger.info("src/services/redis.service.ts - LOADING session from Redis with cookieId = " + cookieId + ", sessionKey = " + sessionKey);
  }
  session.data = await redisStore.getData(sessionKey);
  logSignInInfo(session, "LOADED", cookieId);
  return session;
};

const logSignInInfo = (chSession: Session, saveOrLoadText: string, cookieId?) => {
  if (activeFeature(process.env.LOG_SIGNIN_INFO)) {
    const copyOfSignInInfo = structuredClone(chSession["_data"]?.signin_info);

    if (copyOfSignInInfo?.access_token?.access_token) {
      copyOfSignInInfo.access_token.access_token = "*** HIDDEN ***";
    }
    if (copyOfSignInInfo?.access_token?.refresh_token) {
      copyOfSignInInfo.access_token.refresh_token = "*** HIDDEN ***";
    }
    if (copyOfSignInInfo?.user_profile?.forename) {
      copyOfSignInInfo.user_profile.forename = "*** HIDDEN ***";
    }
    if (copyOfSignInInfo?.user_profile?.surname) {
      copyOfSignInInfo.user_profile.surname = "*** HIDDEN ***";
    }
    logger.info(`src/services/redis.service.ts - ${saveOrLoadText} session to/from Redis with sessionKey = ${chSession?.sessionKey()} , cookieId = ${cookieId}, signin_info = ${JSON.stringify(copyOfSignInInfo, null, 2)}`);
  }
};

export {saveSession, loadSession};
