// arbitrary map type of string => T
export interface IMap<T> {
  [key: string]: T;
}

export interface IAccessToken {
  token?: string;
  expiresIn?: number;
  refreshToken?: string;
  tokenType?: string;
}

export interface IUserProfile {
  email?: string;
  forename?: string;
  id?: string;
  locale?: string;
  scope?: string;
  permissions?: IMap<boolean>;
  surname?: string;
}

export interface ISignInInfo {
  accessToken?: IAccessToken;
  adminPermissions?: boolean;
  companyNumber?: string;
  signedIn?: boolean;
  userProfile?: IUserProfile;
}

export interface IExtensionSession {
  company_in_context: string;
  extension_requests: IExtensionRequest[];
}

export interface IExtensionRequest {
  company_number: string;
  extension_request_id: string;
  reason_in_context_string?: string;
}

export interface PageHistory {
  page_history: string[];
}
