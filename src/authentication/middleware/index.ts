import { NextFunction, Request, Response } from "express";
import activeFeature from "../../feature.flag";
import logger from "../../logger";
import * as pageURLs from "../../model/page.urls";

export default (req: Request, res: Response, next: NextFunction) => {
  const referringPageURL = req.header("Referer") as string;

  // If in accessibility testing mode, don't return user to start
  // we want them to be shown the sign in screen below, so the tests can
  // sign in then access the page directly
  if (!activeFeature(process.env.ACCESSIBILITY_TEST_MODE)) {
    logger.debug("Check if user has referer");
    if (referringPageURL === undefined && !req.originalUrl.endsWith(pageURLs.DOWNLOAD_PREFIX)) {
      logger.debug("User has no referer - redirecting to index");
      return res.redirect(pageURLs.EXTENSIONS);
    }
  }

  logger.debug("Check if user is signed in");
  if (!req.originalUrl.endsWith(pageURLs.ACCESSIBILITY_STATEMENT)) {
    if (!req.chSession.isSignedIn()) {

      logger.debug("User not signed in");

      logger.debug("User not signed in - redirecting to login screen");

      const returnToUrl = getReturnToUrl(req.originalUrl, referringPageURL);

      return res.redirect("/signin?return_to=" + returnToUrl);
    }
  }
  next();
};

function getReturnToUrl(originalUrl: string, referringPageURL: string) {
  let returnToUrl: string = pageURLs.EXTENSIONS;
  if (!activeFeature(process.env.ACCESSIBILITY_TEST_MODE)) {
    if (originalUrl.endsWith("/download")) {
      // User has come here from clicking a download link

      // TODO Add some further checks on the URL here? Perhaps using a reg exp?

      const REDIRECTS_WHITELIST = {};
      REDIRECTS_WHITELIST[originalUrl] = originalUrl;

      returnToUrl = REDIRECTS_WHITELIST[originalUrl];
    } else if (referringPageURL.endsWith(pageURLs.EXTENSIONS)) {
      // User has come here from the start page
      return pageURLs.EXTENSIONS_COMPANY_NUMBER;
    }
  }

  return returnToUrl;
}
