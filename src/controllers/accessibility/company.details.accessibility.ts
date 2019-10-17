import {Request, Response, NextFunction} from "express";
import * as templatePaths from "../../model/template.paths";

const accessibilityTestRoute = (req: Request, res: Response, next: NextFunction) => {
  return res.render(templatePaths.CONFIRM_COMPANY, {company: {
    accountsDue: "12 December 2018",
    address: {
      line_1: "123 fake st",
      line_2: "faketown",
      postCode: "123abc",
    },
    companyName: "Accessibility test company",
    companyNumber: "123456",
    companyStatus: "ALIVE",
    companyType: "trading",
    incorporationDate: "12 December 2018",
    isAccountsOverdue: false,
  }});
};

export default accessibilityTestRoute;
