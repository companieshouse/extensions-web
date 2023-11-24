import activeFeature from "../../feature.flag";
import RequestCountMonitor from "../../global/request.count.monitor";
import { NextFunction, Request, Response } from "express";
import logger from "../../logger";
import * as templatePaths from "../../model/template.paths";
import {formatDateForDisplay} from "../../client/date.formatter";

export default (req: Request, res: Response, next: NextFunction) => {
  if (activeFeature(process.env.FEATURE_REQUEST_COUNT)) {
    if (RequestCountMonitor.maximumRequestsPerDayExceeded()) {
      logger.info("Number of requests exceeded ");
      const tomorrowsDate = new Date();
      tomorrowsDate.setDate(tomorrowsDate.getDate() + 1);
      return res.render(templatePaths.ERROR_MAX_REQUESTS,
        {tomorrowsDate: formatDateForDisplay(tomorrowsDate.toString())});
    } else {
      logger.info("Number of requests fine");
    }
  } else {
    logger.info("Feature flag is toggled off for request number monitor");
  }
  next();
};
