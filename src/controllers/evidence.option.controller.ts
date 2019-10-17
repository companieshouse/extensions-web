import {NextFunction, Request, Response} from "express";
import {check, validationResult} from "express-validator/check";
import * as errorMessages from "../model/error.messages";
import {createGovUkErrorData, GovUkErrorData} from "../model/govuk.error.data";
import * as pageURLs from "../model/page.urls";
import * as templatePaths from "../model/template.paths";
import {ValidationError} from "../model/validation.error";

const validators = [
  check("supportingEvidence").not().isEmpty().withMessage(errorMessages.UPLOAD_EVIDENCE_DECISION_NOT_MADE),
];

export const render = (req: Request, res: Response, next: NextFunction): void => {
  return res.render(templatePaths.EVIDENCE_OPTION, {
    templateName: templatePaths.EVIDENCE_OPTION,
  });
};

const route = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errMsg: string = errors.array().map((err: ValidationError) => err.msg).pop() as string;
    if (errMsg) {
      const decisionNotMadeErr: GovUkErrorData = createGovUkErrorData(errMsg,
        "#supporting-evidence", true, "");
      return res.render(templatePaths.EVIDENCE_OPTION, {
        errorList: [
          decisionNotMadeErr,
        ],
        supportingEvidenceErr: decisionNotMadeErr,
        templateName: templatePaths.EVIDENCE_OPTION,
      });
    }
  } else {
    const decision: string = req.body.supportingEvidence;
    if (decision === "yes") {
      return res.redirect(pageURLs.EXTENSIONS_EVIDENCE_UPLOAD);
    } else {
      return res.redirect(pageURLs.EXTENSIONS_ADD_EXTENSION_REASON);
    }
  }
};

export default[...validators, route];
