import { Router } from "express";
import LOGGER from "../logger";
import removeReasonAccessibility from "../controllers/accessibility/remove.reason.accessibility";
import checkAnswersAccessibility from "../controllers/accessibility/check.answers.accessibility";
import companyDetailsAccessibility from "../controllers/accessibility/company.details.accessibility";
import illnessEndDateAccessibility from "../controllers/accessibility/illness.end.date.accessibility";
import printAppAccessibility from "../controllers/accessibility/print.application.accessibility";
import continuedIllnessAccessibility from "../controllers/accessibility/continued.illness.accessibility";
import whoWasIllAccessibility from "../controllers/accessibility/who.was.ill.accessibility";
import * as pageURLs from "../model/page.urls";

const router: Router = Router();

if (process.env.NODE_ENV === "production") {
  const accessibilityErrorMessage =
    "Accessibility mode cannot be active in production mode. Turn off the ACCESSIBILITY_TEST_MODE flag!";
  LOGGER.error(accessibilityErrorMessage);
  throw new Error(accessibilityErrorMessage);
}

router.get(pageURLs.REMOVE_REASON, removeReasonAccessibility);
router.get(pageURLs.CONFIRM_COMPANY, companyDetailsAccessibility);
router.get(pageURLs.CHECK_YOUR_ANSWERS, checkAnswersAccessibility);
router.get(pageURLs.CONTINUED_ILLNESS, continuedIllnessAccessibility);
router.get(pageURLs.ILLNESS_END_DATE, illnessEndDateAccessibility);
router.get(pageURLs.PRINT_APPLICATION, printAppAccessibility);
router.get(pageURLs.REASON_ILLNESS, whoWasIllAccessibility);

export default router;
