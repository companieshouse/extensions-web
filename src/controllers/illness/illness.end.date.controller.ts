import {NextFunction, Request, Response} from "express";
import {check, validationResult} from "express-validator/check";
import * as moment from "moment";
import * as errorMessages from "../../model/error.messages";
import {createGovUkErrorData, GovUkErrorData} from "../../model/govuk.error.data";
import {ValidationError} from "../../model/validation.error";
import * as dateValidationUtils from "../../global/date.validation.utils";
import * as keys from "../../session/keys";
import * as pageURLs from "../../model/page.urls";
import * as reasonService from "../../services/reason.service";
import * as sessionService from "../../services/session.service";
import * as templatePaths from "../../model/template.paths";
import { ReasonWeb } from "model/reason/extension.reason.web";
import {formatDateForDisplay, formatDateForReason} from "../../client/date.formatter";

const ILLNESS_END_DAY_FIELD: string = "illness-end-day";
const ILLNESS_END_MONTH_FIELD: string = "illness-end-month";
const ILLNESS_END_YEAR_FIELD: string = "illness-end-year";
const ILLNESS_END_FULL_DATE_FIELD: string = "fullDate";

const allDateFieldsPresent = (req: Request): boolean => {
  return req.body[ILLNESS_END_DAY_FIELD]
    && req.body[ILLNESS_END_MONTH_FIELD]
    && req.body[ILLNESS_END_YEAR_FIELD];
};

const extractFullDate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // We need to treat the full date as a separate field to help with validation
  const day = String(req.body[ILLNESS_END_DAY_FIELD]).padStart(2, "0");
  const month = String(req.body[ILLNESS_END_MONTH_FIELD]).padStart(2, "0");
  const year = String(req.body[ILLNESS_END_YEAR_FIELD]).padStart(2, "0");

  // "YYYY-MM-DD"
  req.body.fullDate = `${year}-${month}-${day}`;
  next();
};

const validators = [
  check(ILLNESS_END_DAY_FIELD).escape().not().isEmpty().withMessage("day"),
  check(ILLNESS_END_MONTH_FIELD).escape().not().isEmpty().withMessage("month"),
  check(ILLNESS_END_YEAR_FIELD).escape().not().isEmpty().withMessage("year"),

  check(ILLNESS_END_FULL_DATE_FIELD).escape().custom(async (fullDate, {req}) => {
    if (allDateFieldsPresent(req)) {
      if (!moment(fullDate, "YYYY-MM-DD", true).isValid()) {
        throw Error(errorMessages.DATE_INVALID);
      }
      if (moment().isBefore(fullDate)) {
        throw Error(errorMessages.ILLNESS_END_DATE_FUTURE);
      }
      const reason = await getCurrentExtensionReason(req);
      const illnessStartDate: string = reason.start_on;
      if (moment(illnessStartDate, "YYYY-MM-DD", true).isAfter(fullDate)) {
        throw Error(errorMessages.ILLNESS_END_BEFORE_START_DATE);
      }
    } else if (fullDate === "00-00-00") {
      throw Error(errorMessages.DATE_MISSING);
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
  if (reason && reason.end_on) {
    dateStr = reason.end_on;
  }
  const illnessStartDate: string = formatDateForDisplay(reason.start_on);
  if (dateStr) {
    const endDate: Date = new Date(dateStr);
    return res.render(templatePaths.ILLNESS_END_DATE, {
      illnessEndDay: endDate.getDate(),
      illnessEndMonth: endDate.getMonth() + 1,
      illnessEndYear: endDate.getFullYear(),
      startDate: illnessStartDate,
      templateName: templatePaths.ILLNESS_END_DATE,
    });
  } else {
    return res.render(templatePaths.ILLNESS_END_DATE, {
      startDate: illnessStartDate,
      templateName: templatePaths.ILLNESS_END_DATE,
    });
  }
};

export const processForm = [extractFullDate, ...validators,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const errors = validationResult(req);

  const errorListData: GovUkErrorData[] = [];
  let endDateDayErrorFlag: boolean = false;
  let endDateMonthErrorFlag: boolean = false;
  let endDateYearErrorFlag: boolean = false;

  const day: string = req.body[ILLNESS_END_DAY_FIELD];
  const month: string = req.body[ILLNESS_END_MONTH_FIELD];
  const year: string = req.body[ILLNESS_END_YEAR_FIELD];

  if (!errors.isEmpty()) {
    let dateErrorMessage: string = errorMessages.BASE_DATE_ERROR_MESSAGE;
    let href: string = "";
    let isFirstError: boolean = true;

    const reasonErr = await getCurrentExtensionReason(req);
    const illnessStartDate: string = reasonErr.start_on;

    errors.array({ onlyFirstError: true })
      .forEach((valErr: ValidationError) => {
        if (!href) {
          href = valErr.param;
        }
        switch (valErr.param) {
          case ILLNESS_END_DAY_FIELD:
            dateErrorMessage = dateValidationUtils.updateDateErrorMessage(dateErrorMessage, valErr.msg, isFirstError);
            isFirstError = false;
            endDateDayErrorFlag = true;
            break;
          case ILLNESS_END_MONTH_FIELD:
            dateErrorMessage = dateValidationUtils.updateDateErrorMessage(dateErrorMessage, valErr.msg, isFirstError);
            isFirstError = false;
            endDateMonthErrorFlag = true;
            break;
          case ILLNESS_END_YEAR_FIELD:
            dateErrorMessage = dateValidationUtils.updateDateErrorMessage(dateErrorMessage, valErr.msg, isFirstError);
            isFirstError = false;
            endDateYearErrorFlag = true;
            break;
          case ILLNESS_END_FULL_DATE_FIELD:
            dateErrorMessage = valErr.msg;
            endDateDayErrorFlag = true;
            endDateMonthErrorFlag = true;
            endDateYearErrorFlag = true;
        }

      });

    const govUkErrorData: GovUkErrorData = createGovUkErrorData(
      dateErrorMessage, "#" + href, true, "");
    errorListData.push(govUkErrorData);

    return res.render(templatePaths.ILLNESS_END_DATE, {
      errorList: errorListData,
      illnessEndDay: day,
      illnessEndMonth: month,
      illnessEndYear: year,
      isEndDateDayError: endDateDayErrorFlag,
      isEndDateMonthError: endDateMonthErrorFlag,
      isEndDateYearError: endDateYearErrorFlag,
      startDate: formatDateForDisplay(illnessStartDate),
      templateName: templatePaths.ILLNESS_END_DATE,
    });
  }

  await reasonService.updateReason(req.chSession, {end_on: formatDateForReason(day, month, year)});
  const changingDetails = req.chSession.data[keys.CHANGING_DETAILS];
  if (changingDetails) {
    return res.redirect(pageURLs.EXTENSIONS_CHECK_YOUR_ANSWERS);
  } else {
    return res.redirect(pageURLs.EXTENSIONS_ILLNESS_INFORMATION);
  }
}];

const getCurrentExtensionReason = async (req: Request): Promise<ReasonWeb> => {
  return await reasonService.getCurrentReason(req.chSession) as ReasonWeb;
};
