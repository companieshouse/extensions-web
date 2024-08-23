const removeReasonMockRequest: jest.Mock = jest.fn( () => { return removeReasonAxiosResponse });
jest.mock("axios", () => {
  return {
    default: {
      request: removeReasonMockRequest
    }
  };
});

beforeEach( () => {
  removeReasonMockRequest.mockClear();
});

// Need to import after mocks set or the real axios module will be imported before mocks
import {AxiosRequestHeaders, AxiosResponse} from "axios";
import {
   removeExtensionReasonFromRequest
} from "../../client/apiclient"
import { IExtensionRequest } from "session/types";

const removeReasonAxiosResponse: AxiosResponse<any> = {
  data: {},
  status: 200,
  statusText: "OK",
  headers: {},
  config: { headers: {} as AxiosRequestHeaders }
};

describe("apiclient remove reason unit tests", () => {
  it("should run remove extension request with correct url values", async () => {
    const request: IExtensionRequest = {
      extension_request_id: "abc123",
      reason_in_context_string: "xyz789",
      company_number: "SC100079"
    }
    const result = await removeExtensionReasonFromRequest(request, "token");
    const args = removeReasonMockRequest.mock.calls[0][0];
    expect(args.url).toContain("SC100079");
    expect(args.url).toContain("abc123");
    expect(args.url).toContain("xyz789");
  });
});
