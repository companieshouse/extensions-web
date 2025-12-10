import { NextFunction, Request, Response } from "express";
import { check, validationResult, ValidationError } from "express-validator";
import * as errorMessages from "../../model/error.messages";
import {createGovUkErrorData, GovUkErrorData} from "../../model/govuk.error.data";
import * as templatePaths from "../../model/template.paths";
import * as keys from "../../session/keys";
import * as pageURLs from "../../model/page.urls";
import * as reasonService from "../../services/reason.service";
import * as sessionService from "../../services/session.service";
import {ReasonWeb} from "../../model/reason/extension.reason.web";
import logger from "../../logger";

let errorType: string = "";

const validators = [
  check("illPerson").not().isEmpty().withMessage(errorMessages.WHO_WAS_ILL_NOT_SELECTED),
  check("illPerson").custom((person, {req}) => {
    errorType = "";
    if (
      person === "other" &&
      (!req?.body?.otherPerson || req?.body?.otherPerson.trim().length === 0)
    ) {
      errorType = "invalid";
      throw Error(errorMessages.WHO_WAS_ILL_OTHER_NOT_SELECTED);
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
    let existingWhoWasIll;
    const renderOptions = {
      accountantIsChecked: false,
      directorIsChecked: false,
      employeeIsChecked: false,
      familyIsChecked: false,
      otherPersonChecked: false,
      otherPersonValue: "",
      templateName: templatePaths.REASON_ILLNESS,
    };

    if (reason && reason.affected_person) {
      existingWhoWasIll = reason.affected_person;
      switch (existingWhoWasIll) {
        case "Company director or officer":
          renderOptions.directorIsChecked = true;
          break;
        case "Company accountant or agent":
          renderOptions.accountantIsChecked = true;
          break;
        case "Family member":
          renderOptions.familyIsChecked = true;
          break;
        case "Company employee":
          renderOptions.employeeIsChecked = true;
          break;
        default:
          renderOptions.otherPersonChecked = true;
          renderOptions.otherPersonValue = existingWhoWasIll;
          break;
      }
    }

    if (existingWhoWasIll) {
      return res.render(templatePaths.REASON_ILLNESS, renderOptions);
    } else {
      return res.render(templatePaths.REASON_ILLNESS, {
        templateName: templatePaths.REASON_ILLNESS,
      });
    }
  } catch (err) {
    logger.info("Error returned rendering who was ill page");
    return next(err);
  }
};

const route = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errMsg: string = errors.array().map((err: ValidationError) => err.msg).pop() as string;
    if (errMsg) {
      const extPersonErr: GovUkErrorData = createGovUkErrorData(errMsg,
        "#ill-person", true, errorType);
      return res.render(templatePaths.REASON_ILLNESS, {
        errorList: [
          extPersonErr,
        ],
        illPersonErr: extPersonErr,
        templateName: templatePaths.REASON_ILLNESS,
      });
    }
  }
  const changingDetails = req.chSession.data[keys.CHANGING_DETAILS];

  try {
    if (req?.body?.otherPerson) {
      await reasonService.updateReason(req.chSession, {
        affected_person: req?.body?.otherPerson,
      });
    } else {
      await reasonService.updateReason(req.chSession, {
        affected_person: req?.body?.illPerson,
      });
    }
  } catch (err) {
    logger.info("Error caught updating Reason with affected person");
    return next(err);
  }

  if (changingDetails) {
    return res.redirect(pageURLs.EXTENSIONS_CHECK_YOUR_ANSWERS);
  } else {
    return res.redirect(pageURLs.EXTENSIONS_ILLNESS_START_DATE);
  }
};

export default [...validators, route];
