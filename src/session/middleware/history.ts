import {NextFunction, Request, Response} from "express";
import * as keys from "../keys";
import * as sessionService from "../../services/session.service";
import {updateNavigationBackFlag} from "../../services/session.service";
import {EXTENSIONS,
  REMOVE_DOCUMENT,
  DOCUMENT_UPLOAD_CONTINUE_NO_DOCS,
  BACK_LINK,
  REASON_ID,
  OAUTH_LOGIN_URL} from "../../model/page.urls";
import {PageHistory} from "../types";
import Session from "../session";

export default async (req: Request, res: Response, next: NextFunction) => {
  if (req.method.toString() === "GET" && !containsProhibitedUrls(
    [BACK_LINK, DOCUMENT_UPLOAD_CONTINUE_NO_DOCS],
    req.baseUrl)) {
    const hasNavigatedBack: boolean = req.chSession.data[keys.NAVIGATION_BACK_FLAG];
    const referringPageURL = getReferringPageUrl(req);
    if (!hasNavigatedBack || referringPageURL.endsWith("extensions")) {
      let restart: boolean = false;
      if (referringPageURL.endsWith("extensions")) {
        restart = true;
        await updateNavigationBackFlag(req.chSession, false);
      }
      await updatePageHistory(referringPageURL, req.chSession, req.baseUrl, restart);
    } else {
      await updateNavigationBackFlag(req.chSession, false);
    }
  }
  next();
};

const getReferringPageUrl = (req: Request): string => {
  let referringPageURL = req.header("Referer") as string;
  if (referringPageURL.includes(OAUTH_LOGIN_URL)) {
    referringPageURL = EXTENSIONS;
  }
  return referringPageURL;
};

const updatePageHistory = async (referringPageURL: string, chSession: Session,
                                 baseUrl: string, restart: boolean): Promise<void> => {
  const pageHistory: PageHistory = await sessionService.createHistoryIfNone(chSession, restart);
  referringPageURL = makeReferringPageURLRelative(referringPageURL);
  if (!(historyAlreadyContainsUrl(pageHistory, referringPageURL) ||
    referringPageIsCurrentPage(referringPageURL, baseUrl) ||
    containsProhibitedUrls([REASON_ID, REMOVE_DOCUMENT], referringPageURL))) {
    await sessionService.updateHistory(pageHistory, chSession, referringPageURL);
  }
};

const historyAlreadyContainsUrl = (pageHistory: PageHistory, referringPageURL: string): boolean => {
    for (const index in pageHistory.page_history) {
      if (pageHistory.page_history[index] === referringPageURL) {
        return true;
      }
    }
    return false;
};

const referringPageIsCurrentPage = (referringPageURL: string, currentUrl: string): boolean => {
   return referringPageURL === currentUrl;
};

const containsProhibitedUrls = (prohibited: string[], url: string): boolean => {
  for (const index in prohibited) {
    if (url.includes(prohibited[index])) {
      return true;
    }
  }
  return false;
};

const makeReferringPageURLRelative = (referringPageURL: string): string => {
  referringPageURL = referringPageURL.substring(referringPageURL.indexOf("/extensions"));
  return referringPageURL.replace(".html", "");
};
