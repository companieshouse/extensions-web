import { Request, Response } from "express";
import logger from "../logger";

export const get = (req: Request, res: Response) => {
  logger.debug(`GET healthcheck`);

  res.status(200).send("OK");
};
