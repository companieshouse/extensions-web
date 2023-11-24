import {NextFunction, Request, Response} from "express";
import {ReasonWeb} from "../../model/reason/extension.reason.web";
import logger from "../../logger";
import {ERROR_500} from "../../model/error.messages";
import * as pageURLs from "../../model/page.urls";
import {GovUkErrorData} from "../../model/govuk.error.data";
import {UploadResponder} from "./upload.responder.factory";
import {getCurrentReasonFull} from "../../services/reason.service";
import {UPLOAD_ERROR_SUMMARY, UPLOAD_FILE_LIST, UPLOAD_FILE_PICKER} from "../../model/template.paths";

export class AjaxUploadResponder implements UploadResponder {

  public handleSuccess = async (req: Request, res: Response): Promise<void> => {
    const thisReason: ReasonWeb = await getCurrentReasonFull(req.chSession);
    const divsArray: object[] = [];

    try {
      await this.renderFragment(res, UPLOAD_FILE_LIST, {reason: thisReason})
        .then((html: string) => this.processObjectOption(divsArray, html, "fileListDiv"));
      logger.trace("Rendered fragment " + UPLOAD_FILE_LIST);

      await this.renderFragment(res, UPLOAD_FILE_PICKER, {reason: thisReason})
        .then((html: string) => this.processObjectOption(divsArray, html, "fileUploadDiv"));
      logger.trace("Rendered fragment " + UPLOAD_FILE_PICKER);
      res.send({divs: divsArray});
    } catch (e) {
      this.handleGenericError(res, e);
    }
  }

  public handleGenericError = (res: Response, e: Error, next?: NextFunction): void => {
    logger.error(ERROR_500, e);
    res.status(500).send({redirect: pageURLs.EXTENSIONS_ERROR});
  }

  public handleGovUKError = async (res: Response,
                                   errorData: GovUkErrorData,
                                   currentReason: ReasonWeb): Promise<void> => {
    const divsArray: object[] = [];

    try {
      await this.renderFragment(res, UPLOAD_ERROR_SUMMARY, {
        errorList: [errorData],
      }).then((html: string) => this.processObjectOption(divsArray, html, "errorSummaryDiv"));
      logger.trace("Rendered fragment " + UPLOAD_ERROR_SUMMARY);
      await this.renderFragment(res, UPLOAD_FILE_PICKER, {
        documentUploadErr: errorData,
        reason: currentReason,
      }).then((html: string) => this.processObjectOption(divsArray, html, "fileUploadDiv"));
      logger.trace("Rendered fragment " + UPLOAD_FILE_PICKER);

      res.send({divs: divsArray});
    } catch (e) {
      this.handleGenericError(res, e);
    }
  }

  private processObjectOption = (divsArray: object[], html: string, id: string): void => {
    divsArray.push(
      { divHtml: html,
        divId: id });
  }

  private renderFragment = async (res: Response, view: string, options: object): Promise<string> => {
    return new Promise((resolve, reject) => {
      res.render(view,
        options,
        (err: Error, html: string) => {
          if (err) {
            reject(err);
          } else {
            resolve(html);
          }
        });
    });
  }
}
