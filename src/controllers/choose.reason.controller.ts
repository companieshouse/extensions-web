import { NextFunction, Request, Response } from "express";
import { check, validationResult } from "express-validator/check";
import * as sessionService from "../services/session.service";
import * as errorMessages from "../model/error.messages";
import {createGovUkErrorData, GovUkErrorData} from "../model/govuk.error.data";
import * as templatePaths from "../model/template.paths";
import { ValidationError } from "../model/validation.error";
import * as apiClient from "../client/apiclient";
import { IExtensionRequest } from "session/types";
import * as reasonService from "../services/reason.service";
import * as keys from "../session/keys";

let errorType: string = "";

const validators = [
  check("extensionReason").not().isEmpty().withMessage(errorMessages.EXTENSION_REASON_NOT_SELECTED),
  check("extensionReason").custom((reason, {req}) => {
    errorType = "";
    if (reason === "other" &&
      (!req.body.otherReason || req.body.otherReason.trim().length === 0)) {
      errorType = "invalid";
      throw Error(errorMessages.EXTENSION_OTHER_TEXT_NOT_PROVIDED);
    }
    return true;
  }),
];

export const render = (req: Request, res: Response, next: NextFunction): void => {
  return res.render(templatePaths.CHOOSE_REASON, {
    isAccountingIssuesChecked: req.chSession.data[keys.EXTENSION_SESSION][keys.ACCOUNTING_ISSUES_CHOSEN],
    isIllnessChecked: req.chSession.data[keys.EXTENSION_SESSION][keys.ILLNESS_CHOSEN],
    isOtherReasonChecked: req.chSession.data[keys.EXTENSION_SESSION][keys.OTHER_CHOSEN],
    templateName: templatePaths.CHOOSE_REASON,
  });
};

const route = async (req: Request, res: Response, next: NextFunction): Promise<void> => {

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errMsg: string = errors.array().map((err: ValidationError) => err.msg).pop() as string;
    if (errMsg) {
      const extReasonErr: GovUkErrorData = createGovUkErrorData(errMsg,
        "#choose-reason", true, errorType);
      return res.render(templatePaths.CHOOSE_REASON, {
        errorList: [
          extReasonErr,
        ],
        extensionReasonErr: extReasonErr,
        templateName: templatePaths.CHOOSE_REASON,
      });
    }
  }
  await setCheckDetailsToDefault(req);

  const currentReason = await reasonService.getCurrentReason(req.chSession);
  if (currentReason && currentReason.reason_status === "DRAFT") {
    await reasonService.deleteCurrentReason(req.chSession);
  }

  switch (req.body.extensionReason) {
    case "illness":
      await sessionService.updateExtensionSessionValue(req.chSession, keys.ILLNESS_CHOSEN, true);
      await sessionService.updateExtensionSessionValue(req.chSession, keys.ACCOUNTING_ISSUES_CHOSEN, false);
      await sessionService.updateExtensionSessionValue(req.chSession, keys.OTHER_CHOSEN, false);
      return await addReason(req, res, (request) =>
        request.body.extensionReason, templatePaths.REASON_ILLNESS);
    case "accounting issues":
      await sessionService.updateExtensionSessionValue(req.chSession, keys.ILLNESS_CHOSEN, false);
      await sessionService.updateExtensionSessionValue(req.chSession, keys.ACCOUNTING_ISSUES_CHOSEN, true);
      await sessionService.updateExtensionSessionValue(req.chSession, keys.OTHER_CHOSEN, false);
      return await addReason(req, res, (request) =>
        request.body.extensionReason, templatePaths.REASON_ACCOUNTING_ISSUE);
    case "other":
      await sessionService.updateExtensionSessionValue(req.chSession, keys.ILLNESS_CHOSEN, false);
      await sessionService.updateExtensionSessionValue(req.chSession, keys.ACCOUNTING_ISSUES_CHOSEN, false);
      await sessionService.updateExtensionSessionValue(req.chSession, keys.OTHER_CHOSEN, true);
      return await addReason(req, res, (request) =>
        request.body.otherReason, templatePaths.REASON_OTHER);
  }
};

const addReason = async (req: Request, res: Response, reasonBody, redirectPath: string): Promise<void> => {
  const token = req.chSession.accessToken();
  const companyNumber = sessionService.getCompanyInContext(req.chSession);
  const request: IExtensionRequest = sessionService.getRequest(req.chSession);
  if (token && request) {
    const reasonResponse = await apiClient.addExtensionReasonToRequest(
      companyNumber, token, request.extension_request_id, reasonBody(req));
    await addReasonToSession(req, reasonResponse.id);
  }
  return res.redirect(redirectPath);
};

const setCheckDetailsToDefault = async (req: Request): Promise<void> => {
  await sessionService.changingDetails(req.chSession, false);
};

const addReasonToSession = async (req: Request,
                                  reasonId: string): Promise<void> => {
  await sessionService.setReasonInContextAsString(req.chSession, reasonId);
};

export default[...validators, route];
