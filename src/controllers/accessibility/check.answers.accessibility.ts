import {Request, Response, NextFunction} from "express";
import * as templatePaths from "../../model/template.paths";

const accessibilityTestRoute = (req: Request, res: Response, next: NextFunction) => {
  return res.render(templatePaths.CHECK_YOUR_ANSWERS, {
    company: {
      companyName: "Accessibility test",
    },
    extensionLength: 0,
    extensionReasons: [{
      continued_illness: "yes",
      illness_start_date: "12 December 2018",
      reason: "illness",
      reason_information: "lorem ipsum",
    }, {
      reason: "Another reason",
      reason_information: "other reason information",
    }],
    userEmail: "123@fakemail.com",
  });
};

export default accessibilityTestRoute;
