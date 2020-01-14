import { NextFunction, Request, Response } from "express";
import * as templatePaths from "../model/template.paths";
import * as keys from "../session/keys";
import {ISignInInfo, IUserProfile} from "../session/types";
import * as sessionService from "../services/session.service";
import * as apiClient from "../client/apiclient";
import logger from "../logger";
import activeFeature from "../feature.flag";
import RequestCountMonitor from "../global/request.count.monitor";
import {getReasons, ListReasonResponse} from "../client/apiclient";
import {FEATURE_MISSING_AUTHENTICATION_CODE} from "../session/config";

const createMissingError = (item: string): Error => {
  const errMsg: string = item + " missing from session";
  return new Error(errMsg);
};

const route = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const companyNum: string = await sessionService.getCompanyInContext(req.chSession);
  let isMissingAuthenticationCodeJourney: boolean = false;
  let numOfReasons: number = 0;
  if (!companyNum) {
    return next(createMissingError("Company Number"));
  }

  const signInInfo: ISignInInfo = req.chSession.data[keys.SIGN_IN_INFO] as ISignInInfo;
  const userProfile: IUserProfile = signInInfo[keys.USER_PROFILE] as IUserProfile;
  const email = userProfile.email;
  const token: string = req.chSession.accessToken() as string;
  const request = sessionService.getRequest(req.chSession);

  if (!email) {
    return next(createMissingError("User Email"));
  }
  const isSubmitted: boolean = req.chSession.data.extension_session[keys.ALREADY_SUBMITTED];
  if (!isSubmitted) {
    try {
      await sessionService.updateExtensionSessionValue(req.chSession, keys.ALREADY_SUBMITTED, true);
      if (token && request) {
        await apiClient.callProcessorApi(companyNum, token, request.extension_request_id);
        if (activeFeature(process.env.FEATURE_REQUEST_COUNT)) {
          RequestCountMonitor.updateTodaysRequestNumber(1);
        } else {
          logger.info("Feature flag is toggled off for request number counter update");
        }
      }
    } catch (e) {
      logger.error("Error processing application " + JSON.stringify(e));
      await sessionService.updateExtensionSessionValue(req.chSession, keys.ALREADY_SUBMITTED, false);
      return next(e);
    }
  } else {
    logger.error("Form already submitted, not processing again");
  }

  if (token && request && activeFeature(FEATURE_MISSING_AUTHENTICATION_CODE)) {
    const requestReasons: ListReasonResponse =
      await getReasons(request, token);
    numOfReasons = requestReasons.items.length;
    if (requestReasons) {
      requestReasons.items.forEach(
        (reason) => {
          if (reason.reason === "missing company authentication code") {
            isMissingAuthenticationCodeJourney = true;
          }
        },
      );
    }
  }

  return res.render(templatePaths.CONFIRMATION,
    {
      authCodeFlag: isMissingAuthenticationCodeJourney,
      companyNumber: companyNum,
      numberOfReasons: numOfReasons,
      templateName: templatePaths.CONFIRMATION,
      userEmail: email,
    });
};

export default [route];
