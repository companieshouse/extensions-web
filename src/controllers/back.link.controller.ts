import {NextFunction, Request, Response} from "express";
import * as keys from "../session/keys";
import {PageHistory} from "../session/types";
import * as sessionService from "../services/session.service";
import * as pageURLs from "../model/page.urls";
import logger from "../logger";

const route = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  await sessionService.updateNavigationBackFlag(req.chSession, true);
  const pageHistory: PageHistory = req.chSession.data[keys.PAGE_HISTORY];
  let back: string | undefined = pageHistory.page_history.pop();
  const currentUrl: string | undefined = req.header("Referer");
  if (!back) {
    logger.error("Back navigation: problem obtaining back url");
    res.redirect(pageURLs.EXTENSIONS);
  } else if (!currentUrl) {
    logger.error("Back navigation: the referer is missing in the header");
    await sessionService.updateHistory(pageHistory, req.chSession);
    res.redirect(back);
  } else {
    if (historyPageIsCurrentPage(back, currentUrl)) {
      back = pageHistory.page_history.pop();
    }
    await sessionService.updateHistory(pageHistory, req.chSession);
    if (back) {
      res.redirect(back);
    } else {
      logger.error("Back navigation: problem obtaining back url");
      res.redirect(pageURLs.EXTENSIONS);
    }
  }
};

const historyPageIsCurrentPage = (historyStackURL: string, currentUrl: string): boolean => {
  currentUrl = currentUrl.substring(currentUrl.indexOf("/extensions"));
  currentUrl = currentUrl.replace(".html", "");
  return historyStackURL === currentUrl;
};

export default [route];
