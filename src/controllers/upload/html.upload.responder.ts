import {UploadResponder} from "./upload.responder.factory";
import {NextFunction, Request, Response} from "express";
import {EXTENSIONS_DOCUMENT_UPLOAD} from "../../model/page.urls";
import {GovUkErrorData} from "../../model/govuk.error.data";
import {ReasonWeb} from "../../model/reason/extension.reason.web";
import * as templatePaths from "../../model/template.paths";

export class HtmlUploadResponder implements UploadResponder {

  public handleSuccess = async (req: Request, res: Response): Promise<void> => {
    return res.redirect(EXTENSIONS_DOCUMENT_UPLOAD);
  }

  public handleGenericError = (res: Response, e: Error, next?: NextFunction): void => {
    if (next) {
      return next(e);
    }
  }

  public handleGovUKError = (res: Response, errorData: GovUkErrorData, currentReason: ReasonWeb): void => {
    return res.render(templatePaths.DOCUMENT_UPLOAD, {
      documentsUploadErr: errorData,
      errorList: [errorData],
      reason: currentReason,
      templateName: templatePaths.DOCUMENT_UPLOAD,
    });
  }
}
