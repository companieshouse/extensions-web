import {NextFunction, Request, Response} from "express";
import * as sessionService from "../services/session.service";
import * as templatePaths from "../model/template.paths";
import {ExtensionsCompanyProfile, getCompanyProfile} from "../client/apiclient";
import logger from "../logger";
import * as errorMessages from "../model/error.messages";

export const render = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const companyNumber: string = sessionService.getCompanyInContext(req.chSession);
  if (companyNumber) {
    try {
      const token: string = req.chSession.accessToken() as string;
      const company: ExtensionsCompanyProfile = await getCompanyProfile(companyNumber, token);
      res.render(templatePaths.AFTER_TWELVE_MONTHS, {
        companyName: company.companyName,
        companyNumber: company.companyNumber,
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
