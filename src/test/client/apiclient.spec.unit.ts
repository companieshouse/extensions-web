const mockRequest: jest.Mock = jest.fn( () => { return dummyAxiosResponse });
jest.mock("axios", () => {
  return {
    default: {
      request: mockRequest
    }
  };
});

beforeEach( () => {
  mockRequest.mockClear();
});

// Need to import after mocks set or the real axios module will be imported before mocks
import {AxiosResponse} from "axios";
import {CompanyProfileResource, getCompanyProfile, CompanyProfile} from "../../client/apiclient"
import * as mockUtils from "../mock.utils";

const dummyAxiosResponse: AxiosResponse<CompanyProfileResource> =  {
  data: {
    accounts: {
      next_due: "2020-05-31",
      overdue: false,
      next_accounts: {
        period_end_on: "2019-10-10T00:00:00",
        period_start_on: "2019-01-01T00:00:00",
      },
    },
    company_number: "00006400",
    company_name: "Girl's school trust",
    company_status: "active",
    date_of_creation: "1872-06-26",
    has_been_liquidated: false,
    has_charges: false,
    has_insolvency_history: false,
    jurisdiction: "england",
    type: "limited",
    registered_office_address: {
      address_line_1: "line1",
      address_line_2: "line2",
      postal_code: "post code"
    }
  },
  status: 200,
  statusText: "OK",
  headers: "header",
  config: {}
};

describe("apiclient unit tests", () => {

  it("converts company number to uppercase", async () => {
    const company = await getCompanyProfile("sc100079", mockUtils.ACCESS_TOKEN);
    expect(company.incorporationDate).toEqual("26 June 1872");
    const args = mockRequest.mock.calls[0][0];
    expect(args.url).toContain("SC100079");
  });

  it("returns a CompanyProfile object", async () => {
    const company = await getCompanyProfile("00006400", mockUtils.ACCESS_TOKEN);

    expect(company).toEqual(expectedProfile);
  });

});

const expectedProfile: CompanyProfile = {
  accountingPeriodEndOn: "2019-10-10T00:00:00",
  accountingPeriodStartOn: "2019-01-01T00:00:00",
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
