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
import documentsOptionRoute, {render as renderDocumentsOption} from "../controllers/document.option.controller";
import removeDocumentRoute, {render as renderRemoveDocument} from "../controllers/remove.document.controller";
import documentsUploadRoute, {
  continueWithNoValidation as uploadContinueNoDocs,
  render as renderDocumentsUpload,
} from "../controllers/document.upload.controller";
import reasonOtherRoute, {render as renderReasonOther} from "../controllers/other/reason.other.controller";
import whoWasIllRoute, {render as renderWhoWasIll} from "../controllers/illness/who.was.ill.controller";
import {submit as submitCheckAnswers} from "../controllers/check.your.answers.controller";
import confirmationRoute from "../controllers/confirmation.controller";
import removeReasonPostRoute, {removeReasonGetRoute} from "../controllers/remove.reason.controller";
import downloadAttachmentRoute from "../controllers/download.attachment.controller";
import downloadAttachmentLandingRoute from "../controllers/download.attachment.landing.controller";
import printApplicationRoute from "../controllers/print.application.controller";
import {render as renderAddExtensionReason} from "../controllers/add.extension.reason.controller";
import * as pageUrls from "../model/page.urls";
import * as templatePaths from "../model/template.paths";
import sessionQuery from "../session/middleware/session.query";
import backLinkRoute from "../controllers/back.link.controller";
import {render as showTooSoonPage} from "../controllers/too.soon.controller";
import {render as showExtensionLimitReachedPage} from "../controllers/extension.limit.reached.controller";
import * as healthcheck from "../controllers/healthcheck.controller";

const router: Router = Router();

/**
 * Simply renders a view template.
 *
 * @param template the template name
 */
const renderTemplate = (template: string) => (req: Request, res: Response, next: NextFunction) => {
  return res.render(template, {templateName: template});
};

router.get(pageUrls.ROOT, renderTemplate(templatePaths.INDEX));

router.get(pageUrls.REMOVE_REASON, removeReasonGetRoute);
router.get(pageUrls.CONFIRM_COMPANY, companyDetailsRoute.route);
router.get(pageUrls.CHECK_YOUR_ANSWERS, ...checkAnswersRoute);
router.get(pageUrls.CONTINUED_ILLNESS, sessionQuery, continuedIllnessRoute.render);
router.get(pageUrls.ILLNESS_END_DATE, sessionQuery, illnessEndDateRoute.render);
router.get(pageUrls.PRINT_APPLICATION, ...printApplicationRoute);

router.get(pageUrls.COMPANY_NUMBER, renderTemplate(templatePaths.COMPANY_NUMBER));
router.post(pageUrls.COMPANY_NUMBER, ...companyNumberRoute);

router.post(pageUrls.CONFIRM_COMPANY, companyDetailsRoute.confirmCompanyStartRequest);

router.get(pageUrls.ACCOUNTS_OVERDUE, renderTemplate(templatePaths.ACCOUNTS_OVERDUE));

router.get(pageUrls.CHOOSE_REASON, renderChooseReason);
router.post(pageUrls.CHOOSE_REASON, ...chooseReasonRoute);

router.get(pageUrls.REASON_ILLNESS, sessionQuery, renderWhoWasIll);
router.post(pageUrls.REASON_ILLNESS, ...whoWasIllRoute);

router.get(pageUrls.ILLNESS_START_DATE, sessionQuery, renderIllnessStartDate);
router.post(pageUrls.ILLNESS_START_DATE, ...illnessStartDateRoute);

router.post(pageUrls.CONTINUED_ILLNESS, continuedIllnessRoute.processForm);

router.post(pageUrls.ILLNESS_END_DATE, ...illnessEndDateRoute.processForm);

router.get(pageUrls.REASON_ACCOUNTING_ISSUE, sessionQuery, renderAccountsDate);
router.post(pageUrls.REASON_ACCOUNTING_ISSUE, ...accountsDateRoute);

router.get(pageUrls.ACCOUNTS_INFORMATION, sessionQuery, renderAccountsInformation);
router.post(pageUrls.ACCOUNTS_INFORMATION, ...accountsInformationRoute);

router.get(pageUrls.REASON_OTHER, sessionQuery, renderReasonOther);
router.post(pageUrls.REASON_OTHER, ...reasonOtherRoute);

router.get(pageUrls.DOCUMENT_OPTION, renderDocumentsOption);
router.post(pageUrls.DOCUMENT_OPTION, ...documentsOptionRoute);

router.get(pageUrls.DOCUMENT_UPLOAD, renderDocumentsUpload);
router.get(pageUrls.DOCUMENT_UPLOAD_CONTINUE_NO_DOCS, uploadContinueNoDocs);
router.post(pageUrls.DOCUMENT_UPLOAD, ...documentsUploadRoute);

router.get(pageUrls.ADD_EXTENSION_REASON, renderAddExtensionReason);
router.post(pageUrls.ADD_EXTENSION_REASON, ...addExtensionReasonRoute);

router.post(pageUrls.CHECK_YOUR_ANSWERS, submitCheckAnswers);

router.get(pageUrls.ILLNESS_INFORMATION, renderIllnessInformation);
router.post(pageUrls.ILLNESS_INFORMATION, ...illnessInformationRoute);

router.get(pageUrls.CONFIRMATION, ...confirmationRoute);

router.post(pageUrls.REMOVE_REASON, ...removeReasonPostRoute);

router.get(pageUrls.DOWNLOAD_ATTACHMENT, ...downloadAttachmentRoute);

router.get(pageUrls.DOWNLOAD_ATTACHMENT_LANDING, ...downloadAttachmentLandingRoute);

router.get(pageUrls.REMOVE_DOCUMENT, renderRemoveDocument);
router.post(pageUrls.REMOVE_DOCUMENT, removeDocumentRoute);

router.get(pageUrls.ERROR, (_req: Request ,res: Response, _next: NextFunction) => {
  res.status(500).render(templatePaths.ERROR, {templateName: templatePaths.ERROR});
});

router.get(pageUrls.TOO_SOON, showTooSoonPage);

router.get(pageUrls.EXTENSION_LIMIT_REACHED, showExtensionLimitReachedPage);

router.get(pageUrls.BACK_LINK, backLinkRoute);

router.get(pageUrls.ACCESSIBILITY_STATEMENT, renderTemplate(templatePaths.ACCESSIBILITY_STATEMENT));

router.get(pageUrls.HEALTHCHECK, healthcheck.get);

export const appRouter = router;
