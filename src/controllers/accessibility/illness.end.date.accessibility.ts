import {Request, Response, NextFunction} from "express";
import * as templatePaths from "../../model/template.paths";

const accessibilityTestRoute = (req: Request, res: Response, next: NextFunction) => {
  return res.render(templatePaths.ILLNESS_END_DATE, {startDate: "20 December 2018"});
};

export default accessibilityTestRoute;
