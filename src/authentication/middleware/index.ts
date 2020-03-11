import { NextFunction, Request, Response } from "express";
import activeFeature from "../../feature.flag";
import logger from "../../logger";
import * as pageURLs from "../../model/page.urls";

export default (req: Request, res: Response, next: NextFunction) => {
  const referringPageURL = req.header("Referer") as string;

  logger.debug("Check if user has referer");
  if (referringPageURL === undefined && !req.originalUrl.endsWith(pageURLs.DOWNLOAD_PREFIX)) {
    logger.debug("User has no referer - redirecting to index");
    return res.redirect(pageURLs.EXTENSIONS);
  }

  logger.debug("Check if user is signed in");
  if (!req.chSession.isSignedIn()) {

    logger.debug("User not signed in");

    let returnToUrl: string = pageURLs.EXTENSIONS;
    if (!activeFeature(process.env.ACCESSIBILITY_TEST_MODE)) {
      // if user is coming from start page or download page
      if (req.originalUrl.endsWith("/download")
          || referringPageURL.endsWith(pageURLs.EXTENSIONS)) {
        returnToUrl = req.originalUrl;
      }
    }
    logger.debug("User not signed in - redirecting to login screen");
    return res.redirect("/signin?return_to=" + returnToUrl);
  }
  next();
};
