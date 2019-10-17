import Session from "../session/session";
import * as sessionService from "./session.service";
import * as apiClient from "../client/apiclient";
import {ExtensionFullRequest, getFullRequest, ListReasonResponse} from "../client/apiclient";
import { ReasonWeb } from "model/reason/extension.reason.web";
import { IExtensionRequest } from "session/types";
import logger from "../logger";

export const updateReason = async (chSession: Session, partialReason): Promise<any> => {
    return await processReason(chSession, apiClient.updateReason, partialReason);
};

export const getCurrentReason = async (chSession: Session): Promise<ReasonWeb | undefined> => {
  const reasons: ListReasonResponse = await processReason(chSession, apiClient.getReasons);
  const reasonToGet = sessionService.getRequest(chSession).reason_in_context_string;
  return reasons.items
    .filter((reason) => reason.id === reasonToGet)
    .pop();
};

export const getCurrentReasonFull = async (chSession: Session): Promise<ReasonWeb> => {
  const request: IExtensionRequest = sessionService.getRequest(chSession);
  const token: string = chSession.accessToken() as string;
  const companyNumber: string = chSession.extensionSession().company_in_context;

  const fullRequest: ExtensionFullRequest =
    await getFullRequest(companyNumber, token, request.extension_request_id);

  return fullRequest.reasons.find((element) => {
    return element.id === request.reason_in_context_string;
  }) as ReasonWeb;
};

export const deleteCurrentReason = async (chSession: Session): Promise<any> => {
    return await processReason(chSession, apiClient.removeExtensionReasonFromRequest);
};

const processReason = async (chSession: Session, apiClientFunction, body?): Promise<any> => {
  const request: IExtensionRequest = sessionService.getRequest(chSession);
  const token: string = chSession.accessToken() as string;
  if (request && token) {
    logger.info(`Calling apiClient for ${chSession.extensionSession().company_in_context}`);
    return body ? await apiClientFunction(request, token, body) :
      await apiClientFunction(request, token);
  }
  return Promise.reject("invalid session data");
};
