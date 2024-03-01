import {NextFunction, Request, Response} from "express";
import {check, validationResult, ValidationError} from "express-validator";
import * as moment from "moment";
import * as errorMessages from "../../model/error.messages";
import {createGovUkErrorData, GovUkErrorData} from "../../model/govuk.error.data";
import * as templatePaths from "../../model/template.paths";
import {EXTENSIONS_CONTINUED_ILLNESS} from "../../model/page.urls";
import * as dateValidationUtils from "../../global/date.validation.utils";
import * as keys from "../../session/keys";
import * as pageURLs from "../../model/page.urls";
import * as reasonService from "../../services/reason.service";
import {formatDateForReason} from "../../client/date.formatter";
import * as sessionService from "../../services/session.service";
import {ReasonWeb} from "../../model/reason/extension.reason.web";
import logger from "../../logger";

const ILLNESS_START_DAY_FIELD: string = "illness-start-day";
const ILLNESS_START_MONTH_FIELD: string = "illness-start-month";
const ILLNESS_START_YEAR_FIELD: string = "illness-start-year";
const ILLNESS_START_FULL_DATE_FIELD: string = "fullDate";

const allDateFieldsPresent = (req: Request): boolean => {
  return req.body[ILLNESS_START_DAY_FIELD]
    && req.body[ILLNESS_START_MONTH_FIELD]
    && req.body[ILLNESS_START_YEAR_FIELD];
};

const extractFullDate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // We need to treat the full date as a separate field to help with validation
  const day: string = String(req.body[ILLNESS_START_DAY_FIELD]).padStart(2, "0");
  const month: string = String(req.body[ILLNESS_START_MONTH_FIELD]).padStart(2, "0");
  const year: string = String(req.body[ILLNESS_START_YEAR_FIELD]).padStart(2, "0");

  // "YYYY-MM-DD"
  req.body.fullDate = `${year}-${month}-${day}`;
  next();
};

const validators = [
  check(ILLNESS_START_DAY_FIELD).escape().not().isEmpty().withMessage("day"),
  check(ILLNESS_START_MONTH_FIELD).escape().not().isEmpty().withMessage("month"),
  check(ILLNESS_START_YEAR_FIELD).escape().not().isEmpty().withMessage("year"),

  // Check date is a valid date and not in the future
  check(ILLNESS_START_FULL_DATE_FIELD).escape().custom((fullDate, {req}) => {
    if (allDateFieldsPresent(req as Request)) {
      if (!moment(fullDate, "YYYY-MM-DD", true).isValid()) {
        throw Error(errorMessages.DATE_INVALID);
      }
      if (moment().isBefore(fullDate)) {
        throw Error(errorMessages.ILLNESS_START_DATE_FUTURE);
      }
    } else if (fullDate === "00-00-00") {
      throw Error(errorMessages.DATE_MISSING);
    }
    return true;
  }),
];

export const render = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  if (req.query.reasonId) {
    await sessionService.setReasonInContextAsString(req.chSession, req.query.reasonId as string);
  }
  try {
    let dateStr: any;
    const reason: ReasonWeb = await reasonService.getCurrentReason(req.chSession) as ReasonWeb;
    if (reason && reason.start_on) {
      dateStr = reason.start_on;
    }
    if (dateStr) {
      const startDate: Date = new Date(dateStr);
      return res.render(templatePaths.ILLNESS_START_DATE, {
        illnessStartDay: startDate.getDate(),
        illnessStartMonth: startDate.getMonth() + 1,
        illnessStartYear: startDate.getFullYear(),
        templateName: templatePaths.ILLNESS_START_DATE,
      });
    } else {
      return res.render(templatePaths.ILLNESS_START_DATE, {
        templateName: templatePaths.ILLNESS_START_DATE,
      });
    }
  } catch (err) {
    logger.info("Exception caught when rendering illness start date page");
    return next(err);
  }

};

const route = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const errors = validationResult(req);

  const errorListData: GovUkErrorData[] = [];
  let startDateDayErrorFlag: boolean = false;
  let startDateMonthErrorFlag: boolean = false;
  let startDateYearErrorFlag: boolean = false;

  const day: string = req.body[ILLNESS_START_DAY_FIELD];
  const month: string = req.body[ILLNESS_START_MONTH_FIELD];
  const year: string = req.body[ILLNESS_START_YEAR_FIELD];

  if (!errors.isEmpty()) {
    let dateErrorMessage: string = errorMessages.BASE_DATE_ERROR_MESSAGE;
    let href: string = "";
    let isFirstError: boolean = true;

    // Get the first error only for each field
    errors.array({ onlyFirstError: true })
      .forEach((valErr: ValidationError) => {
        if (!href) {
          href = valErr.param;
        }
        switch (valErr.param) {
          case ILLNESS_START_DAY_FIELD:
            dateErrorMessage = dateValidationUtils.updateDateErrorMessage(dateErrorMessage, valErr.msg, isFirstError);
            isFirstError = false;
            startDateDayErrorFlag = true;
            break;
          case ILLNESS_START_MONTH_FIELD:
            dateErrorMessage = dateValidationUtils.updateDateErrorMessage(dateErrorMessage, valErr.msg, isFirstError);
            isFirstError = false;
            startDateMonthErrorFlag = true;
            break;
          case ILLNESS_START_YEAR_FIELD:
            dateErrorMessage = dateValidationUtils.updateDateErrorMessage(dateErrorMessage, valErr.msg, isFirstError);
            isFirstError = false;
            startDateYearErrorFlag = true;
            break;
          case ILLNESS_START_FULL_DATE_FIELD:
            dateErrorMessage = valErr.msg;
            startDateDayErrorFlag = true;
            startDateMonthErrorFlag = true;
            startDateYearErrorFlag = true;
        }

      });

    const govUkErrorData: GovUkErrorData = createGovUkErrorData(
      dateErrorMessage, "#" + href, true, "");
    errorListData.push(govUkErrorData);

    return res.render(templatePaths.ILLNESS_START_DATE, {
      errorList: errorListData,
      illnessStartDay: day,
      illnessStartMonth: month,
      illnessStartYear: year,
      isStartDateDayError: startDateDayErrorFlag,
      isStartDateMonthError: startDateMonthErrorFlag,
      isStartDateYearError: startDateYearErrorFlag,
      templateName: templatePaths.ILLNESS_START_DATE,
    });
  }

  try {
    await reasonService.updateReason(req.chSession, {start_on: formatDateForReason(day, month, year)});
  } catch (err) {
    logger.info("Error caught updating illness with start date");
    return next(err);
  }
  const changingDetails = req.chSession.data[keys.CHANGING_DETAILS];
  if (changingDetails) {
    return res.redirect(pageURLs.EXTENSIONS_CHECK_YOUR_ANSWERS);
  } else {
    return res.redirect(EXTENSIONS_CONTINUED_ILLNESS);
  }
};

export default [extractFullDate, ...validators, route];
