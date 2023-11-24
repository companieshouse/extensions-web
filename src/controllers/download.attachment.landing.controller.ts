import {NextFunction, Request, Response} from "express";
import logger from "../logger";
import {authenticateForDownload} from "../authentication/middleware/download";
import {DOWNLOAD_ATTACHMENT_LANDING_PAGE} from "../model/template.paths";

const route = (req: Request, res: Response, next: NextFunction) => {
  const url: string = req.originalUrl.replace("download/", "");
  logger.debug("Download landing page with download url = " + url);
  return res.render(DOWNLOAD_ATTACHMENT_LANDING_PAGE, {downloadUrl: url});
};

export default [authenticateForDownload, route];
