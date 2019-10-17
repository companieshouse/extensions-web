import {GovUkErrorData} from "../../model/govuk.error.data";
import {ReasonWeb} from "../../model/reason/extension.reason.web";
import {NextFunction, Request, Response} from "express";
import {AjaxUploadResponder} from "./ajax.upload.responder";
import {HtmlUploadResponder} from "./html.upload.responder";

export interface UploadResponder {
  handleSuccess(req: Request, res: Response): void;
  handleGenericError(res: Response, e: Error, next?: NextFunction): void;
  handleGovUKError(res: Response, errorData: GovUkErrorData, currentReason: ReasonWeb): void;
}

export const createUploadResponder = (isXhr: boolean): UploadResponder => {
  if (isXhr) {
    return new AjaxUploadResponder();
  } else {
    return new HtmlUploadResponder();
  }
};
