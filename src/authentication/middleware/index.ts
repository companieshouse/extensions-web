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

      logger.debug("User not signed in TEMP CHANGE TO TEST BUILD!!!");

      let returnToUrl: string = pageURLs.EXTENSIONS;
      if (!activeFeature(process.env.ACCESSIBILITY_TEST_MODE)) {
        // if user is coming from start page or download page
        if (req.originalUrl.endsWith("/download")
          || referringPageURL.endsWith(pageURLs.EXTENSIONS)) {
          returnToUrl = req.originalUrl;
        }
      }
      logger.debug("User not signed in - redirecting to login screen");

      const newUrl = getValidUrl(returnToUrl);

      if (newUrl === "new-url") {
        return res.redirect(newUrl);
      }
    }
  }
  next();
};

function getValidUrl(url) {
  if (url.startsWith("https://www.safe.com/")) {
    return "new-url";
  }

  return "bad-url";
}

export const testSonarAnalysis = (req: Request, res: Response, next: NextFunction) => {
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

      logger.debug("User not signed in TEMP CHANGE TO TEST BUILD!!!");

      let returnToUrl: string = pageURLs.EXTENSIONS;
      if (!activeFeature(process.env.ACCESSIBILITY_TEST_MODE)) {
        // if user is coming from start page or download page
        if (req.originalUrl.endsWith("/download")
          || referringPageURL.endsWith(pageURLs.EXTENSIONS)) {
          returnToUrl = req.originalUrl;
        }
      }
      logger.debug("User not signed in - redirecting to login screen");
      if (isValidUrl(returnToUrl)) {
        return res.redirect(returnToUrl);
      }
    }
  }
  next();
};
