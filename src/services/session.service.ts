import Session from "../session/session";
import {IExtensionSession, IExtensionRequest, PageHistory} from "session/types";
import {saveSession} from "./redis.service";
import * as keys from "../session/keys";

/**
 * Gets the current object form the session as an array
 * @param chSession
 */
const getRequests = (chSession: Session): IExtensionRequest[] => {
  return chSession.data.extension_session
    .extension_requests
    .filter((extRequest: IExtensionRequest) => extRequest.company_number === getCompanyInContext(chSession));
};

/**
 * Gets the current Request object from the session.
 * @param chSession
 */
const getRequest = (chSession: Session): IExtensionRequest => {
  return getRequests(chSession).pop() as IExtensionRequest;
};

const setReasonInContextAsString = async (chSession: Session, reasonInContext: string): Promise<void> => {
  getRequests(chSession)
    .forEach((extRequest) => extRequest.reason_in_context_string = reasonInContext);
  await saveSession(chSession);
};

/**
 * looks in the session to see if a request for the company in context is stored.
 * @param chSession
 */
const hasExtensionRequest = async (chSession: Session):
    Promise<boolean> => {
  const extensionSession = chSession.extensionSession();
  if (!extensionSession) {
    return false;
  }

  return await extensionSession.extension_requests
      .map((extRequest: IExtensionRequest) => extRequest.company_number)
      .includes(getCompanyInContext(chSession));
};

/**
 * Adds a new extension request to the session for the company in context
 * @param chSession
 * @param requestId - requestId returned from the api
 */
const addRequest = async (chSession: Session, requestId: string):
    Promise<IExtensionRequest> => {
  const extensionSession = await chSession.data.extension_session;
  const companyNumber: string = getCompanyInContext(chSession);
  if (await hasExtensionRequest(chSession)) {
    throw Error(`Request already exists for company ${companyNumber}`);
  }

  const newExtensionRequest: IExtensionRequest = {
    company_number: companyNumber,
    extension_request_id: requestId,
    reason_in_context_string: "",
  };
  extensionSession.extension_requests.push(newExtensionRequest);
  chSession.appendData(keys.EXTENSION_SESSION, extensionSession);
  await saveSession(chSession);
  return newExtensionRequest;
};

/**
 * Changes the company in context. Eg, a user has 2 companies and begins a
 * journey adding a request for company number 1, then they start a new journey
 * for a second company. The first journey will have company 1 in context and
 * so on.
 * @param chSession
 * @param companyNumber
 */
const changeCompanyInContext = async (chSession: Session, companyNumber: string):
    Promise<void> => {
  chSession.appendData(keys.EXTENSION_SESSION, {
    company_in_context: companyNumber,
    extension_requests: chSession.data.extension_session.extension_requests,
  });
  await saveSession(chSession);
};

/**
 * Creates a new extension session and adds a company to the context.
 * This will override any extension session that is already in redis.
 * @param chSession
 * @param companyNumber
 */
const createExtensionSession = async (chSession: Session, companyNumber: string): Promise<IExtensionSession> => {
  const extensionSession: IExtensionSession = {
    company_in_context: companyNumber,
    extension_requests: [],
  };
  chSession.appendData(keys.EXTENSION_SESSION, extensionSession);
  await saveSession(chSession);
  return extensionSession;
};

const createHistoryIfNone = async (chSession: Session, restart: boolean): Promise<PageHistory> => {
  const existingPageHistory = chSession.data[keys.PAGE_HISTORY];
  if (!existingPageHistory || restart) {
    const pageHistory: PageHistory = {
      page_history: [],
    };
    chSession.appendData(keys.PAGE_HISTORY, pageHistory);
    await saveSession(chSession);
    return pageHistory;
  } else {
    return existingPageHistory;
  }
};

const updateHistory = async (pageHistory: PageHistory, chSession: Session, url?: string): Promise<void> => {
  if (url) {
    pageHistory.page_history.push(url);
  }
  await saveSession(chSession);
};

const updateNavigationBackFlag = async (chSession: Session, hasNavigatedBack: boolean): Promise<void> => {
  chSession.appendData(keys.NAVIGATION_BACK_FLAG, hasNavigatedBack);
  await saveSession(chSession);
};

const updateExtensionSessionValue = async (chSession: Session, key: string, value: any): Promise<void> => {
  const extensionSession = await chSession.data.extension_session;
  extensionSession[key] = value;
  chSession.appendData(keys.EXTENSION_SESSION, extensionSession);
  await saveSession(chSession);
};

/**
 * Returns the company in context. That is the most recent company that was
 * input in the company number screen.
 * @param chSession
 */
const getCompanyInContext = (chSession: Session): string => {
  return chSession.data.extension_session.company_in_context;
};

const changingDetails = async (chSession: Session, flag: boolean): Promise<void> => {
  chSession.appendData(keys.CHANGING_DETAILS, flag);
  await saveSession(chSession);
};

export { hasExtensionRequest,
  getRequest,
  addRequest,
  changeCompanyInContext,
  createExtensionSession,
  createHistoryIfNone,
  updateHistory,
  updateNavigationBackFlag,
  updateExtensionSessionValue,
  setReasonInContextAsString,
  getCompanyInContext,
  changingDetails,
};
