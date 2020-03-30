import { Request, Response, NextFunction } from "express";
import logger from "../../logger";
import * as templates from "../../model/template.paths";
import activeFeature from "../../feature.flag";

export default (req: Request, res: Response, next: NextFunction) => {
  logger.info("Checking service availability");
  if (!activeFeature(process.env.SERVICE_AVAILABLE)) {
    logger.info("-- SERVICE UNAVAILABLE -- To change set SERVICE_AVAILABLE=true in config");
    return res.render(templates.SERVICE_UNAVAILABLE);
  }
  logger.info("-- SERVICE AVAILABLE -- To change set SERVICE_AVAILABLE=false in config");
  next();
};
