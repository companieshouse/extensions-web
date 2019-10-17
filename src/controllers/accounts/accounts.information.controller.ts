import {NextFunction, Request, Response} from "express";
import * as pageURLs from "../../model/page.urls";
import {check, validationResult} from "express-validator/check";
import * as errorMessages from "../../model/error.messages";
import {ValidationError} from "../../model/validation.error";
import {createGovUkErrorData, GovUkErrorData} from "../../model/govuk.error.data";
import * as templatePaths from "../../model/template.paths";
import * as keys from "../../session/keys";
import * as reasonService from "../../services/reason.service";
import * as sessionService from "../../services/session.service";
import {removeNonPrintableChars} from "../../global/string.formatter";
import {ReasonWeb} from "../../model/reason/extension.reason.web";

const validators = [
  check("accountsInformation").custom((reason, {req}) => {
    if (!req.body.accountsInformation
      || req.body.accountsInformation.trim().length === 0) {
      throw Error(errorMessages.NO_INFORMATION_INPUT);
    }
    return true;
  }),
];

export const render = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  if (req.query.reasonId) {
    await sessionService.setReasonInContextAsString(req.chSession, req.query.reasonId);
  }
  let infoStr;
  const reason: ReasonWeb = await reasonService.getCurrentReason(req.chSession) as ReasonWeb;
  if (reason) {
    infoStr = reason.reason_information;
  }
  if (infoStr) {
      return res.render(templatePaths.ACCOUNTS_INFORMATION, {
      information: infoStr,
      templateName: templatePaths.ACCOUNTS_INFORMATION,
    });
  } else {
    return res.render(templatePaths.ACCOUNTS_INFORMATION, {
      templateName: templatePaths.ACCOUNTS_INFORMATION,
    });
  }
};

const route = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errMsg: string = errors.array().map((err: ValidationError) => err.msg).pop() as string;
    const inputErr: GovUkErrorData = createGovUkErrorData(errMsg,
      "#accounts-information", true, "");
    return res.render(templatePaths.ACCOUNTS_INFORMATION, {
      errorList: [
        inputErr,
      ],
      inputError: inputErr,
      templateName: templatePaths.ACCOUNTS_INFORMATION,
    });
  }

  await reasonService.updateReason(
    req.chSession,
    {reason_information: removeNonPrintableChars(req.body.accountsInformation)});

  const changingDetails = req.chSession.data[keys.CHANGING_DETAILS];
  if (changingDetails) {
    return res.redirect(pageURLs.EXTENSIONS_CHECK_YOUR_ANSWERS);
  } else {
    return res.redirect(pageURLs.EXTENSIONS_EVIDENCE_OPTION);
  }
};

export default [...validators, route];
