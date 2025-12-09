import { setExtensionRequestStatus } from "../../client/apiclient";
import { AxiosRequestConfig, AxiosResponse } from "axios";
import {
  getBaseAxiosRequestConfig,
  makeAPICall,
} from "../../client/axios.api.call.handler";
import { ExtensionRequestStatus } from "../../model/extension.request.status";

jest.mock("../../client/axios.api.call.handler");

const mockGetBaseAxiosRequestConfig = getBaseAxiosRequestConfig as jest.Mock;
const mockMakeAPICall = makeAPICall as jest.Mock;

const REQUEST_ID = "1234555";
const COMPANY_NUMBER = "123456";
const TOKEN = "7456465";

const dummyAxiosBaseConfig = {
  headers: {
    Accept: "application/json",
    Authorization: "Bearer " + TOKEN,
  },
  proxy: false,
} as AxiosRequestConfig;

const dummyAxiosResponse = {} as AxiosResponse;

describe("apiclient setExtensionRequestStatus", () => {
  beforeEach(() => {
    mockMakeAPICall.mockClear();
    mockGetBaseAxiosRequestConfig.mockClear();
  });

  it("calls makeApiCall with correct values", async () => {
    mockGetBaseAxiosRequestConfig.mockReturnValueOnce(dummyAxiosBaseConfig);
    mockMakeAPICall.mockResolvedValueOnce(dummyAxiosResponse);

    await setExtensionRequestStatus(
      ExtensionRequestStatus.REJECTED_MAX_EXT_LENGTH_EXCEEDED,
      REQUEST_ID,
      COMPANY_NUMBER,
      TOKEN
    );

    const expectedAxiosConfig = {
      url:
        "http://localhost:9333/company/123456/extensions/requests/" +
        REQUEST_ID,
      method: "patch",
      headers: {
        Accept: "application/json",
        Authorization: "Bearer " + TOKEN,
        "Content-Type": "application/json",
      },
      data: {
        status: "REJECTED_MAX_EXT_LENGTH_EXCEEDED",
      },
      proxy: false,
    } as AxiosRequestConfig;

    expect(mockMakeAPICall).toHaveBeenCalledTimes(1);
    expect(mockMakeAPICall).toHaveBeenCalledWith(expectedAxiosConfig);
  });

  it("throws error if makeApiCall throws error", async () => {
    mockGetBaseAxiosRequestConfig.mockReturnValueOnce(dummyAxiosBaseConfig);

    const error = new Error("oh no");
    mockMakeAPICall.mockRejectedValueOnce(error);

    await expect(
      setExtensionRequestStatus(
        ExtensionRequestStatus.REJECTED_MAX_EXT_LENGTH_EXCEEDED,
        REQUEST_ID,
        COMPANY_NUMBER,
        TOKEN
      )
    ).rejects.toThrow(error);

    expect(mockMakeAPICall).toHaveBeenCalledTimes(1);
  });
});
