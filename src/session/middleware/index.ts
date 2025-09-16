import { NextFunction, Request, Response } from "express";
import activeFeature from "../../feature.flag";
import logger from "../../logger";
import { COOKIE_NAME } from "../config";
import Session from "../session";
import * as redisService from "../../services/redis.service";

/**
 * adds session property to request session object.
 */
declare global {
  namespace Express {
    interface Request {
      chSession: Session;
    }
  }
}

export default async (req: Request, res: Response, next: NextFunction) => {
  const cookieId = req.cookies[COOKIE_NAME];
  // if there is no cookie, we need to create a new session
  if (!cookieId && activeFeature(process.env.SESSION_CREATE)) {
    logger.info("No cookie found, creating new session");
    const session = Session.newInstance();
    session.setClientSignature(req.get("user-agent") ?? "", req.ip ?? "");
    await redisService.saveSession(session);

    // set the cookie for future requests
    req.chSession = session;
    res.cookie(COOKIE_NAME, session.cookieId, {path: "/"});
  } else {
    logger.info("cookie found, loading session from redis: " + cookieId);
    req.chSession = await redisService.loadSession(cookieId);
  }

  next();
};
