import { Request, Response, NextFunction } from "express";
import logger from "../../logger";
import * as templates from "../../model/template.paths";
import activeFeature from "../../feature.flag";

/**
 * Shows service unavailable page if config flag SHOW_SERVICE_UNAVAILABLE_PAGE=on
 */
export default (req: Request, res: Response, next: NextFunction) => {
  if (activeFeature(process.env.SHOW_SERVICE_UNAVAILABLE_PAGE)) {
    logger.info("-- SERVICE UNAVAILABLE -- To change set SHOW_SERVICE_UNAVAILABLE_PAGE=off in config");
    return res.render(templates.SERVICE_UNAVAILABLE);
  }
  next();
};
