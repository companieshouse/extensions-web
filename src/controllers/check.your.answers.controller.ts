import {NextFunction, Request, Response} from "express";
import * as sessionService from "../services/session.service";
import logger from "../logger";
import {CompanyProfile, getCompanyProfile, ExtensionFullRequest} from "../client/apiclient";
import * as templatePaths from "../model/template.paths";
import * as errorMessages from "../model/error.messages";
import {EXTENSIONS_CONFIRMATION} from "../model/page.urls";
import * as apiClient from "../client/apiclient";
import {IExtensionRequest, ISignInInfo, IUserProfile} from "session/types";
import {ReasonWeb} from "../model/reason/extension.reason.web";
import {formatDateForDisplay} from "../client/date.formatter";
import * as keys from "../session/keys";

const recordLandingOnCheckDetailsPage = async (req: Request): Promise<void> => {
  await sessionService.changingDetails(req.chSession, true);
};

const route = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  recordLandingOnCheckDetailsPage(req);
  const companyNumber: string = req.chSession.extensionSession().company_in_context;
  if (companyNumber) {
    try {
      logger.info(`Company number ${companyNumber} found in session, retrieving company profile`);
      const token: string = req.chSession.accessToken() as string;
      const companyInSession: CompanyProfile = await getCompanyProfile(companyNumber, token);
      const request: IExtensionRequest = sessionService.getRequest(req.chSession);
      const fullRequest: ExtensionFullRequest =
        await apiClient.getFullRequest(companyNumber, token, request.extension_request_id);
      return res.render(templatePaths.CHECK_YOUR_ANSWERS, {
        company: companyInSession,
        extensionLength: 0,
        extensionReasons: formatReasonDates(fullRequest.reasons),
        templateName: templatePaths.CHECK_YOUR_ANSWERS,
        userEmail: getUserEmail(req),
      });
    } catch (e) {
      logger.error(`Error retrieving company number ${companyNumber} from redis`, e);
      return next(e);
    }
  } else {
    logger.info(errorMessages.NO_COMPANY_NUMBER_IN_SESSION);
    return next(errorMessages.NO_COMPANY_NUMBER_IN_SESSION);
  }
};

export const submit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  res.redirect(EXTENSIONS_CONFIRMATION);
};

const formatReasonDates = (reasons: ReasonWeb[]): ReasonWeb[] => {
  reasons.forEach((reason: ReasonWeb) => {
    reason.start_on = formatDateForDisplay(reason.start_on);
    reason.end_on = formatDateForDisplay(reason.end_on);
  });
  return reasons;
};

const getUserEmail = (req: Request): string => {
  const signInInfo: ISignInInfo = req.chSession.data[keys.SIGN_IN_INFO] as ISignInInfo;
  const userProfile: IUserProfile = signInInfo[keys.USER_PROFILE] as IUserProfile;
  const email = userProfile.email;
  return email ? email : "";
};

export default [route];
