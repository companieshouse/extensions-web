import { Request, Response, NextFunction } from "express";
import logger from "../../logger";
import * as templates from "../../model/template.paths";
import activeFeature from "../../feature.flag";
import * as pageURLs from "../../model/page.urls";

/**
 * Shows service unavailable page if config flag SHOW_SERVICE_UNAVAILABLE_PAGE=on
 * but will not show for download urls - this will allow the internal users to
 * carry on downloading while the service unavailable page is displayed
 */
export default (req: Request, res: Response, next: NextFunction) => {
  if (activeFeature(process.env.SHOW_SERVICE_UNAVAILABLE_PAGE)) {
    if (req.originalUrl && !req.originalUrl.endsWith(pageURLs.DOWNLOAD_SUFFIX)) {
      logger.info("-- SERVICE UNAVAILABLE -- To change set SHOW_SERVICE_UNAVAILABLE_PAGE=off in config");
      return res.render(templates.SERVICE_UNAVAILABLE);
    }
  }
  // feature flag SHOW_SERVICE_UNAVAILABLE_PAGE switched off - carry on as normal
  next();
};
