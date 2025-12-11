import {
  getCompanyProfile,
  ExtensionsCompanyProfile,
} from "../../client/apiclient";
import * as mockUtils from "../mock.utils";
import Resource from "@companieshouse/api-sdk-node/dist/services/resource";
import { CompanyProfile } from "@companieshouse/api-sdk-node/dist/services/company-profile";
import CompanyProfileService from "@companieshouse/api-sdk-node/dist/services/company-profile/service";

//////////////////
//Set up mocks

jest.mock("@companieshouse/api-sdk-node/dist/services/company-profile/service");

// end of set up mocks
///////////////////////

describe("apiclient company profile unit tests", () => {
  const mockGetCompanyProfile = CompanyProfileService.prototype
    .getCompanyProfile as jest.Mock;
  beforeEach(() => {
    mockGetCompanyProfile.mockReset();
  });

  it("converts company number to uppercase", async () => {
    mockGetCompanyProfile.mockResolvedValueOnce(dummySDKResponse);
    const company = await getCompanyProfile("sc100079", mockUtils.ACCESS_TOKEN);
    expect(company.incorporationDate).toEqual("26 June 1872");
    expect(mockGetCompanyProfile).toHaveBeenCalledWith("SC100079");
  });

  it("returns an ExtensionsCompanyProfile object", async () => {
    mockGetCompanyProfile.mockResolvedValueOnce(dummySDKResponse);
    const company = await getCompanyProfile("00006400", mockUtils.ACCESS_TOKEN);
    expect(company).toEqual(expectedProfile);
  });
});

const dummySDKResponse: Resource<CompanyProfile> = {
  httpStatusCode: 200,
  resource: {
    accounts: {
      nextAccounts: {
        periodEndOn: "2019-10-10",
        periodStartOn: "2019-01-01",
      },
      nextDue: "2020-05-31",
      overdue: false,
    },
    companyNumber: "00006400",
    companyName: "Girl's school trust",
    companyStatus: "active",
    companyStatusDetail: "company status detail",
    dateOfCreation: "1872-06-26",
    jurisdiction: "England",
    sicCodes: ["123"],
    hasBeenLiquidated: false,
    type: "limited",
    hasCharges: false,
    hasInsolvencyHistory: false,
    links: {},
    registeredOfficeAddress: {
      addressLineOne: "line1",
      addressLineTwo: "line2",
      careOf: "careOf",
      country: "uk",
      locality: "locality",
      poBox: "123",
      postalCode: "post code",
      premises: "premises",
      region: "region",
    },
  },
};

const expectedProfile: ExtensionsCompanyProfile = {
  accountingPeriodEndOn: "2019-10-10",
  accountingPeriodStartOn: "2019-01-01",
  hasBeenLiquidated: false,
  hasCharges: false,
  hasInsolvencyHistory: false,
  companyName: "Girl's school trust",
  companyNumber: "00006400",
  companyStatus: "Active",
  companyType: "limited",
  incorporationDate: "26 June 1872",
  address: {
    line_1: "line1",
    line_2: "line2",
    postCode: "post code",
  },
  accountsDue: "31 May 2020",
  isAccountsOverdue: false,
};
