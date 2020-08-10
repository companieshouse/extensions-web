import {NextFunction, Request, Response} from "express";
import {
  createExtensionRequest,
  ExtensionFullRequest,
  ExtensionsCompanyProfile,
  getCompanyProfile,
  setExtensionRequestStatus,
} from "../client/apiclient";
import logger from "../logger";
import * as sessionService from "../services/session.service";
import * as errorMessages from "../model/error.messages";
import * as templatePaths from "../model/template.paths";
import * as pageURLs from "../model/page.urls";
import * as keys from "../session/keys";
import {buildCompanySummaryListRows} from "../global/summary.list.rows.builder";
import {ExtensionRequestStatus} from "../model/extension.request.status";
import Session from "../session/session";
import {IExtensionRequest, IUserProfile} from "../session/types";
import {MAX_EXTENSION_PERIOD_IN_MONTHS} from "../session/config";

export const route = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const companyNumber: string = sessionService.getCompanyInContext(req.chSession);
  if (companyNumber) {
    try {
      logger.info(`Company number ${companyNumber} found in session, retrieving company profile`);
      const token: string = req.chSession.accessToken() as string;
      const company: ExtensionsCompanyProfile = await getCompanyProfile(companyNumber, token);
      const isDueDatePassed: boolean = checkDueDate(company);
      return res.render(templatePaths.CONFIRM_COMPANY, {
        company,
        companySummaryListRows: buildCompanySummaryListRows(company, false, false, req, isDueDatePassed),
        dueDatePassed: isDueDatePassed,
        templateName: templatePaths.CONFIRM_COMPANY,
      });
    } catch (e) {
      logger.error(`Error retrieving company number ${companyNumber} from redis`, e);
      return next(e);
    }
  } else {
    logger.info(errorMessages.NO_COMPANY_NUMBER_IN_SESSION);
    return next(new Error(errorMessages.NO_COMPANY_NUMBER_IN_SESSION));
  }
};

// POST submit handler
export const confirmCompanyStartRequest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const chSession: Session = req.chSession;
  const userProfile: IUserProfile = chSession.userProfile() as IUserProfile;

  if (!userProfile) {
    return next(new Error("No user profile found - Session data is missing"));
  }

  const companyNumber: string = sessionService.getCompanyInContext(chSession);
  if (!companyNumber) {
    return next(new Error(errorMessages.NO_COMPANY_NUMBER_IN_SESSION));
  }

  try {
    const token: string = chSession.accessToken() as string;
    if (token) {
      const company: ExtensionsCompanyProfile = await getCompanyProfile(companyNumber, token);

      // check if they are late filing
      const isDueDatePassed = checkDueDate(company);
      if (company.isAccountsOverdue || isDueDatePassed) {
        return res.render(templatePaths.ACCOUNTS_OVERDUE, {
          accountsDue: company.accountsDue,
          templateName: templatePaths.ACCOUNTS_OVERDUE,
        });
      }

      // create the extension request
      if (!(await sessionService.hasExtensionRequest(req.chSession))) {
        const response = await createExtensionRequest(company, token);
        logger.info(`User ${userProfile.id} has successfully started an extension request for company ` +
          `${companyNumber}. Saving request ${response.id} into redis`);
        await sessionService.addRequest(req.chSession, response.id);
      } else {
        logger.info(`User ${userProfile.id} has an extension request ` +
          `for companyNumber ${companyNumber}`);
      }
      await sessionService.updateExtensionSessionValue(req.chSession, keys.ALREADY_SUBMITTED, false);

      // check they haven't extended too far previously
      //   - need the extension request to exist before updating its status
      if (!isExtensionDueDateWithinLimit(company)) {
        await setExtensionStatusToRejected(chSession, companyNumber, token);
        return res.redirect(pageURLs.EXTENSIONS_EXTENSION_LIMIT_REACHED);
      }

      return res.redirect(pageURLs.EXTENSIONS_CHOOSE_REASON);
    } else {
      return next(new Error("User access token is missing from session"));
    }
  } catch (err) {
    return next(err);
  }
};

const isExtensionDueDateWithinLimit = (companyProfile: ExtensionsCompanyProfile): boolean => {
  const dueDateString: string = companyProfile.accountsDue;
  if (!dueDateString || dueDateString.trim().length === 0) {
    logger.debug(`Company ${companyProfile.companyNumber} due date not found`);
    return true;
  }
  const dueDate: Date = new Date(dueDateString);
  const dueDateMinusLimitPeriod: Date = new Date(dueDate.setMonth(dueDate.getMonth() -
    parseInt(MAX_EXTENSION_PERIOD_IN_MONTHS, 10)));
  dueDateMinusLimitPeriod.setHours(0, 0, 0);
  const endDate: Date = new Date(companyProfile.accountingPeriodEndOn);
  endDate.setHours(0, 0, 0);

  const isDueDateWithinLimit: boolean = dueDateMinusLimitPeriod < endDate;
  logger.debug(`Company ${companyProfile.companyNumber} isExtensionDueDateWithinLimit = ${isDueDateWithinLimit}`);
  return isDueDateWithinLimit;
};

const checkDueDate = (company: ExtensionsCompanyProfile): boolean => {
  const currentDate: Date = new Date(Date.now());
  currentDate.setHours(0, 0, 0);
  const dueDate: Date = new Date(company.accountsDue);
  dueDate.setHours(23, 59, 59);
  return dueDate < currentDate;
};

const setExtensionStatusToRejected = async (chSession: Session, companyNumber: string, token: string) => {
  logger.info("Company not eligible for extension as limit period has been exceeded");

  const extensionRequest: IExtensionRequest = getExtensionRequest(chSession, companyNumber);

  await setExtensionRequestStatus(
    ExtensionRequestStatus.REJECTED_MAX_EXT_LENGTH_EXCEEDED,
    extensionRequest.extension_request_id,
    companyNumber,
    token);
};

const getExtensionRequest = (chSession: Session, companyNumber: string): IExtensionRequest => {
  const extensionRequest: IExtensionRequest = sessionService.getRequest(chSession);
  if (!extensionRequest) {
    const message = `Unable to retrieve extension request from session for company ${companyNumber}`;
    logger.error(message);
    throw new Error(message);
  }
  return extensionRequest;
};
