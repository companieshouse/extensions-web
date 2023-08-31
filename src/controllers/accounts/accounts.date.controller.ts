import {NextFunction, Request, Response} from "express";
import {check, validationResult, ValidationError} from "express-validator";
import * as moment from "moment";
import * as errorMessages from "../../model/error.messages";
import {createGovUkErrorData, GovUkErrorData} from "../../model/govuk.error.data";
import {EXTENSIONS_ACCOUNTS_INFORMATION} from "../../model/page.urls";
import * as dateValidationUtils from "../../global/date.validation.utils";
import * as keys from "../../session/keys";
import * as pageURLs from "../../model/page.urls";
import * as reasonService from "../../services/reason.service";
import {formatDateForReason} from "../../client/date.formatter";
import * as templatePaths from "../../model/template.paths";
import * as sessionService from "../../services/session.service";
import {ReasonWeb} from "../../model/reason/extension.reason.web";

const ACCOUNTING_ISSUE_DAY_FIELD: string = "accounts-date-day";
const ACCOUNTING_ISSUE_MONTH_FIELD: string = "accounts-date-month";
const ACCOUNTING_ISSUE_YEAR_FIELD: string = "accounts-date-year";
const ACCOUNTING_ISSUE_FULL_DATE_FIELD: string = "fullDate";

const allDateFieldsPresent = (req: Request): boolean => {
  return req.body[ACCOUNTING_ISSUE_DAY_FIELD]
    && req.body[ACCOUNTING_ISSUE_MONTH_FIELD]
    && req.body[ACCOUNTING_ISSUE_YEAR_FIELD];
};

const extractFullDate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // We need to treat the full date as a separate field to help with validation
  const day: string = String(req.body[ACCOUNTING_ISSUE_DAY_FIELD]).padStart(2, "0");
  const month: string = String(req.body[ACCOUNTING_ISSUE_MONTH_FIELD]).padStart(2, "0");
  const year: string = String(req.body[ACCOUNTING_ISSUE_YEAR_FIELD]).padStart(2, "0");

  // "YYYY-MM-DD"
  req.body.fullDate = `${year}-${month}-${day}`;
  next();
};

const validators = [
  check(ACCOUNTING_ISSUE_DAY_FIELD).escape().not().isEmpty().withMessage("day"),
  check(ACCOUNTING_ISSUE_MONTH_FIELD).escape().not().isEmpty().withMessage("month"),
  check(ACCOUNTING_ISSUE_YEAR_FIELD).escape().not().isEmpty().withMessage("year"),

  // Check date is present, valid and not in the future
  check(ACCOUNTING_ISSUE_FULL_DATE_FIELD).escape().custom((fullDate, {req}) => {
    if (allDateFieldsPresent(req as Request)) {
      if (!moment(fullDate, "YYYY-MM-DD", true).isValid()) {
        throw Error(errorMessages.DATE_INVALID);
      }
      if (moment().isBefore(fullDate)) {
        throw Error(errorMessages.DATE_FUTURE);
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
  let dateStr;
  const reason: ReasonWeb = await reasonService.getCurrentReason(req.chSession) as ReasonWeb;
  if (reason) {
    dateStr = reason.start_on;
  }
  if (dateStr) {
    const date: Date = new Date(dateStr);
    return res.render(templatePaths.REASON_ACCOUNTING_ISSUE, {
      accountsDay: date.getDate(),
      accountsMonth: date.getMonth() + 1,
      accountsYear: date.getFullYear(),
      templateName: templatePaths.REASON_ACCOUNTING_ISSUE,
    });
  } else {
    return res.render(templatePaths.REASON_ACCOUNTING_ISSUE, {
      templateName: templatePaths.REASON_ACCOUNTING_ISSUE,
    });
  }
};

const route = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const errors = validationResult(req);

  const errorListData: GovUkErrorData[] = [];
  let dateDayErrorFlag: boolean = false;
  let dateMonthErrorFlag: boolean = false;
  let dateYearErrorFlag: boolean = false;

  const day: string = req.body[ACCOUNTING_ISSUE_DAY_FIELD];
  const month: string = req.body[ACCOUNTING_ISSUE_MONTH_FIELD];
  const year: string = req.body[ACCOUNTING_ISSUE_YEAR_FIELD];

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
          case ACCOUNTING_ISSUE_DAY_FIELD:
            dateErrorMessage = dateValidationUtils.updateDateErrorMessage(dateErrorMessage, valErr.msg, isFirstError);
            isFirstError = false;
            dateDayErrorFlag = true;
            break;
          case ACCOUNTING_ISSUE_MONTH_FIELD:
            dateErrorMessage = dateValidationUtils.updateDateErrorMessage(dateErrorMessage, valErr.msg, isFirstError);
            isFirstError = false;
            dateMonthErrorFlag = true;
            break;
          case ACCOUNTING_ISSUE_YEAR_FIELD:
            dateErrorMessage = dateValidationUtils.updateDateErrorMessage(dateErrorMessage, valErr.msg, isFirstError);
            isFirstError = false;
            dateYearErrorFlag = true;
            break;
          case ACCOUNTING_ISSUE_FULL_DATE_FIELD:
            dateErrorMessage = valErr.msg;
            dateDayErrorFlag = true;
            dateMonthErrorFlag = true;
            dateYearErrorFlag = true;
        }

      });

    const govUkErrorData: GovUkErrorData = createGovUkErrorData(
      dateErrorMessage, "#" + href, true, "");
    errorListData.push(govUkErrorData);

    return res.render(templatePaths.REASON_ACCOUNTING_ISSUE, {
      accountsDay: day,
      accountsMonth: month,
      accountsYear: year,
      errorList: errorListData,
      isDateDayError: dateDayErrorFlag,
      isDateMonthError: dateMonthErrorFlag,
      isDateYearError: dateYearErrorFlag,
      templateName: templatePaths.REASON_ACCOUNTING_ISSUE,
    });
  }

  await reasonService.updateReason(req.chSession, {start_on: formatDateForReason(day, month, year)});
  const changingDetails = req.chSession.data[keys.CHANGING_DETAILS];
  if (changingDetails) {
    return res.redirect(pageURLs.EXTENSIONS_CHECK_YOUR_ANSWERS);
  } else {
    return res.redirect(EXTENSIONS_ACCOUNTS_INFORMATION);
  }
};

export default [extractFullDate, ...validators, route];
