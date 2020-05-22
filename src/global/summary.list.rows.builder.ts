import {ExtensionsCompanyProfile} from "../client/apiclient";
import {Request} from "express";
import {ISignInInfo, IUserProfile} from "../session/types";
import * as keys from "../session/keys";

export function buildCompanySummaryListRows(company: ExtensionsCompanyProfile, isCompanyNameRequired: boolean,
                                            isEmailRequired: boolean, req: Request, isDueDatePassed?: boolean) {
  const companyAddress = company.address.line_1 + "</br>"
    + company.address.line_2 + "</br>"
    + company.address.postCode;
  let rowsArray: Array<{ key: { html: string }, value: { html: string } }> = [];

  if (isCompanyNameRequired) {
    rowsArray = rowsArray.concat({key: {html: "Company Name"}, value: {html: company.companyName}});
  }

  rowsArray = rowsArray.concat(
    {key: {html: "Company Number"}, value: {html: company.companyNumber}},
    {key: {html: "Status"}, value: {html: company.companyStatus}},
    {key: {html: "Incorporation date"}, value: {html: company.incorporationDate}},
    {key: {html: "Company type"}, value: {html: company.companyType}},
    {key: {html: "Registered office address"}, value: {html: companyAddress}},
  );

  if (company.accountsDue) {
    let accountsOverdueHTML = company.accountsDue;
    if (company.isAccountsOverdue || isDueDatePassed) {
      accountsOverdueHTML = accountsOverdueHTML + "<br/><span class=\"govuk-!-font-weight-bold\">Your accounts are overdue</span>";
    }
    rowsArray = rowsArray.concat({key: {html: "Accounts due"}, value: {html: accountsOverdueHTML}});
  }
  if (isEmailRequired) {
    const email = getUserEmail(req);
    rowsArray = rowsArray.concat({key: {html: "Contact email address"}, value: {html: email}});
  }
  return rowsArray;
}

const getUserEmail = (req: Request): string => {
  const signInInfo: ISignInInfo = req.chSession.data[keys.SIGN_IN_INFO] as ISignInInfo;
  const userProfile: IUserProfile = signInInfo[keys.USER_PROFILE] as IUserProfile;
  const email = userProfile.email;
  if (email) {
    return email;
  } else {
    throw new Error("Email is missing for user " + userProfile.id);
  }
};
