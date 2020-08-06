import {NextFunction, Request, Response} from "express";
import * as sessionService from "../services/session.service";
import * as templatePaths from "../model/template.paths";
import {ExtensionsCompanyProfile, getCompanyProfile} from "../client/apiclient";
import logger from "../logger";
import * as errorMessages from "../model/error.messages";
import {MAX_EXTENSION_PERIOD_IN_MONTHS} from "../session/config";

export const render = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const companyNumber: string = sessionService.getCompanyInContext(req.chSession);
  if (companyNumber) {
    try {
      const token: string = req.chSession.accessToken() as string;
      const company: ExtensionsCompanyProfile = await getCompanyProfile(companyNumber, token);
      const companyName: string = company.companyName;
      const monthLimit = MAX_EXTENSION_PERIOD_IN_MONTHS;
      return res.render(templatePaths.EXTENSION_LIMIT_REACHED, {
        companyName,
        companyNumber,
        monthLimit,
      });
    } catch (e) {
      logger.error(`Due date limit reached - Error retrieving company number ${companyNumber} from redis`, e);
      return next(e);
    }
   } else {
    logger.info(errorMessages.NO_COMPANY_NUMBER_IN_SESSION);
    return next(new Error(errorMessages.NO_COMPANY_NUMBER_IN_SESSION));
  }
};
