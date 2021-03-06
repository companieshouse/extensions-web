import {NextFunction, Request, Response} from "express";
import * as sessionService from "../services/session.service";
import logger from "../logger";
import {ExtensionsCompanyProfile, getCompanyProfile, ExtensionFullRequest} from "../client/apiclient";
import * as templatePaths from "../model/template.paths";
import * as errorMessages from "../model/error.messages";
import {EXTENSIONS_CONFIRMATION} from "../model/page.urls";
import * as apiClient from "../client/apiclient";
import {IExtensionRequest} from "session/types";
import {ReasonWeb} from "../model/reason/extension.reason.web";
import {formatDateForDisplay} from "../client/date.formatter";
import {buildCompanySummaryListRows} from "../global/summary.list.rows.builder";

const recordLandingOnCheckDetailsPage = async (req: Request): Promise<void> => {
  await sessionService.changingDetails(req.chSession, true);
};

const route = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  await recordLandingOnCheckDetailsPage(req);
  const companyNumber: string = req.chSession.extensionSession().company_in_context;
  if (companyNumber) {
    try {
      logger.info(`Company number ${companyNumber} found in session, retrieving company profile`);
      const token: string = req.chSession.accessToken() as string;
      const companyInSession: ExtensionsCompanyProfile = await getCompanyProfile(companyNumber, token);
      const request: IExtensionRequest = sessionService.getRequest(req.chSession);
      const fullRequest: ExtensionFullRequest =
        await apiClient.getFullRequest(companyNumber, token, request.extension_request_id);
      const companySummaryListRows = buildCompanySummaryListRows(companyInSession, true, true, req);

      return res.render(templatePaths.CHECK_YOUR_ANSWERS, {
        company: companyInSession,
        companySummaryListRows,
        extensionLength: 0,
        extensionReasons: formatReasonDates(fullRequest.reasons),
        templateName: templatePaths.CHECK_YOUR_ANSWERS,
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

export default [route];
