import {NextFunction, Request, Response} from "express";
import * as pageURLs from "../../model/page.urls";
import {check, validationResult, ValidationError} from "express-validator";
import * as errorMessages from "../../model/error.messages";
import {createGovUkErrorData, GovUkErrorData} from "../../model/govuk.error.data";
import * as templatePaths from "../../model/template.paths";
import * as keys from "../../session/keys";
import * as reasonService from "../../services/reason.service";
import * as sessionService from "../../services/session.service";
import {removeNonPrintableChars} from "../../global/string.formatter";
import {ReasonWeb} from "../../model/reason/extension.reason.web";
import logger from "../../logger";

const validators = [
  check("illnessInformation").custom((reason, {req}) => {
    if (!req.body.illnessInformation
      || req.body.illnessInformation .trim().length === 0) {
      throw Error(errorMessages.NO_INFORMATION_INPUT);
    }
    return true;
  }),
];

export const render = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  if (req.query.reasonId) {
    await sessionService.setReasonInContextAsString(req.chSession, req.query.reasonId as string);
  }
  try {
    const reason: ReasonWeb = await reasonService.getCurrentReason(req.chSession) as ReasonWeb;
    let existingInformation;
    if (reason && reason.reason_information) {
      existingInformation = reason.reason_information;
    }
    if (existingInformation) {
      return res.render(templatePaths.ILLNESS_INFORMATION, {
        information: existingInformation,
        templateName: templatePaths.ILLNESS_INFORMATION,
      });
    } else {
      return res.render(templatePaths.ILLNESS_INFORMATION, {
        templateName: templatePaths.ILLNESS_INFORMATION,
      });
    }
  } catch(err) {
    logger.info("Error rendering illness information page");
    return next(err);
  }
};

const route = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errMsg: string = errors.array().map((err: ValidationError) => err.msg).pop() as string;
    const inputErr: GovUkErrorData = createGovUkErrorData(errMsg,
      "#illness-information", true, "");
    return res.render(templatePaths.ILLNESS_INFORMATION, {
      errorList: [
        inputErr,
      ],
      inputError: inputErr,
      templateName: templatePaths.ILLNESS_INFORMATION,
    });
  }

  try {
    await reasonService.updateReason(
      req.chSession,
      {reason_information: removeNonPrintableChars(req.body.illnessInformation)}
    );
  } catch (err) {
    logger.info("Error caught updating reason with illness information");
    return next(err);
  }

  const changingDetails = req.chSession.data[keys.CHANGING_DETAILS];
  if (changingDetails) {
    return res.redirect(pageURLs.EXTENSIONS_CHECK_YOUR_ANSWERS);
  } else {
    return res.redirect(pageURLs.EXTENSIONS_DOCUMENT_OPTION);
  }
};

export default [...validators, route];
