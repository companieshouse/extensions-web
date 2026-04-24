import { NextFunction, Request, Response } from "express";
import activeFeature from "../../feature.flag";
import logger from "../../logger";
import * as pageUrls from "../../model/page.urls";

export default (req: Request, res: Response, next: NextFunction) => {
  if (req.originalUrl === pageUrls.EXTENSIONS_HEALTHCHECK) {
    logger.debug("/healthcheck endpoint called, skipping authentication.");
    return next();
  }

  const referringPageURL = req.header("Referer") as string;

  // If in accessibility testing mode, don't return user to start
  // we want them to be shown the sign in screen below, so the tests can
  // sign in then access the page directly
  if (!activeFeature(process.env.ACCESSIBILITY_TEST_MODE)) {
    logger.debug("Check if user has referer");
    if (referringPageURL === undefined && !isDownloadUrl(req.originalUrl)) {
      logger.debug("User has no referer - redirecting to index");
      return res.redirect(pageUrls.EXTENSIONS);
    }
  }

  logger.debug("Check if user is signed in");
  if (!req.originalUrl.endsWith(pageUrls.ACCESSIBILITY_STATEMENT)) {
    if (!req.chSession.isSignedIn()) {

      logger.debug("User not signed in - redirecting to login screen");

      const returnToUrl = getReturnToUrl(req.originalUrl, referringPageURL);

      return res.redirect("/signin?return_to=" + returnToUrl);
    }
  }
  next();
};

function getReturnToUrl(originalUrl: string, referringPageURL: string) {
  let returnToUrl: string = pageUrls.EXTENSIONS;
  if (!activeFeature(process.env.ACCESSIBILITY_TEST_MODE)) {
    if (isDownloadUrl(originalUrl)) {
      // User has come here from clicking a download link

      // This subterfuge is to satisfy a reported Sonar security vulnerability - the fact that this is a relative
      // URL and has already been checked by the 'isDownloadUrl()' function also ensures that it is safe
      const ALLOWED_DOWNLOAD_URL = {};
      ALLOWED_DOWNLOAD_URL[originalUrl] = originalUrl;

      returnToUrl = ALLOWED_DOWNLOAD_URL[originalUrl];
    } else if (referringPageURL.endsWith(pageUrls.EXTENSIONS)) {
      // User has come here from the start page - company number page is next, immediately after sign-in
      returnToUrl = pageUrls.EXTENSIONS_COMPANY_NUMBER;
    }
  }

  return returnToUrl;
}

function isDownloadUrl(url: string) {
  return url.startsWith(pageUrls.EXTENSIONS + pageUrls.DOWNLOAD_PREFIX)
    && url.includes(pageUrls.DOWNLOAD_EXTENSIONS_REQUESTS)
    && url.endsWith(pageUrls.DOWNLOAD_SUFFIX);
}
