import {NextFunction, Request, Response} from "express";
import * as sessionService from "../services/session.service";
import logger from "../logger";
import {ExtensionsCompanyProfile, getCompanyProfile, ExtensionFullRequest} from "../client/apiclient";
import * as templatePaths from "../model/template.paths";
import * as errorMessages from "../model/error.messages";
import * as apiClient from "../client/apiclient";
import {IExtensionRequest, ISignInInfo, IUserProfile} from "session/types";
import {ReasonWeb} from "../model/reason/extension.reason.web";
import {formatDateForDisplay} from "../client/date.formatter";
import * as keys from "../session/keys";

const createMissingError = (item: string): Error => {
  const errMsg: string = item + " missing from session";
  return new Error(errMsg);
};

const printApplicationRoute = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const companyNumber: string = sessionService.getCompanyInContext(req.chSession);
  const signInInfo: ISignInInfo = req.chSession.data[keys.SIGN_IN_INFO] as ISignInInfo;
  const userProfile: IUserProfile = signInInfo[keys.USER_PROFILE] as IUserProfile;
  const email = userProfile.email;
  if (!email) {
    return next(createMissingError("User Email"));
  }

  if (companyNumber) {
    try {
      logger.info(`Company number ${companyNumber} found in session, retrieving company profile`);
      const token: string = req.chSession.accessToken() as string;
      const companyInSession: ExtensionsCompanyProfile = await getCompanyProfile(companyNumber, token);
      const request: IExtensionRequest = sessionService.getRequest(req.chSession);
      const fullRequest: ExtensionFullRequest =
        await apiClient.getFullRequest(companyNumber, token, request.extension_request_id);

      return res.render(templatePaths.PRINT_APPLICATION, {
        company: companyInSession,
        extensionLength: 0,
        extensionReasons: formatReasonDates(fullRequest.reasons),
        templateName: templatePaths.PRINT_APPLICATION,
        userEmail: email,
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

const formatReasonDates = (reasons: ReasonWeb[]): ReasonWeb[] => {
  reasons.forEach((reason: ReasonWeb) => {
    reason.start_on = formatDateForDisplay(reason.start_on);
    reason.end_on = formatDateForDisplay(reason.end_on);
  });
  return reasons;
};

export default [printApplicationRoute];
