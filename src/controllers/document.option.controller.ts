import {NextFunction, Request, Response} from "express";
import {check, validationResult} from "express-validator/check";
import * as errorMessages from "../model/error.messages";
import {createGovUkErrorData, GovUkErrorData} from "../model/govuk.error.data";
import * as pageURLs from "../model/page.urls";
import * as templatePaths from "../model/template.paths";
import {ValidationError} from "../model/validation.error";
import * as keys from "../session/keys";
import * as sessionService from "../services/session.service";

const validators = [
  check("supportingDocuments").not().isEmpty().withMessage(errorMessages.UPLOAD_DOCUMENTS_DECISION_NOT_MADE),
];

export const render = (req: Request, res: Response, next: NextFunction): void => {
  let noChecked: boolean = false;
  let yesChecked: boolean = false;
  if (req.chSession.data[keys.EXTENSION_SESSION] !== undefined) {
    noChecked = req.chSession.data[keys.EXTENSION_SESSION][keys.UPLOAD_DOCUMENTS_NO];
    yesChecked = req.chSession.data[keys.EXTENSION_SESSION][keys.UPLOAD_DOCUMENTS_YES];
  }
  return res.render(templatePaths.DOCUMENT_OPTION, {
    isNoChecked: noChecked,
    isYesChecked: yesChecked,
    templateName: templatePaths.DOCUMENT_OPTION,
  });
};

const route = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errMsg: string = errors.array().map((err: ValidationError) => err.msg).pop() as string;
    if (errMsg) {
      const decisionNotMadeErr: GovUkErrorData = createGovUkErrorData(errMsg,
        "#supporting-documents", true, "");
      return res.render(templatePaths.DOCUMENT_OPTION, {
        errorList: [
          decisionNotMadeErr,
        ],
        supportingDocumentsErr: decisionNotMadeErr,
        templateName: templatePaths.DOCUMENT_OPTION,
      });
    }
  } else {
    const decision: string = req.body.supportingDocuments;
    if (decision === "yes") {
      await sessionService.updateExtensionSessionValue(req.chSession, keys.UPLOAD_DOCUMENTS_YES, true);
      await sessionService.updateExtensionSessionValue(req.chSession, keys.UPLOAD_DOCUMENTS_NO, false);
      return res.redirect(pageURLs.EXTENSIONS_DOCUMENT_UPLOAD);
    } else {
      await sessionService.updateExtensionSessionValue(req.chSession, keys.UPLOAD_DOCUMENTS_NO, true);
      await sessionService.updateExtensionSessionValue(req.chSession, keys.UPLOAD_DOCUMENTS_YES, false);
      return res.redirect(pageURLs.EXTENSIONS_ADD_EXTENSION_REASON);
    }
  }
};

export default[...validators, route];
