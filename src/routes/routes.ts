import {NextFunction, Request, Response, Router} from "express";
import addExtensionReasonRoute from "../controllers/add.extension.reason.controller";
import chooseReasonRoute, {render as renderChooseReason} from "../controllers/choose.reason.controller";
import * as companyDetailsRoute from "../controllers/company.details.controller";
import companyNumberRoute from "../controllers/company.number.controller";
import illnessStartDateRoute, {
  render as renderIllnessStartDate} from "../controllers/illness/illness.start.date.controller";
import checkAnswersRoute from "../controllers/check.your.answers.controller";
import illnessInformationRoute, {
  render as renderIllnessInformation} from "../controllers/illness/illness.information.controller";
import * as illnessEndDateRoute from "../controllers/illness/illness.end.date.controller";
import * as continuedIllnessRoute from "../controllers/illness/continued.illness.controller";
import accountsDateRoute, {render as renderAccountsDate} from "../controllers/accounts/accounts.date.controller";
import accountsInformationRoute, {
  render as renderAccountsInformation} from "../controllers/accounts/accounts.information.controller";
import evidenceOptionRoute, {render as renderEvidenceOption} from "../controllers/evidence.option.controller";
import removeDocumentRoute, {render as renderRemoveDocument} from "../controllers/remove.document.controller";
import evidenceUploadRoute, {
  continueWithNoValidation as uploadContinueNoDocs,
  render as renderEvidenceUpload,
} from "../controllers/evidence.upload.controller";
import reasonOtherRoute, {render as renderReasonOther} from "../controllers/other/reason.other.controller";
import whoWasIllRoute, {render as renderWhoWasIll} from "../controllers/illness/who.was.ill.controller";
import {submit as submitCheckAnswers} from "../controllers/check.your.answers.controller";
import confirmationRoute from "../controllers/confirmation.controller";
import removeReasonPostRoute, {removeReasonGetRoute} from "../controllers/remove.reason.controller";
import downloadAttachmentRoute from "../controllers/download.attachment.controller";
import downloadAttachmentLandingRoute from "../controllers/download.attachment.landing.controller";
import printApplicationRoute from "../controllers/print.application.controller";
import {render as renderAddExtensionReason} from "../controllers/add.extension.reason.controller";
import * as pageURLs from "../model/page.urls";
import * as templatePaths from "../model/template.paths";
import sessionQuery from "../session/middleware/session.query";
import backLinkRoute from "../controllers/back.link.controller";

const router: Router = Router();

/**
 * Simply renders a view template.
 *
 * @param template the template name
 */
const renderTemplate = (template: string) => (req: Request, res: Response, next: NextFunction) => {
  return res.render(template, {templateName: template});
};

router.get(pageURLs.ROOT, renderTemplate(templatePaths.INDEX));

router.get(pageURLs.REMOVE_REASON, removeReasonGetRoute);
router.get(pageURLs.CONFIRM_COMPANY, companyDetailsRoute.route);
router.get(pageURLs.CHECK_YOUR_ANSWERS, ...checkAnswersRoute);
router.get(pageURLs.CONTINUED_ILLNESS, sessionQuery, continuedIllnessRoute.render);
router.get(pageURLs.ILLNESS_END_DATE, sessionQuery, illnessEndDateRoute.render);
router.get(pageURLs.PRINT_APPLICATION, ...printApplicationRoute);

router.get(pageURLs.COMPANY_NUMBER, renderTemplate(templatePaths.COMPANY_NUMBER));
router.post(pageURLs.COMPANY_NUMBER, ...companyNumberRoute);

router.post(pageURLs.CONFIRM_COMPANY, companyDetailsRoute.confirmCompanyStartRequest);

router.get(pageURLs.ACCOUNTS_OVERDUE, renderTemplate(templatePaths.ACCOUNTS_OVERDUE));

router.get(pageURLs.CHOOSE_REASON, renderChooseReason);
router.post(pageURLs.CHOOSE_REASON, ...chooseReasonRoute);

router.get(pageURLs.REASON_ILLNESS, sessionQuery, renderWhoWasIll);
router.post(pageURLs.REASON_ILLNESS, ...whoWasIllRoute);

router.get(pageURLs.ILLNESS_START_DATE, sessionQuery, renderIllnessStartDate);
router.post(pageURLs.ILLNESS_START_DATE, ...illnessStartDateRoute);

router.post(pageURLs.CONTINUED_ILLNESS, continuedIllnessRoute.processForm);

router.post(pageURLs.ILLNESS_END_DATE, ...illnessEndDateRoute.processForm);

router.get(pageURLs.REASON_ACCOUNTING_ISSUE, sessionQuery, renderAccountsDate);
router.post(pageURLs.REASON_ACCOUNTING_ISSUE, ...accountsDateRoute);

router.get(pageURLs.ACCOUNTS_INFORMATION, sessionQuery, renderAccountsInformation);
router.post(pageURLs.ACCOUNTS_INFORMATION, ...accountsInformationRoute);

router.get(pageURLs.REASON_OTHER, sessionQuery, renderReasonOther);
router.post(pageURLs.REASON_OTHER, ...reasonOtherRoute);

router.get(pageURLs.EVIDENCE_OPTION, renderEvidenceOption);
router.post(pageURLs.EVIDENCE_OPTION, ...evidenceOptionRoute);

router.get(pageURLs.EVIDENCE_UPLOAD, renderEvidenceUpload);
router.get(pageURLs.EVIDENCE_UPLOAD_CONTINUE_NO_DOCS, uploadContinueNoDocs);
router.post(pageURLs.EVIDENCE_UPLOAD, ...evidenceUploadRoute);

router.get(pageURLs.ADD_EXTENSION_REASON, renderAddExtensionReason);
router.post(pageURLs.ADD_EXTENSION_REASON, ...addExtensionReasonRoute);

router.post(pageURLs.CHECK_YOUR_ANSWERS, submitCheckAnswers);

router.get(pageURLs.ILLNESS_INFORMATION, renderIllnessInformation);
router.post(pageURLs.ILLNESS_INFORMATION, ...illnessInformationRoute);

router.get(pageURLs.CONFIRMATION, ...confirmationRoute);

router.post(pageURLs.REMOVE_REASON, ...removeReasonPostRoute);

router.get(pageURLs.DOWNLOAD_ATTACHMENT, ...downloadAttachmentRoute);

router.get(pageURLs.DOWNLOAD_ATTACHMENT_LANDING, ...downloadAttachmentLandingRoute);

router.get(pageURLs.REMOVE_DOCUMENT, renderRemoveDocument);
router.post(pageURLs.REMOVE_DOCUMENT, removeDocumentRoute);

router.get(pageURLs.ERROR, (res: Response) => {
  res.status(500).render(templatePaths.ERROR, {templateName: templatePaths.ERROR});
});

router.get(pageURLs.BACK_LINK, backLinkRoute);

export const appRouter = router;
