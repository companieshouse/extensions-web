import { NextFunction, Request, Response } from "express";
import * as sessionService from "../../services/session.service";

export default async (req: Request, res: Response, next: NextFunction) => {
  const reasonId: string = req.query.reasonId;
  if (reasonId) {
    await sessionService.setReasonInContextAsString(req.chSession, reasonId);
  }
  next();
};
