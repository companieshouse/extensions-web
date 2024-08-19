import {ACCOUNTS_NEXT_DUE_DATE, getDummyCompanyProfile} from "../mock.utils";

const createExtensionMockRequest: jest.Mock = jest.fn( () => { return createExtensionAxiosResponse });
jest.mock("axios", () => {
  return {
    default: {
      request: createExtensionMockRequest
    }
  };
});

beforeEach( () => {
  createExtensionMockRequest.mockClear();
});

// Need to import after mocks set or the real axios module will be imported before mocks
import {AxiosRequestHeaders, AxiosResponse} from "axios";
import {
  createExtensionRequest
} from "../../client/apiclient"

const createExtensionAxiosResponse: AxiosResponse<any> = {
  data: {},
  status: 200,
  statusText: "OK",
  headers: {},
  config: { headers: {} as AxiosRequestHeaders }
};

describe("apiclient create request unit tests", () => {
  it("should call create extension request with correct data", async () => {
    await createExtensionRequest(getDummyCompanyProfile(false, true), "xyz789");
    const args = createExtensionMockRequest.mock.calls[0][0];
    expect(JSON.stringify(args.data)).toContain("\"accounting_period_end_on\":\"" + ACCOUNTS_NEXT_DUE_DATE + "\"");
    expect(JSON.stringify(args.data)).toContain("\"accounting_period_start_on\":\"" + ACCOUNTS_NEXT_DUE_DATE + "\"");
  });
});
