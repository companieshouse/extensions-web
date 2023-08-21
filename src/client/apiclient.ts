import { AxiosRequestConfig, AxiosResponse } from "axios";
import {lookupCompanyStatus, lookupCompanyType} from "./api.enumerations";
import logger from "../logger";
import { API_URL, EXTENSIONS_API_URL, EXTENSIONS_PROCESSOR_API_URL } from "../session/config";
import * as FormData from "form-data";
import { ReasonWeb } from "model/reason/extension.reason.web";
import {formatDateForDisplay} from "./date.formatter";
import {Response} from "express";
import { IExtensionRequest } from "session/types";

import {createApiClient} from "ch-sdk-node";
import Resource from "ch-sdk-node/dist/services/resource";
import {CompanyProfile} from "ch-sdk-node/dist/services/company-profile";
import {
  getApiData,
  getBaseAxiosRequestConfig,
  HTTP_DELETE,
  HTTP_GET,
  HTTP_PATCH,
  HTTP_POST,
  makeAPICall,
} from "./axios.api.call.handler";
import {ExtensionRequestStatus} from "../model/extension.request.status";

export interface ExtensionsCompanyProfile {
  hasBeenLiquidated: boolean;
  hasCharges: boolean;
  hasInsolvencyHistory: boolean;
  companyName: string;
  companyNumber: string;
  companyStatus: string;
  companyType: string;
  address: {
    line_1: string;
    line_2: string;
    postCode: string;
  };
  accountsDue: string;
  accountingPeriodStartOn: string;
  accountingPeriodEndOn: string;
  isAccountsOverdue: boolean;
  incorporationDate: string;
}

/**
 * The interface for a full extension request follows the api contract for a full request
 * of which the reasons are labeled 'reasons' in the json response
 */
export interface ExtensionFullRequest {
  id: string;
  reasons: ReasonWeb[];
  created_by: {
    id: string,
  };
}

/**
 * The interface for a List of reasons follows the api contract for a get reasons request
 * of which the reasons are labeled 'items' in the json response
 */
export interface ListReasonResponse {
  items: ReasonWeb[];
}

/**
 * Get the company profile from the api. If the company does not exist or there has been an error, an exception
 * will be thrown.
 *
 * @param companyNumber the company number.
 * @param token the bearer security token to use to call the api
 */
export const getCompanyProfile = async (companyNumber: string, token: string): Promise<ExtensionsCompanyProfile> => {
  logger.debug("Creating CH SDK ApiClient");
  const api = createApiClient(undefined, token, `${API_URL}`);

  logger.info(`Looking for company profile with company number ${companyNumber}`);
  const sdkResponse: Resource<CompanyProfile> =
    await api.companyProfile.getCompanyProfile(companyNumber.toUpperCase());

  if (sdkResponse.httpStatusCode >= 400) {
    throw {
      status: sdkResponse.httpStatusCode,
    };
  }

  logger.debug("Data from company profile SDK call " + JSON.stringify(sdkResponse, null, 2));

  const companyProfile = sdkResponse.resource as CompanyProfile;

  return {
    accountingPeriodEndOn: companyProfile.accounts.nextAccounts.periodEndOn,
    accountingPeriodStartOn: companyProfile.accounts.nextAccounts.periodStartOn,
    accountsDue: companyProfile.accounts.nextDue ? formatDateForDisplay(companyProfile.accounts.nextDue) : "",
    address: {
      line_1: companyProfile.registeredOfficeAddress.addressLineOne,
      line_2: companyProfile.registeredOfficeAddress.addressLineTwo,
      postCode: companyProfile.registeredOfficeAddress.postalCode,
    },
    companyName: companyProfile.companyName,
    companyNumber: companyProfile.companyNumber,
    companyStatus: lookupCompanyStatus(companyProfile.companyStatus),
    companyType: lookupCompanyType(companyProfile.type),
    hasBeenLiquidated: companyProfile.hasBeenLiquidated,
    hasCharges: companyProfile.hasCharges,
    hasInsolvencyHistory: companyProfile.hasInsolvencyHistory,
    incorporationDate: formatDateForDisplay(companyProfile.dateOfCreation),
    isAccountsOverdue: companyProfile.accounts.overdue,
  };
};

export const createExtensionRequest = async (company: ExtensionsCompanyProfile, token: string): Promise<any> => {
  const CREATE_REQUEST_PATH =  `${EXTENSIONS_API_URL}/company/${company.companyNumber}/extensions/requests/`;
  logger.debug("createExtensionRequest api url = " + CREATE_REQUEST_PATH);

  const config: AxiosRequestConfig = getBaseAxiosRequestConfig(token);
  config.headers["Content-Type"] = "application/json";
  config.data = {
    accounting_period_end_on: company.accountingPeriodEndOn,
    accounting_period_start_on: company.accountingPeriodStartOn,
  };
  config.method = HTTP_POST;
  config.url = CREATE_REQUEST_PATH;
  logger.info(`Creating extension request for company ${company.companyNumber}`);
  return await getApiData(config);
};

export const addExtensionReasonToRequest = async (
  companyNumber: string, token: string, requestId: string, extensionReason: string): Promise<any> => {
  const ADD_REASON_PATH =
    `${EXTENSIONS_API_URL}/company/${companyNumber}/extensions/requests/${requestId}/reasons`;

  const config: AxiosRequestConfig = getBaseAxiosRequestConfig(token);
  config.headers["Content-Type"] = "application/json";
  config.data = {reason: extensionReason};
  config.method = HTTP_POST;
  config.url = ADD_REASON_PATH;
  logger.info(`Creating and adding reason to request ${requestId} for company ${companyNumber}`);
  return await getApiData(config);
};

export const updateReason = async (request: IExtensionRequest, token: string, partialReason): Promise<any> => {
  const ADD_REASON_PATH =
    `${EXTENSIONS_API_URL}/company/${request.company_number}/extensions/` +
    `requests/${request.extension_request_id}/reasons/${request.reason_in_context_string}`;

  const config: AxiosRequestConfig = getBaseAxiosRequestConfig(token);
  config.headers["Content-Type"] = "application/json";
  config.data = partialReason;
  config.method = HTTP_PATCH;
  config.url = ADD_REASON_PATH;

  return await getApiData(config);
};

export const removeExtensionReasonFromRequest = async (request: IExtensionRequest, token: string): Promise<any> => {
  const REMOVE_REASON_PATH =
    `${EXTENSIONS_API_URL}/company/${request.company_number}/extensions/requests/` +
    `${request.extension_request_id}/reasons/${request.reason_in_context_string}`;
  const config: AxiosRequestConfig = getBaseAxiosRequestConfig(token);
  config.method = HTTP_DELETE;
  config.url = REMOVE_REASON_PATH;
  logger.info(`Removing reason ${request.reason_in_context_string} from request
  ${request.extension_request_id} for company ${request.company_number}`);
  return await getApiData(config);
};

export const addAttachmentToReason = async ( companyNumber: string,
                                             token: string,
                                             requestId: string,
                                             reasonId: string,
                                             attachment: Buffer,
                                             fileName: string): Promise<any> => {
  const ADD_ATTACHMENT_PATH =
    `${EXTENSIONS_API_URL}/company/${companyNumber}/extensions/requests/${requestId}/reasons/${reasonId}/attachments`;

  const data = new FormData();
  data.append("file", attachment, {filename: fileName});

  const config: AxiosRequestConfig = {
    data,
    headers: {
      post: {
        ...{Authorization: "Bearer " + token},
        ...data.getHeaders(),
      },
    },
    method: HTTP_POST,
    proxy: false,
    url: ADD_ATTACHMENT_PATH,
  };
  logger.info(`Adding attachment to request ${requestId} for company ${companyNumber}`);
  return await getApiData(config);
};

export const removeAttachment = async (companyNumber: string, token: string,
                                       requestId: string, reasonId: string,
                                       attachmentId: string): Promise<any> => {
  const REMOVE_ATTACHMENT_PATH =
    `${EXTENSIONS_API_URL}/company/${companyNumber}/extensions/requests/` +
      `${requestId}/reasons/${reasonId}/attachments/${attachmentId}`;
  const config: AxiosRequestConfig = getBaseAxiosRequestConfig(token);
  config.method = HTTP_DELETE;
  config.url = REMOVE_ATTACHMENT_PATH;
  logger.info(`Removing attachment ${attachmentId} from request ${requestId} for company ${companyNumber}`);
  return await getApiData(config);
};

export const getFullRequest = async (companyNumber: string, token: string,
                                     requestId: string): Promise<ExtensionFullRequest> => {
  const GET_REQUEST_PATH =
    `${EXTENSIONS_API_URL}/company/${companyNumber}/extensions/requests/${requestId}`;
  const config: AxiosRequestConfig = getBaseAxiosRequestConfig(token);
  config.method = HTTP_GET;
  config.url = GET_REQUEST_PATH;

  return await getApiData(config) as ExtensionFullRequest;
};

export const getReasons = async (request: IExtensionRequest, token: string): Promise<ListReasonResponse> => {
  const GET_REASONS_PATH =
  `${EXTENSIONS_API_URL}/company/${request.company_number}/extensions/requests/${request.extension_request_id}/reasons`;
  const config: AxiosRequestConfig = getBaseAxiosRequestConfig(token);
  config.method = HTTP_GET;
  config.url = GET_REASONS_PATH;

  return await getApiData(config) as ListReasonResponse;
};

export const download = async (downloadUri: string, token: string, res: Response): Promise<void> => {
  const config: AxiosRequestConfig = {
    headers: {
      Authorization: "Bearer " + token,
    },
    proxy: false,
  };
  config.method = HTTP_GET;
  config.url = `${EXTENSIONS_API_URL}${downloadUri}`;
  config.responseType = "stream";

  const axiosResponse: AxiosResponse = await makeAPICall(config);

  const isDebugEnabled: boolean = logger.isDebugEnabled();
  if (isDebugEnabled) {
    logger.debug("download - axios response headers = " + JSON.stringify(axiosResponse.headers));
  }

  const contentDispositionHeader: string = "content-disposition";
  const contentTypeHeader: string = "content-type";
  const contentLengthHeader: string = "content-length";

  // copy the headers from axios response into our response
  res.setHeader(contentDispositionHeader, axiosResponse.headers[contentDispositionHeader]);
  res.setHeader(contentTypeHeader, axiosResponse.headers[contentTypeHeader]);
  res.setHeader(contentLengthHeader, axiosResponse.headers[contentLengthHeader]);

  if (isDebugEnabled) {
    logger.debug("Returning response with headers " + JSON.stringify(res.getHeaders()));
  }

  prefixFilename(res, contentDispositionHeader);
  // copy data into response
  axiosResponse.data.pipe(res);
};

export const prefixFilename = (res: Response, contentDispositionHeader: string ): void => {
  let header: string = res.get(contentDispositionHeader) as string;
  header = header.replace("filename=\"", "filename=\"CH_EXT_");
  res.setHeader(contentDispositionHeader, header);
};

export const callProcessorApi = async (companyNumber: string, token: string, requestId: string) => {
  const PROCESSOR_API_PATH =
    `${EXTENSIONS_PROCESSOR_API_URL}/company/${companyNumber}/extensions/requests/${requestId}/process`;
  const config: AxiosRequestConfig = getBaseAxiosRequestConfig(token);
  config.method = HTTP_POST;
  config.url = PROCESSOR_API_PATH;
  logger.info(`Calling processor api for request ${requestId} for company ${companyNumber}`);
  return await makeAPICall(config);
};

export const setExtensionRequestStatus = async (status: ExtensionRequestStatus,
                                                requestId: string,
                                                companyNumber: string,
                                                token: string) => {
  const config: AxiosRequestConfig = getBaseAxiosRequestConfig(token);
  config.headers["Content-Type"] = "application/json";
  config.data = {
    status,
  };
  config.method = HTTP_PATCH;
  config.url = `${EXTENSIONS_API_URL}/company/${companyNumber}/extensions/requests/${requestId}`;

  logger.info(`Updating status to ${status} for request ${requestId} for company ${companyNumber}`);
  await makeAPICall(config);
};
