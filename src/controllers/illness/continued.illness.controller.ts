import {NextFunction, Request, Response} from "express";
import {check, validationResult, ValidationError} from "express-validator";
import {createGovUkErrorData, GovUkErrorData} from "../../model/govuk.error.data";
import * as templatePaths from "../../model/template.paths";
import * as errorMessages from "../../model/error.messages";
import * as pageURLs from "../../model/page.urls";
import * as keys from "../../session/keys";
import * as sessionService from "../../services/session.service";
import * as reasonService from "../../services/reason.service";
import { ReasonWeb } from "model/reason/extension.reason.web";
import {formatDateForDisplay} from "../../client/date.formatter";
import logger from "../../logger";

const validators = [
  check("continuedIllness").not().isEmpty().withMessage(errorMessages.STILL_ILL_ANSWER_NOT_PROVIDED),
];

export const render = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  let existingInformation;
  if (req.query.reasonId) {
    await sessionService.setReasonInContextAsString(req.chSession, req.query.reasonId as string);
  }

  try {
    const reason: ReasonWeb = await reasonService.getCurrentReason(req.chSession) as ReasonWeb;
    const illnessStartDate: string = formatDateForDisplay(reason.start_on);
  
    if (reason && reason.continued_illness) {
      existingInformation = reason.continued_illness;
    }
    if (existingInformation) {
      switch (existingInformation) {
        case "yes":
          return res.render(templatePaths.CONTINUED_ILLNESS, {
            isYesChecked: true,
            startDate: illnessStartDate,
            templateName: templatePaths.CONTINUED_ILLNESS,
          });
        case "no":
          return res.render(templatePaths.CONTINUED_ILLNESS, {
            isNoChecked: true,
            startDate: illnessStartDate,
            templateName: templatePaths.CONTINUED_ILLNESS,
          });
      }
    } else {
      return res.render(templatePaths.CONTINUED_ILLNESS, {
        startDate: illnessStartDate,
        templateName: templatePaths.CONTINUED_ILLNESS,
      });
    }
  } catch (err) {
    logger.info("Error caught rendering continued illness")
    next(err)
  }
};

export const processForm = [...validators, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    try {
      const reason = await reasonService.getCurrentReason(req.chSession) as ReasonWeb;
      const illnessStartDate: string = formatDateForDisplay(reason.start_on);
      const errMsg: string = errors.array().map((err: ValidationError) => err.msg).pop() as string;
      if (errMsg) {
        const continuedIllnessError: GovUkErrorData = createGovUkErrorData(errMsg,
          "#continued-illness", true, "blank");
        return res.render(templatePaths.CONTINUED_ILLNESS, {
          continuedIllnessErr: continuedIllnessError,
          errorList: [
            continuedIllnessError,
          ],
          startDate: illnessStartDate,
          templateName: templatePaths.CONTINUED_ILLNESS,
        });
      }
    } catch (err) {
      logger.info("Exception caught rendering continued illness page with errors");
      return next(err);
    }
  } else {
    const answer: string = req.body.continuedIllness;
    try {
      await reasonService.updateReason(req.chSession, {continued_illness: answer});
    } catch (err) {
      logger.info("Error caught updating reason with continuing illness");
      return next(err);
    }

    const changingDetails = req.chSession.data[keys.CHANGING_DETAILS];
    if (answer === "yes") {
      if (changingDetails) {
        return res.redirect(pageURLs.EXTENSIONS_CHECK_YOUR_ANSWERS);
      }
      return res.redirect(pageURLs.EXTENSIONS_ILLNESS_INFORMATION);
    } else {
      return res.redirect(pageURLs.EXTENSIONS_ILLNESS_END_DATE);
    }
  }
}];
