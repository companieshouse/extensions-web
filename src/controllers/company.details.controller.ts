import { NextFunction, Request, Response } from "express";
import { ExtensionsCompanyProfile, getCompanyProfile, createExtensionRequest } from "../client/apiclient";
import logger from "../logger";
import * as sessionService from "../services/session.service";
import * as errorMessages from "../model/error.messages";
import * as templatePaths from "../model/template.paths";
import * as pageURLs from "../model/page.urls";
import * as keys from "../session/keys";
import {buildCompanySummaryListRows} from "../global/summary.list.rows.builder";

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

export const confirmCompanyStartRequest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const userProfile = req.chSession.userProfile();
  if (!userProfile) {
    return next(new Error("No user profile found - Session data is missing"));
  }

  const companyNumber: string = sessionService.getCompanyInContext(req.chSession);
  if (!companyNumber) {
    return next(new Error(errorMessages.NO_COMPANY_NUMBER_IN_SESSION));
  }

  try {
    const token: string = req.chSession.accessToken() as string;
    if (token) {
      const company: ExtensionsCompanyProfile = await getCompanyProfile(companyNumber, token);

      const isFilingDateEligible: boolean = isExtensionDueDateWithinLimit(company);
      if (!isFilingDateEligible) {
        logger.info("Company not eligibile for extension as limit period has been exceeded");
        return res.redirect(pageURLs.EXTENSIONS_EXTENSION_LIMIT_REACHED);
      }

      const isDueDatePassed = checkDueDate(company);
      if (company.isAccountsOverdue || isDueDatePassed) {
        return res.render(templatePaths.ACCOUNTS_OVERDUE, {
          accountsDue: company.accountsDue,
          templateName: templatePaths.ACCOUNTS_OVERDUE,
        });
      }
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
      return res.redirect(pageURLs.EXTENSIONS_CHOOSE_REASON);
    } else {
      return next(new Error("User access token is missing from session"));
    }
  } catch (err) {
    return next(err);
  }
};

const isExtensionDueDateWithinLimit = (company: ExtensionsCompanyProfile): boolean => {
  const dueDateString: string = company.accountsDue;
  if (!dueDateString || dueDateString.length === 0) {
    return true;
  }
  const dueDate: Date = new Date(dueDateString);
  // TODO 1927 get minus value from chs config
  const dueDateMinusLimitPeriod = new Date(dueDate.setMonth(dueDate.getMonth() - 12));
  dueDateMinusLimitPeriod.setHours(0, 0, 0);
  const endDate: Date = new Date(company.accountingPeriodEndOn);
  endDate.setHours(0, 0, 0);
  return dueDateMinusLimitPeriod < endDate;
};

const checkDueDate = (company: ExtensionsCompanyProfile): boolean => {
  const currentDate: Date = new Date(Date.now());
  currentDate.setHours(0, 0, 0);
  const dueDate: Date = new Date(company.accountsDue);
  dueDate.setHours(23, 59, 59);
  return dueDate < currentDate;
};
