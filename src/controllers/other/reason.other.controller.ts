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

const OTHER_REASON_FIELD: string = "otherReason";
const OTHER_INFORMATION_FIELD: string = "otherInformation";

const validators = [
  check(OTHER_REASON_FIELD).custom((reason, {req}) => {
    if (!req.body.otherReason
      || req.body.otherReason.trim().length === 0) {
      throw Error(errorMessages.NO_REASON_INPUT);
    }
    return true;
  }),
  check(OTHER_INFORMATION_FIELD).custom((reason, {req}) => {
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
  let existingReason;
  let existingInformation;
  if (reason && (reason.reason_information || reason.reason)) {
    existingReason = reason.reason;
    existingInformation = reason.reason_information;
  }

  if (existingInformation) {
    return res.render(templatePaths.REASON_OTHER, {
      otherInformation: existingInformation,
      otherReason: existingReason,
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
  const errorListData: GovUkErrorData[] = [];

  const otherReasonInput: string = req.body[OTHER_REASON_FIELD];
  const otherInformationInput: string = req.body[OTHER_INFORMATION_FIELD];

  if (!errors.isEmpty()) {
    let otherReasonErrorData: GovUkErrorData | undefined;
    let otherInformationErrorData: GovUkErrorData | undefined;

    // Get the first error only for each field
    errors.array({ onlyFirstError: true })
      .forEach((valErr: ValidationError) => {
        const govUkErrorData: GovUkErrorData = createGovUkErrorData(
          valErr.msg, "#" + valErr.param, true, "");
        switch ((valErr.param)) {
          case OTHER_REASON_FIELD:
            otherReasonErrorData = govUkErrorData;
            break;
          case OTHER_INFORMATION_FIELD:
            otherInformationErrorData = govUkErrorData;
            break;
        }

        errorListData.push(govUkErrorData);
      });

    return res.render(templatePaths.REASON_OTHER, {
      errorList: errorListData,
      otherInformation: otherInformationInput,
      otherInformationErr: otherInformationErrorData,
      otherReason: otherReasonInput,
      otherReasonErr: otherReasonErrorData,
      templateName: templatePaths.REASON_OTHER,
    });
  }

  const changingDetails = req.chSession.data[keys.CHANGING_DETAILS];
  const reasonInput = req.body.otherReason;
  await reasonService.updateReason(
    req.chSession,
    {
      reason: removeNonPrintableChars(reasonInput),
      reason_information: removeNonPrintableChars(req.body.otherInformation),
    });
  if (changingDetails) {
    return res.redirect(pageURLs.EXTENSIONS_CHECK_YOUR_ANSWERS);
  } else {
    return res.redirect(pageURLs.EXTENSIONS_DOCUMENT_OPTION);
  }
};

export default[...validators, route];
