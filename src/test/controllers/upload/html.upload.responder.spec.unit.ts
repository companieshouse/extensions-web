import { HtmlUploadResponder } from "../../../controllers/upload/html.upload.responder";
import { Request, Response } from "express";
import { EXTENSIONS_DOCUMENT_UPLOAD } from "../../../model/page.urls";
import {
  createGovUkErrorData,
  GovUkErrorData,
} from "../../../model/govuk.error.data";
import { ReasonWeb } from "../../../model/reason/extension.reason.web";
import * as templatePaths from "../../../model/template.paths";

// mock the request
const req: Request = {} as Request;

// mock the response
const res: Response = {} as Response;
const mockRenderFunc = jest.fn().mockImplementation((page: string) => {
  return null;
});
res.render = mockRenderFunc;

const mockRedirectFunc = jest.fn().mockImplementation((page: string) => {
  return null;
});
res.redirect = mockRedirectFunc;

const mockNextFunc = jest.fn().mockImplementation((e: Error) => {
  return null;
});
req.next = mockNextFunc;

describe("html upload responder tests", () => {
  it("should call redirect from success", () => {
    const htmlResponder: HtmlUploadResponder = new HtmlUploadResponder();

    htmlResponder.handleSuccess(req, res);

    expect(mockRedirectFunc).toHaveBeenCalledWith(EXTENSIONS_DOCUMENT_UPLOAD);
  });

  it("should forward to next() on generic error", () => {
    const htmlResponder: HtmlUploadResponder = new HtmlUploadResponder();
    const err: Error = new Error("Oh Noes");

    htmlResponder.handleGenericError(res, err, req.next);

    expect(mockNextFunc).toHaveBeenCalledWith(err);
  });

  it("should call render on user error", () => {
    const htmlResponder: HtmlUploadResponder = new HtmlUploadResponder();
    const errorData: GovUkErrorData = createGovUkErrorData(
      "Oh Noes",
      "#upload",
      true,
      "user"
    );
    const reason: ReasonWeb = {} as ReasonWeb;

    htmlResponder.handleGovUKError(res, errorData, reason);

    expect(mockRenderFunc).toHaveBeenCalledWith(templatePaths.DOCUMENT_UPLOAD, {
      errorList: [errorData],
      documentsUploadErr: errorData,
      reason: reason,
      templateName: templatePaths.DOCUMENT_UPLOAD,
    });
  });
});
