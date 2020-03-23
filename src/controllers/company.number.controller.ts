import {NextFunction, Request, Response} from "express";
import {check, validationResult} from "express-validator/check";
import {ExtensionsCompanyProfile, getCompanyProfile} from "../client/apiclient";
import logger from "../logger";
import * as errorMessages from "../model/error.messages";
import {createGovUkErrorData, GovUkErrorData} from "../model/govuk.error.data";
import * as pageURLs from "../model/page.urls";
import * as templatePaths from "../model/template.paths";
import {ValidationError} from "../model/validation.error";
import * as sessionService from "../services/session.service";

// validator middleware
const preValidators = [
  check("companyNumber").blacklist(" ").escape().not().isEmpty().withMessage(errorMessages.NO_COMPANY_NUMBER_SUPPLIED),
  check("companyNumber").blacklist(" ").escape().isLength({max: 8}).withMessage(errorMessages.COMPANY_NUMBER_TOO_LONG),
];

const padCompanyNumber = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  let companyNumber: string = req.body.companyNumber;
  if (/^([a-zA-Z]{2}?)/gm.test(companyNumber)) {
    const leadingLetters = companyNumber.substring(0, 2);
    let trailingChars = companyNumber.substring(2, companyNumber.length);
    trailingChars = trailingChars.padStart(6, "0");
    companyNumber = leadingLetters + trailingChars;
  } else {
    companyNumber = companyNumber.padStart(8, "0");
  }
  req.body.companyNumber = companyNumber;
  return next();
};

// validator middleware
const postValidators = [
  check("companyNumber").blacklist(" ").escape().custom((value: string) => {
    if (!/^([a-zA-Z]{2})?[0-9]{6,8}$/gm.test(value)) {
      throw new Error(errorMessages.INVALID_COMPANY_NUMBER);
    }
    return true;
  }),
];

/**
 * Handle the request for company number lookup.
 */
const route = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const errors = validationResult(req);

  // render errors in the view
  if (!errors.isEmpty()) {
    const errorText = errors.array({ onlyFirstError: true })
                            .map((err: ValidationError) => err.msg)
                            .pop() as string;
    const companyNumberErrorData: GovUkErrorData = createGovUkErrorData(errorText, "#company-number", true, "");

    return res.render(templatePaths.COMPANY_NUMBER, {
      companyNumberErr: companyNumberErrorData,
      errorList: [companyNumberErrorData],
      templateName: templatePaths.COMPANY_NUMBER,
    });
  }

  const companyNumber: string = req.body.companyNumber;
  try {
    logger.info(`Retrieving company profile for company number ${companyNumber}`);
    const token: string = req.chSession.accessToken() as string;
    const company: ExtensionsCompanyProfile = await getCompanyProfile(companyNumber, token);
    logger.info(`${companyNumber} Due date = ${company.accountsDue}`);

    await sessionService.createExtensionSession(req.chSession, company.companyNumber);

    if (isDateMoreThanXDaysFromToday(
      company.accountsDue,
      Number(process.env.TOO_SOON_DAYS_BEFORE_DUE_DATE),
      companyNumber)) {
      // show too soon screen
      logger.info(`${companyNumber} Too soon to apply`);
      return res.redirect(pageURLs.EXTENSIONS_TOO_SOON);
    } else {
      return res.redirect(pageURLs.EXTENSIONS_CONFIRM_COMPANY);
    }
  } catch (e) {
    logger.error(`Error fetching company profile for company number ${companyNumber}`, e);
    if (e.status === 404) {
      buildError(res, errorMessages.COMPANY_NUMBER_NOT_FOUND);
    } else {
      return next(e);
    }
  }
};

const buildError = (res: Response, errorMessage: string): void => {
  const companyNumberErrorData: GovUkErrorData = createGovUkErrorData(
    errorMessage,
    "#company-number",
    true,
    "");
  return res.render(templatePaths.COMPANY_NUMBER, {
    companyNumberErr: companyNumberErrorData,
    errorList: [companyNumberErrorData],
    templateName: templatePaths.COMPANY_NUMBER,
  });
};

const isDateMoreThanXDaysFromToday = (dateToCheck: string, daysFromToday: number, companyNumber: string): boolean => {
  const currentDate: Date = new Date(Date.now());
  currentDate.setHours(0, 0, 0, 0);

  const dueDate: Date = new Date(dateToCheck);
  dueDate.setHours(0, 0, 0, 0);
  dueDate.setDate(dueDate.getDate() - daysFromToday);
  logger.info(`${companyNumber} Due date after subtraction = ${dueDate.toUTCString()}`);

  return currentDate < dueDate;
};

export default [...preValidators, padCompanyNumber, ...postValidators, route];
