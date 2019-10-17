import {NextFunction, Request, Response} from "express";
import * as templatePaths from "../../model/template.paths";

const accessibilityTestRoute = (req: Request, res: Response, next: NextFunction) => {
  return res.render(templatePaths.PRINT_APPLICATION, {
    company: {
      accountsDue: "12th December 2019",
      address: {
        line_1: "123 fake street",
        line_2: "Fake town",
        postCode: "CF11 1AA",
      },
      companyName: "Test company",
      companyNumber: "00006400",
      date_of_creation: "20th January 2019",
      type: "LTD",
    },
    extensionLength: 0,
    extensionReasons: [{
      affected_person: "Director",
      attachments: [{
        name: "attachment.jpg",
      }],
      continued_illness: "no",
      end_on: "1st January 2019",
      reason: "illness",
      reason_information: "ill",
      start_on: "1st January 2018",
    }],
    userEmail: "123@testmail.com",
  });
};

export default accessibilityTestRoute;
