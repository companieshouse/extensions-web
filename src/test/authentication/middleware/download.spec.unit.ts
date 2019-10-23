// mock the apiclient
const mockGetFullRequest: jest.Mock = jest.fn((companyId: any, token: any, requestId: any) => extensionsRequest);
jest.mock("../../../client/apiclient", () => {
  return {
    getFullRequest: mockGetFullRequest
  }
});

// mock the session
const mockSession: Session = jest.genMockFromModule("../../../session/session");

// mock the request
const req = {
  chSession: mockSession,
  params: {
    companyId: "00006400",
    requestId: "HG33KL7"
  }
};

// mock the response
const res: Response = {} as Response;
const mockRenderFunc = jest.fn().mockImplementation((page: string) => {
  return null
});
res.render = mockRenderFunc;

// mock the NextFunction
const mockNextFunc = jest.fn().mockResolvedValue(null);

import {DOWNLOAD_NOT_AUTHORISED} from "../../../model/template.paths";
import Session from "../../../session/session";
import {authenticateForDownload} from "../../../authentication/middleware/download";
import {Request, Response} from "express";
import {IUserProfile} from "../../../session/types";
import {ExtensionFullRequest} from "../../../client/apiclient";

// dummy ExtensionFullRequest
const extensionsRequest: ExtensionFullRequest = {
  created_by: {
    id: "XXX"
  }
} as ExtensionFullRequest;

// dummy UserProfiles
const userProfileIncorrectPermissions: IUserProfile = {
  id: "xyz",
  permissions: {
    "incorrect_name": true
  }
};

const userProfileCorrectPermissions: IUserProfile = {
  id: "xyz",
  permissions: <{ [key: string]: boolean}>{
    "dummy_download_permission": true,
    "dummy_view_permission": true
  }
};

const userProfileCorrectId: IUserProfile = {
  id: "XXX",
  permissions: {
    "incorrect_name": true
  }
};

const ACCESS_TOKEN: string = "1234";
const REQ_PARAM_COMPANY_ID: string = "companyId";
const REQ_PARAM_REQUEST_ID: string = "requestId";

describe("Download authorisation tests", () => {

  beforeEach(() => {
    mockRenderFunc.mockClear();
    mockNextFunc.mockClear();
    mockGetFullRequest.mockClear();
  });

  it("Should return error page if not authorised", async () => {
    mockSession.userProfile = jest.fn().mockImplementation(() => userProfileIncorrectPermissions);
    mockSession.accessToken = jest.fn().mockImplementation(() => ACCESS_TOKEN);

    await authenticateForDownload(req as any, res, mockNextFunc);

    expect(mockGetFullRequest).toHaveBeenCalledWith(req.params[REQ_PARAM_COMPANY_ID], ACCESS_TOKEN, req.params[REQ_PARAM_REQUEST_ID]);
    expect(mockRenderFunc).toHaveBeenCalledWith(DOWNLOAD_NOT_AUTHORISED);
    expect(mockNextFunc).not.toHaveBeenCalled();
  });

  it("Should call the next function in the middleware chain if user is in correct role", async () => {
    mockSession.userProfile = jest.fn().mockImplementation(() => userProfileCorrectPermissions);

    await authenticateForDownload(req as any, res, mockNextFunc);

    expect(mockNextFunc).toHaveBeenCalled();
    expect(mockGetFullRequest).not.toHaveBeenCalled();
    expect(mockRenderFunc).not.toHaveBeenCalled();
  });

  it("Should call the next function in the middleware chain if user created the extension request", async () => {
    mockSession.userProfile = jest.fn().mockImplementation(() => userProfileCorrectId);

    mockSession.accessToken = jest.fn().mockImplementation(() => ACCESS_TOKEN);

    await authenticateForDownload(req as any, res, mockNextFunc);

    expect(mockGetFullRequest).toHaveBeenCalledWith(req.params[REQ_PARAM_COMPANY_ID], ACCESS_TOKEN, req.params[REQ_PARAM_REQUEST_ID]);
    expect(mockNextFunc).toHaveBeenCalled();
    expect(mockRenderFunc).not.toHaveBeenCalled();
  });
});
