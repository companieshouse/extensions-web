import {NextFunction, Request, Response} from "express";
import * as pageURLs from "../model/page.urls";
import {IExtensionRequest} from "../session/types";
import * as sessionService from "../services/session.service";
import * as apiClient from "../client/apiclient";
import logger from "../logger";
import {check, validationResult, ValidationError} from "express-validator";
import * as errorMessages from "../model/error.messages";
import {createGovUkErrorData, GovUkErrorData} from "../model/govuk.error.data";
import * as templatePaths from "../model/template.paths";
import * as reasonService from "../services/reason.service";
import { ReasonWeb } from "model/reason/extension.reason.web";

const validators = [
  check("removeDocument").not().isEmpty().withMessage(errorMessages.REMOVE_DOCUMENT_DECISION_NOT_MADE),
];

export const render = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  let reason: ReasonWeb | undefined;
  try {
    reason = await reasonService.getReasonFromFullRequest(req);
  } catch (err) {
    logger.info("Error caught retrieving reason from request");
    return next(err);
  }
  if (reason) {
    const attachment = reason.attachments.filter((attachmentItem) => attachmentItem.id === req.query.documentID).pop();
    if (attachment) {
      return res.render(templatePaths.REMOVE_DOCUMENT, {fileName: attachment.name});
    } else {
      return res.render(templatePaths.REMOVE_DOCUMENT);
    }
  } else {
    return res.render(templatePaths.REMOVE_DOCUMENT);
  }
};

const route = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errMsg: string = errors.array().map((err: ValidationError) => err.msg).pop() as string;
    if (errMsg) {
      const decisionNotMadeErr: GovUkErrorData = createGovUkErrorData(errMsg,
        "#remove-document", true, "");
      return res.render(templatePaths.REMOVE_DOCUMENT, {
          errorList: [
            decisionNotMadeErr,
          ],
          removeDocumentErr: decisionNotMadeErr,
      });
    }
  } else {
    const choice = req?.body?.removeDocument;
    if (choice === "yes") {
      const companyNumber: string = sessionService.getCompanyInContext(req.chSession);
      if (companyNumber) {
        try {
          const token: string = req.chSession.accessToken() as string;
          const request: IExtensionRequest = sessionService.getRequest(req.chSession);
          await apiClient.removeAttachment(companyNumber, token, request.extension_request_id,
            request.reason_in_context_string as string, req.query.documentID as string);
          return res.redirect(pageURLs.EXTENSIONS_DOCUMENT_UPLOAD);
        } catch (e) {
          logger.error(`Error removing attachment for company ${companyNumber}`, e);
          return next(e);
        }
      }
    } else {
      return res.redirect(pageURLs.EXTENSIONS_DOCUMENT_UPLOAD);
    }
  }
};

export default [...validators, route];
