import { CsrfError } from "@companieshouse/web-security-node";
import { NextFunction, Request, Response } from "express";

import logger from "../logger";
import * as errorMessages from "../model/error.messages";
import * as templatePaths from "../model/template.paths";

/**
 * This handler catches all routes that don't match a handler i.e. 404 Not Found, because of its position
 * in the middleware chain.
 */
const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  logger.error(errorMessages.ERROR_404 + `${req.path}`);
  return res.status(404).render(templatePaths.ERROR_404);
};

/**
 * This handler catches any CSRF errors thrown within the application.
 * If it is not a CSRF, the error is passed to the next error handler.
 * If it is a CSRF error, it responds with a 403 forbidden status and renders the CSRF error.
 */

const csrfErrorHandler = (err: CsrfError | Error, req: Request, res: Response, next: NextFunction) => {
  if (!(err instanceof CsrfError)) {
    return next(err);
  }

  return res.status(403).render(templatePaths.ERROR, {
    templateName: templatePaths.ERROR,
    csrfErrors: true
  });
};

/**
 * This handler catches any other error/exception thrown within the application. Always keep this as the
 * last handler in the chain for it to work.
 */
const errorHandler = async (err: unknown, req: Request, res: Response, next: NextFunction) => {
  logger.error(errorMessages.ERROR_500);
  logger.error(err);
  res.status(500).render(templatePaths.ERROR);
};

export default [notFoundHandler, csrfErrorHandler, errorHandler];
