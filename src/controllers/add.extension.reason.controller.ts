import {check, validationResult} from "express-validator/check";
import * as errorMessages from "../model/error.messages";
import {NextFunction, Request, Response} from "express";
import {ValidationError} from "../model/validation.error";
import {createGovUkErrorData, GovUkErrorData} from "../model/govuk.error.data";
import * as templatePaths from "../model/template.paths";
import * as pageURLs from "../model/page.urls";
import * as reasonService from "../services/reason.service";
import * as keys from "../session/keys";
import * as sessionService from "../services/session.service";

const validators = [
  check("addExtensionReason").not().isEmpty().withMessage(errorMessages.ADD_EXTENSION_REASON_DECISION_NOT_MADE),
];

export const render = (req: Request, res: Response, next: NextFunction): void => {
  let noChecked: boolean = false;
  let yesChecked: boolean = false;
  if (!(req.chSession.data[keys.EXTENSION_SESSION] === undefined)) {
    noChecked = req.chSession.data[keys.EXTENSION_SESSION][keys.ADD_ANOTHER_REASON_NO];
    yesChecked = req.chSession.data[keys.EXTENSION_SESSION][keys.ADD_ANOTHER_REASON_YES];
  }
  return res.render(templatePaths.ADD_EXTENSION_REASON, {
    isNoChecked: noChecked,
    isYesChecked: yesChecked,
    templateName: templatePaths.ADD_EXTENSION_REASON,
  });
};

const route = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errMsg: string = errors.array().map((err: ValidationError) => err.msg).pop() as string;
    if (errMsg) {
      const addReasonErr: GovUkErrorData = createGovUkErrorData(errMsg,
        "#add-extension-reason", true, "blank");
      return res.render(templatePaths.ADD_EXTENSION_REASON, {
        addExtensionReasonErr: addReasonErr,
        errorList: [
          addReasonErr,
        ],
        templateName: templatePaths.ADD_EXTENSION_REASON,
      });
    }
  } else {
    const decision: string = req.body.addExtensionReason;
    try {
      await reasonService.updateReason(req.chSession, {reason_status: "COMPLETED"});
      if (decision === "yes") {
        await sessionService.updateExtensionSessionValue(req.chSession, keys.ADD_ANOTHER_REASON_YES, true);
        await sessionService.updateExtensionSessionValue(req.chSession, keys.ADD_ANOTHER_REASON_NO, false);
        await sessionService.updateExtensionSessionValue(req.chSession, keys.ILLNESS_CHOSEN, false);
        await sessionService.updateExtensionSessionValue(req.chSession, keys.MISSING_AUTHENTICATION_CODE_CHOSEN, false);
        await sessionService.updateExtensionSessionValue(req.chSession, keys.ACCOUNTING_ISSUES_CHOSEN, false);
        await sessionService.updateExtensionSessionValue(req.chSession, keys.OTHER_CHOSEN, false);
        await sessionService.updateExtensionSessionValue(req.chSession, keys.UPLOAD_DOCUMENTS_YES, false);
        await sessionService.updateExtensionSessionValue(req.chSession, keys.UPLOAD_DOCUMENTS_NO, false);
        return res.redirect(pageURLs.EXTENSIONS_CHOOSE_REASON);
      } else {
        await sessionService.updateExtensionSessionValue(req.chSession, keys.ADD_ANOTHER_REASON_NO, true);
        await sessionService.updateExtensionSessionValue(req.chSession, keys.ADD_ANOTHER_REASON_YES, false);
        return res.redirect(pageURLs.EXTENSIONS_CHECK_YOUR_ANSWERS);
      }
    } catch (err) {
      return next(err);
    }
  }
};

export default[...validators, route];
