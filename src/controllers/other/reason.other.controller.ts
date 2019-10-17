import {NextFunction, Request, Response} from "express";
import {check, validationResult} from "express-validator/check";
import * as errorMessages from "../../model/error.messages";
import {createGovUkErrorData, GovUkErrorData} from "../../model/govuk.error.data";
import * as pageURLs from "../../model/page.urls";
import * as templatePaths from "../../model/template.paths";
import {ValidationError} from "../../model/validation.error";
import * as keys from "../../session/keys";
import * as reasonService from "../../services/reason.service";
import * as sessionService from "../../services/session.service";
import {removeNonPrintableChars} from "../../global/string.formatter";
import {ReasonWeb} from "../../model/reason/extension.reason.web";

const validators = [
  check("otherInformation").custom((reason, {req}) => {
    if (!req.body.otherInformation
      || req.body.otherInformation.trim().length === 0) {
      throw Error(errorMessages.NO_INFORMATION_INPUT);
    }
    return true;
  }),
];

export const render = async (req: Request, res: Response, next: NextFunction): Promise<void> => {

  if (req.query.reasonId) {
    await sessionService.setReasonInContextAsString(req.chSession, req.query.reasonId);
  }
  const reason: ReasonWeb = await reasonService.getCurrentReason(req.chSession) as ReasonWeb;
  let existingInformation;
  if (reason && reason.reason_information) {
    existingInformation = reason.reason_information;
  }

  if (existingInformation) {
    return res.render(templatePaths.REASON_OTHER, {
      information: existingInformation,
      templateName: templatePaths.REASON_OTHER,
    });
  } else {
    return res.render(templatePaths.REASON_OTHER, {
      templateName: templatePaths.REASON_OTHER,
    });
  }
};

const route = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errMsg: string = errors.array().map((err: ValidationError) => err.msg).pop() as string;
    if (errMsg) {
      const inputErr: GovUkErrorData = createGovUkErrorData(errMsg,
        "#otherInformation", true, "");
      return res.render(templatePaths.REASON_OTHER, {
        errorList: [
          inputErr,
        ],
        inputError: inputErr,
        templateName: templatePaths.REASON_OTHER,
      });
    }
  } else {
    const changingDetails = req.chSession.data[keys.CHANGING_DETAILS];
    await reasonService.updateReason(
      req.chSession,
      {reason_information: removeNonPrintableChars(req.body.otherInformation)});

    if (changingDetails) {
      return res.redirect(pageURLs.EXTENSIONS_CHECK_YOUR_ANSWERS);
    } else {
      return res.redirect(pageURLs.EXTENSIONS_EVIDENCE_OPTION);
    }
  }
};

export default[...validators, route];
