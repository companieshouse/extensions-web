import { NextFunction, Request, Response } from "express";
import * as templatePaths from "../model/template.paths";
import * as keys from "../session/keys";
import {ISignInInfo, IUserProfile} from "../session/types";
import * as sessionService from "../services/session.service";
import * as apiClient from "../client/apiclient";
import logger from "../logger";
import activeFeature from "../feature.flag";
import RequestCountMonitor from "../global/request.count.monitor";
import {saveSession} from "../services/redis.service";

const createMissingError = (item: string): Error => {
  const errMsg: string = item + " missing from session";
  return new Error(errMsg);
};

const route = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const companyNum: string = sessionService.getCompanyInContext(req.chSession);
  if (!companyNum) {
    return next(createMissingError("Company Number"));
  }

  const signInInfo: ISignInInfo = req.chSession.data[keys.SIGN_IN_INFO] as ISignInInfo;
  const userProfile: IUserProfile = signInInfo[keys.USER_PROFILE] as IUserProfile;
  const email = userProfile.email;
  if (!email) {
    return next(createMissingError("User Email"));
  }
  const isSubmitted: boolean = req.chSession.data[keys.SUBMITTED];
  if (!isSubmitted) {
    req.chSession.data[keys.SUBMITTED] = true;
    await saveSession(req.chSession).then(async () => {
      const token = req.chSession.accessToken();
      const request = sessionService.getRequest(req.chSession);
      if (token && request) {
        try {
          await apiClient.callProcessorApi(companyNum, token, request.extension_request_id);
        } catch (e) {
          logger.error("Error processing application " + JSON.stringify(e));
          return next(e);
        }
        if (activeFeature(process.env.FEATURE_REQUEST_COUNT)) {
          RequestCountMonitor.updateTodaysRequestNumber(1);
        } else {
          logger.info("Feature flag is toggled off for request number counter update");
        }
      }
    });
  } else {
    logger.error("Form already submitted, not processing again");
  }
  return res.render(templatePaths.CONFIRMATION,
    {
      companyNumber: companyNum,
      templateName: templatePaths.CONFIRMATION,
      userEmail: email,
    });
};

export default [route];
