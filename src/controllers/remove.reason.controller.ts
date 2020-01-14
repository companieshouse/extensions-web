import {NextFunction, Request, Response} from "express";
import { check, validationResult } from "express-validator/check";
import * as errorMessages from "../model/error.messages";
import logger from "../logger";
import {createGovUkErrorData, GovUkErrorData} from "../model/govuk.error.data";
import * as templatePaths from "../model/template.paths";
import { ValidationError } from "../model/validation.error";
import * as pageUrls from "../model/page.urls";
import { ExtensionsCompanyProfile, getCompanyProfile, removeExtensionReasonFromRequest } from "../client/apiclient";
import * as sessionService from "../services/session.service";
import * as apiClient from "../client/apiclient";
import { IExtensionRequest } from "session/types";

const validators = [
  check("removeReason").not().isEmpty().withMessage(errorMessages.REMOVE_REASON_CONFIRMATION_NOT_SELECTED),
];

/**
 * Go through extension reasons and filter based on the query parameter matching the reason number
 * set this reason as a removal candidate and save back to redis.
 * render the page with this reason.
 * @param req - express request
 * @param res - express response
 * @param next - express next function
 */
const removeReasonGetRoute = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const companyNumber: string = sessionService.getCompanyInContext(req.chSession);
  try {
    logger.info(`Company number ${companyNumber} found in session, retrieving company profile`);
    const renderValues = await getPageRender(companyNumber, req);
    return res.render(templatePaths.REMOVE_REASON, renderValues);
  } catch (e) {
    logger.error(`Error retrieving company number ${companyNumber} from redis`, e);
    return next(e);
  }
};

const getPageRender = async (companyNumber: string, req: Request) => {
  const token: string = req.chSession.accessToken() as string;
  const companyInSession: ExtensionsCompanyProfile = await getCompanyProfile(companyNumber, token);
  const request: IExtensionRequest = sessionService.getRequest(req.chSession);
  const reasons = await apiClient.getReasons(request, token);
  const filteredReason = await filterReasonToRemove(reasons, req.query.id);
  await sessionService.setReasonInContextAsString(req.chSession, req.query.id);
  return {
    company: companyInSession,
    extensionLength: reasons.items.length,
    reason: filteredReason,
    reasonDisplayNumber: req.query.reasonNumber,
  };
};

/**
 * Filter the extension reason for removal. At this point a user can choose yes or no. This is
 * determined by a post request. Changing the object state to be true for removalCandidate
 * can ensure that the post request will pick up the correct reason for deleting.
 * This until a specific reason has a generated id in the api that can be easily tracked in
 * the web
 * @param reasons
 * @param reasonId
 */
const filterReasonToRemove = async (reasons: apiClient.ListReasonResponse, reasonId: string) => {
  return reasons.items
    .filter((reason) => reason.id === reasonId)
    .pop();
};

/**
 * Search the session for an extension reason that has a removal candidate flag and filter.
 * This leaves an array of extension reasons that are to remain.
 * Save this back to redis and return to the summary page.
 * If the removeReason is set to 'no' then ensure that all reasons are not removal candidates.
 * @param req - express request
 * @param res - express response
 * @param next - express nextFunction
 */
const removeReasonPostRoute = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const extReasonErr = scanForErrors(req, res);
  if (extReasonErr) {
    const companyNumber: string = sessionService.getCompanyInContext(req.chSession);
    const renderValues = await getPageRender(companyNumber, req);
    const errors = {
      errorList: [
        extReasonErr,
      ],
      extensionReasonErr: extReasonErr,
    };
    const jsonReturn = Object.assign({}, renderValues, errors);
    return res.render(templatePaths.REMOVE_REASON, jsonReturn);
  }

  if (req.body.removeReason === "yes") {
    const request: IExtensionRequest = sessionService.getRequest(req.chSession);
    const token: string = req.chSession.accessToken() as string;
    if (request && token) {
      await removeExtensionReasonFromRequest(request, token);
      const reasons = await apiClient.getReasons(request, token);
      if (reasons.items.length === 0) {
        return res.redirect(pageUrls.EXTENSIONS_CHOOSE_REASON);
      }
    }
  }
  return res.redirect(pageUrls.EXTENSIONS_CHECK_YOUR_ANSWERS);
};

const scanForErrors = (req: Request, res: Response): GovUkErrorData | undefined => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errMsg: string = errors.array().map((err: ValidationError) => err.msg).pop() as string;
    if (errMsg) {
      return createGovUkErrorData(errMsg,
        "#remove-reason", true, "");
    }
  }
};

export {removeReasonGetRoute};
export default [validators, removeReasonPostRoute];
