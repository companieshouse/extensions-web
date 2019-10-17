import {NextFunction, Request, Response} from "express";
import {check, validationResult} from "express-validator/check";
import * as moment from "moment";
import * as errorMessages from "../../model/error.messages";
import {createGovUkErrorData, GovUkErrorData} from "../../model/govuk.error.data";
import * as templatePaths from "../../model/template.paths";
import {ValidationError} from "../../model/validation.error";
import {EXTENSIONS_CONTINUED_ILLNESS} from "../../model/page.urls";
import * as keys from "../../session/keys";
import * as pageURLs from "../../model/page.urls";
import * as reasonService from "../../services/reason.service";
import {formatDateForReason} from "../../client/date.formatter";
import * as sessionService from "../../services/session.service";
import {ReasonWeb} from "../../model/reason/extension.reason.web";

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
  check(ILLNESS_START_DAY_FIELD).escape().not().isEmpty().withMessage(errorMessages.DAY_MISSING),
  check(ILLNESS_START_MONTH_FIELD).escape().not().isEmpty().withMessage(errorMessages.MONTH_MISSING),
  check(ILLNESS_START_YEAR_FIELD).escape().not().isEmpty().withMessage(errorMessages.YEAR_MISSING),

  // Check date is a valid date and not in the future
  check(ILLNESS_START_FULL_DATE_FIELD).escape().custom((fullDate, {req}) => {
    if (allDateFieldsPresent(req)) {
      if (!moment(fullDate, "YYYY-MM-DD", true).isValid()) {
        throw Error(errorMessages.ILLNESS_START_DATE_INVALID);
      }
      if (moment().isBefore(fullDate)) {
        throw Error(errorMessages.ILLNESS_START_DATE_FUTURE);
      }
    }
    return true;
  }),
];

export const render = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  if (req.query.reasonId) {
    await sessionService.setReasonInContextAsString(req.chSession, req.query.reasonId);
  }
  let dateStr;
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
    // Get the first error only for each field
    errors.array({ onlyFirstError: true })
      .forEach((valErr: ValidationError) => {

        const href: string = (valErr.param === ILLNESS_START_FULL_DATE_FIELD) ? ILLNESS_START_DAY_FIELD : valErr.param;
        const govUkErrorData: GovUkErrorData = createGovUkErrorData(valErr.msg, "#" + href, true, "");
        switch ((valErr.param)) {
          case ILLNESS_START_DAY_FIELD:
            startDateDayErrorFlag = true;
            break;
          case ILLNESS_START_MONTH_FIELD:
            startDateMonthErrorFlag = true;
            break;
          case ILLNESS_START_YEAR_FIELD:
            startDateYearErrorFlag = true;
            break;
          case ILLNESS_START_FULL_DATE_FIELD:
            startDateDayErrorFlag = true;
            startDateMonthErrorFlag = true;
            startDateYearErrorFlag = true;
        }

        errorListData.push(govUkErrorData);
      });

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

  await reasonService.updateReason(req.chSession, {start_on: formatDateForReason(day, month, year)});
  const changingDetails = req.chSession.data[keys.CHANGING_DETAILS];
  if (changingDetails) {
    return res.redirect(pageURLs.EXTENSIONS_CHECK_YOUR_ANSWERS);
  } else {
    return res.redirect(EXTENSIONS_CONTINUED_ILLNESS);
  }
};

export default [extractFullDate, ...validators, route];
