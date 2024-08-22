jest.mock("redis", () => {
  return {
    createClient: jest.fn().mockReturnThis(),
    on: jest.fn().mockReturnThis(),
  }
});
jest.mock("../../../services/reason.service");
jest.mock("../../../logger");

import {Request, Response} from "express";
import {AjaxUploadResponder} from "../../../controllers/upload/ajax.upload.responder";
import {getCurrentReasonFull} from "../../../services/reason.service";
import {ReasonWeb} from "../../../model/reason/extension.reason.web";
import {UPLOAD_ERROR_SUMMARY, UPLOAD_FILE_LIST, UPLOAD_FILE_PICKER} from "../../../model/template.paths";
import * as pageURLs from "../../../model/page.urls";
import logger from "../../../logger";
import {ERROR_500} from "../../../model/error.messages";
import {createGovUkErrorData, GovUkErrorData} from "../../../model/govuk.error.data";

const mockGetCurrentReasonFull = (<unknown>getCurrentReasonFull as jest.Mock<typeof getCurrentReasonFull>);
const mockLoggerError = (<unknown>logger.error as jest.Mock<typeof logger.error>);

// mock the request
const req: Request = {} as Request;

// mock the response
const res: Response = {} as Response;
const mockRenderFunc = jest.fn().mockImplementation((view, options?, callback? : ((err, html) => void)) => {
  if (callback) {
    callback( null, "DUMMY HTML");
  }
});

const mockSendFunc = jest.fn().mockImplementation((body?: any) => {
  return res;
});

const mockStatusFunc = jest.fn().mockImplementation((code: number) => {
  return res;
});

beforeEach(() => {
  res.render = mockRenderFunc;
  res.send = mockSendFunc;
  res.status = mockStatusFunc;

  mockRenderFunc.mockClear();
  mockLoggerError.mockClear();
  mockSendFunc.mockClear();
  mockStatusFunc.mockClear();

  mockGetCurrentReasonFull.prototype.constructor.mockImplementation(() => {
    return {
      "id": "1234",
      "reason": "illness",
      "attachments": [
        {
          "id": "2ef57740-200d-4cb0-b814-c3149efcf87b",
          "name": "squirrel.gif",
        },],
      "start_on": "1999-05-06",
      "end_on": "1999-07-08",
      "affected_person": "bob",
      "reason_information": "stuff",
      "continued_illness": "maybe",
      "reason_status": "open"
    } as ReasonWeb
  });
});

describe("ajax upload responder tests", () => {
  it("should return html fragments on success", async () => {
    const ajaxResponder: AjaxUploadResponder = new AjaxUploadResponder();

    await ajaxResponder.handleSuccess(req, res);

    expect(mockRenderFunc.mock.calls[0][0]).toContain(UPLOAD_FILE_LIST);
    expect(mockRenderFunc.mock.calls[1][0]).toContain(UPLOAD_FILE_PICKER);
    expect(mockSendFunc).toBeCalledWith({
      divs: [
        { divHtml: 'DUMMY HTML', divId: 'fileListDiv' },
        { divHtml: 'DUMMY HTML', divId: 'fileUploadDiv' }
        ]
    });
  });

  it("should return error page redirect if exception occurs in success", async () => {
    const err = new Error("Whoops");
    res.render = jest.fn().mockImplementationOnce((view, options?, callback? : ((err, html) => void)) => {
      throw err;
    });

    const ajaxResponder: AjaxUploadResponder = new AjaxUploadResponder();

    await ajaxResponder.handleSuccess(req, res);

    expect(mockLoggerError).toBeCalledWith(ERROR_500, err);
    expect(mockStatusFunc).toBeCalledWith(500);
    expect(mockSendFunc).toBeCalledWith({redirect: pageURLs.EXTENSIONS_ERROR});
  });

  it("should return error page and status 500 on generic error", () => {
    const ajaxResponder: AjaxUploadResponder = new AjaxUploadResponder();
    const err: Error = new Error("Oh Noes");

    ajaxResponder.handleGenericError(res, err);

    expect(mockLoggerError).toBeCalledWith(ERROR_500, err);
    expect(mockStatusFunc).toBeCalledWith(500);
    expect(mockSendFunc).toBeCalledWith({redirect: pageURLs.EXTENSIONS_ERROR});
  });

  it("should call render error divs on user error", async () => {
    const ajaxResponder: AjaxUploadResponder = new AjaxUploadResponder();
    const errorData: GovUkErrorData = createGovUkErrorData("Oh Noes", "#upload",
      true, "user");
    const reason: ReasonWeb = {} as ReasonWeb;

    await ajaxResponder.handleGovUKError(res, errorData, reason);

    expect(mockRenderFunc.mock.calls[0][0]).toContain(UPLOAD_ERROR_SUMMARY);
    expect(mockRenderFunc.mock.calls[0][1].errorList).toEqual([errorData]);
    expect(mockRenderFunc.mock.calls[1][0]).toContain(UPLOAD_FILE_PICKER);
    expect(mockRenderFunc.mock.calls[1][1].documentUploadErr).toEqual(errorData);
    expect(mockSendFunc).toBeCalledWith({
      divs: [
        { divHtml: 'DUMMY HTML', divId: 'errorSummaryDiv' },
        { divHtml: 'DUMMY HTML', divId: 'fileUploadDiv' }
      ]
    });
  });

  it("should return error page redirect if exception occurs in handleGovUKError", async () => {
    const err = new Error("Whoops");
    res.render = jest.fn().mockImplementationOnce((view, options?, callback? : ((err, html) => void)) => {
      throw err;
    });

    const ajaxResponder: AjaxUploadResponder = new AjaxUploadResponder();
    const errorData: GovUkErrorData = createGovUkErrorData("Oh Noes", "#upload",
      true, "user");
    const reason: ReasonWeb = {} as ReasonWeb;

    await ajaxResponder.handleGovUKError(res, errorData, reason);

    expect(mockLoggerError).toBeCalledWith(ERROR_500, err);
    expect(mockStatusFunc).toBeCalledWith(500);
    expect(mockSendFunc).toBeCalledWith({redirect: pageURLs.EXTENSIONS_ERROR});
  });
});
