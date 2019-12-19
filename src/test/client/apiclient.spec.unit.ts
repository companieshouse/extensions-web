import {getCompanyProfile, ExtensionsCompanyProfile} from "../../client/apiclient";
import * as mockUtils from "../mock.utils";
import {createApiClient} from "ch-sdk-node";
import Resource from "ch-sdk-node/dist/services/resource";
import {CompanyProfile} from "ch-sdk-node/dist/services/company-profile";
import ApiClient from "ch-sdk-node/dist/client";
import CompanyProfileService from "ch-sdk-node/dist/services/company-profile/service";

//////////////////
//Set up mocks
jest.mock("ch-sdk-node");

const api: ApiClient = jest.genMockFromModule("ch-sdk-node");

// ApiClient has a readonly "companyProfile" so this is a workaround to set companyProfile to be a Mock
const mockCompanyProfileService = (<unknown>CompanyProfileService as jest.Mock<typeof CompanyProfileService>);
Object.defineProperty(api, "companyProfile", {value: mockCompanyProfileService});

const mockGetCompanyProfile: jest.Mock = jest.fn(async (number: string): Promise<Resource<CompanyProfile>> => {
  return dummySDKResponse;
});

api.companyProfile.getCompanyProfile = mockGetCompanyProfile;

const mockCreateApiClient = (<unknown>createApiClient as jest.Mock<typeof createApiClient>);

mockCreateApiClient.prototype.constructor.mockImplementation(() => {
  return api;
});
// end of set up mocks
///////////////////////

describe("apiclient company profile unit tests", () => {

  it("converts company number to uppercase", async () => {
    const company = await getCompanyProfile("sc100079", mockUtils.ACCESS_TOKEN);
    expect(company.incorporationDate).toEqual("26 June 1872");
    const args = mockGetCompanyProfile.mock.calls[0][0];
    expect(args).toContain("SC100079");
  });

  it("returns an ExtensionsCompanyProfile object", async () => {
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
    sicCodes: ["123"],
    hasBeenLiquidated: false,
    type: "limited",
    hasCharges: false,
    hasInsolvencyHistory: false,
    registeredOfficeAddress: {
      addressLineOne: "line1",
      addressLineTwo: "line2",
      careOf: "careOf",
      country: "uk",
      locality: "locality",
      poBox: "123",
      postalCode: "post code",
      premises: "premises",
      region: "region"
    }
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
    postCode: "post code"
  },
  accountsDue: "31 May 2020",
  isAccountsOverdue: false
};
