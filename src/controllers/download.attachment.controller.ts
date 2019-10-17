import {NextFunction, Request, Response} from "express";
import {download} from "../client/apiclient";
import logger from "../logger";
import {authenticateForDownload} from "../authentication/middleware/download";
import * as templatePaths from "../model/template.paths";

const route = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  logger.debug("Attempting download of " + req.url);

  const token: string = req.chSession.accessToken() as string;

  await download(req.url, token, res)
    .catch((e) => {
      logger.error(e);
      res.status(e.status ? e.status : 500);
      switch (e.status) {
        case 401: {
          res.render(templatePaths.FILE_ERROR,
            {heading: "Unauthorized", message: "You are not authorized to download this file."});
          break;
        }
        case 403: {
          res.render(templatePaths.FILE_ERROR, {heading: "Forbidden", message: "This file cannot be downloaded."});
          break;
        }
        case 404: {
          res.render(templatePaths.FILE_ERROR, {heading: "Not Found", message: "The file path could not be found."});
          break;
        }
        default: {
          res.render(templatePaths.ERROR);
          break;
        }
      }
    });
};
export default [authenticateForDownload, route];
