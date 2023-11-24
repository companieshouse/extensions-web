import { NextFunction, Request, Response } from "express";
import { check, validationResult, ValidationError } from "express-validator";
import * as sessionService from "../services/session.service";
import * as errorMessages from "../model/error.messages";
import {createGovUkErrorData, GovUkErrorData} from "../model/govuk.error.data";
import * as templatePaths from "../model/template.paths";
import * as apiClient from "../client/apiclient";
import { IExtensionRequest } from "session/types";
import * as reasonService from "../services/reason.service";
import * as keys from "../session/keys";

const validators = [
  check("extensionReason").not().isEmpty().withMessage(errorMessages.EXTENSION_REASON_NOT_SELECTED),
];

export const render = (req: Request, res: Response, next: NextFunction): void => {
  let accountingIssuesChecked: boolean = false;
  let illnessChecked: boolean = false;
  let missingAuthenticationCodeChecked: boolean = false;
  let otherChecked: boolean = false;
  if (req.chSession.data[keys.EXTENSION_SESSION] !== undefined) {
    accountingIssuesChecked = req.chSession.data[keys.EXTENSION_SESSION][keys.ACCOUNTING_ISSUES_CHOSEN];
    missingAuthenticationCodeChecked = req.chSession.data
      [keys.EXTENSION_SESSION]
      [keys.MISSING_AUTHENTICATION_CODE_CHOSEN];
    illnessChecked = req.chSession.data[keys.EXTENSION_SESSION][keys.ILLNESS_CHOSEN];
    otherChecked = req.chSession.data[keys.EXTENSION_SESSION][keys.OTHER_CHOSEN];
  }
  return res.render(templatePaths.CHOOSE_REASON, {
    isAccountingIssuesChecked: accountingIssuesChecked,
    isIllnessChecked: illnessChecked,
    isMissingAuthCodeChecked: missingAuthenticationCodeChecked,
    isOtherReasonChecked: otherChecked,
    templateName: templatePaths.CHOOSE_REASON,
  });
};

const route = async (req: Request, res: Response, next: NextFunction): Promise<void> => {

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errMsg: string = errors.array().map((err: ValidationError) => err.msg).pop() as string;
    if (errMsg) {
      const extReasonErr: GovUkErrorData = createGovUkErrorData(errMsg,
        "#choose-reason", true, "");
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
      await updateChosenReasonKeys(req, true, false, false, false);
      return await addReason(req, res, (request) =>
        request.body.extensionReason, templatePaths.REASON_ILLNESS);
    case "accounting issues":
      await updateChosenReasonKeys(req, false, true, false, false);
      return await addReason(req, res, (request) =>
        request.body.extensionReason, templatePaths.REASON_ACCOUNTING_ISSUE);
    case "other":
      await updateChosenReasonKeys(req, false, false, false, true);
      return await addReason(req, res, (request) =>
        request.body.extensionReason, templatePaths.REASON_OTHER);
  }
};

const updateChosenReasonKeys = async (
  req: Request,
  illnessChosen: boolean,
  accountingIssuesChosen: boolean,
  missingAuthCodeChosen: boolean,
  otherChosen: boolean): Promise<void> => {
  await sessionService.updateExtensionSessionValue(
    req.chSession, keys.ILLNESS_CHOSEN, illnessChosen);
  await sessionService.updateExtensionSessionValue(
    req.chSession, keys.ACCOUNTING_ISSUES_CHOSEN, accountingIssuesChosen);
  await sessionService.updateExtensionSessionValue(
    req.chSession, keys.MISSING_AUTHENTICATION_CODE_CHOSEN, missingAuthCodeChosen);
  await sessionService.updateExtensionSessionValue(
    req.chSession, keys.OTHER_CHOSEN, otherChosen);
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

export default [...validators, route];
