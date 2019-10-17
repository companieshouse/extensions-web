import {Request, Response, NextFunction} from "express";
import * as templatePaths from "../../model/template.paths";

const accessibilityTestRoute = (req: Request, res: Response, next: NextFunction) => {
  return res.render(templatePaths.REMOVE_REASON, {
    company: {
      companyName: "Accessibility testing",
    },
    extensionLength: 1,
    reason: {
      reason: "other reason",
      reason_information: "some information",
    },
    reasonDisplayNumber: 2,
    userEmail: "companieshouse",
  });
};

export default accessibilityTestRoute;
