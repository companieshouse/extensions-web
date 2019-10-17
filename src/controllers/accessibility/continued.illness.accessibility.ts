import {NextFunction, Request, Response} from "express";
import * as templatePaths from "../../model/template.paths";

const accessibilityTestRoute = (req: Request, res: Response, next: NextFunction) => {
  return res.render(templatePaths.CONTINUED_ILLNESS, {startDate: "20th December 2018"});
};

export default accessibilityTestRoute;
