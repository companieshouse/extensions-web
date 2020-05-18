import {ExtensionsCompanyProfile} from "../client/apiclient";

export function buildCompanySummaryListRows(company: ExtensionsCompanyProfile, isCompanyNameRequired: boolean,
                                            isDueDatePassed?: boolean) {
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
  return rowsArray;
}
