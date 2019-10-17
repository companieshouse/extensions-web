import { NextFunction, Request, Response } from "express";
import * as templatePaths from "../../model/template.paths";

const accessibilityTestRoute = (req: Request, res: Response, next: NextFunction) => {
  return res.render(templatePaths.REASON_ILLNESS, {
    templateName: templatePaths.REASON_ILLNESS,
  });
};

export default accessibilityTestRoute;
