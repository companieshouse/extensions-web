import {AxiosError, AxiosRequestConfig, AxiosResponse, Method} from "axios";
import axios from "axios";
import logger from "../logger";

export const HTTP_GET: Method = "get";
export const HTTP_POST: Method = "post";
export const HTTP_PATCH: Method = "patch";
export const HTTP_DELETE: Method = "delete";

export const getBaseAxiosRequestConfig = (token: string): AxiosRequestConfig => {
  return {
    headers: {
      Accept: "application/json",
      Authorization: "Bearer " + token,
    },
    proxy: false,
  };
};

export const makeAPICall = async (config: AxiosRequestConfig): Promise<AxiosResponse> => {
  try {
    return await axios.request<any>(config);
  } catch (err) {
    logger.error(`API ERROR ${err}`);
    const axiosError = err as AxiosError;
    const {response, message} = axiosError;
    const error = {
      ...err,
      data: response ? (response?.data as {errors: Record<string, any>})?.errors : [],
    } as AxiosError;

    error.message = message;
    error.status = response ? response.status : -1;

    throw error
  }
};

export const getApiData = async (config: AxiosRequestConfig): Promise<any> => {
  const axiosResponse: AxiosResponse = await makeAPICall(config);
  const data = axiosResponse.data;
  logger.debug(`data returned from axios api call : ${JSON.stringify(data)}`);
  return data;
};
