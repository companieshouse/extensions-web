import {NextFunction, Request, Response} from "express";
import logger from "../logger";
import * as sessionService from "../services/session.service";
import {ExtensionsCompanyProfile, getCompanyProfile} from "../client/apiclient";
import * as templatePaths from "../model/template.paths";
import * as errorMessages from "../model/error.messages";
import {formatDateForDisplay} from "../client/date.formatter";

export const render = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const companyNumber: string = sessionService.getCompanyInContext(req.chSession);
  if (companyNumber) {
    try {
      logger.info(`Too Soon - Company number ${companyNumber} found in session, retrieving company profile`);
      const token: string = req.chSession.accessToken() as string;
      const company: ExtensionsCompanyProfile = await getCompanyProfile(companyNumber, token);

      // calculate the 'can file from date' to show on screen
      const canFileFromDate: Date = new Date(company.accountsDue);
      canFileFromDate.setHours(0, 0, 0, 0);
      canFileFromDate.setDate(canFileFromDate.getDate() - Number(process.env.TOO_SOON_DAYS_BEFORE_DUE_DATE));
      logger.info(`Too Soon - canFileFromDate = ${canFileFromDate.toUTCString()}`);

      return res.render(templatePaths.TOO_SOON, {
        accountsDue: formatDateForDisplay(company.accountsDue),
        fileFromDate: formatDateForDisplay(canFileFromDate.toUTCString()),
        templateName: templatePaths.TOO_SOON,
      });
    } catch (e) {
      logger.error(`Too Soon - Error retrieving company number ${companyNumber} from redis`, e);
      return next(e);
    }
  } else {
    logger.info(errorMessages.NO_COMPANY_NUMBER_IN_SESSION);
    return next(new Error(errorMessages.NO_COMPANY_NUMBER_IN_SESSION));
  }
};
