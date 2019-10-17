import { NextFunction, Request, Response } from "express";
import activeFeature from "../../feature.flag";

export default (req: Request, res: Response, next: NextFunction) => {
  if (!req.chSession.isSignedIn()) {
    let returnToUrl: string = "/extensions";
    if (!activeFeature(process.env.ACCESSIBILITY_TEST_MODE)) {
      const referringPageURL = req.header("Referer") as string;
      if (req.originalUrl.endsWith("download")
          || referringPageURL.endsWith("extensions")) {
        returnToUrl = req.originalUrl;
      }
    }
    return res.redirect("/signin?return_to=" + returnToUrl);
  }
  next();
};
