const addReasonMockRequest: jest.Mock = jest.fn( () => { return addReasonAxiosResponse });
jest.mock("axios", () => {
  return {
    default: {
      request: addReasonMockRequest
    }
  };
});

beforeEach( () => {
  addReasonMockRequest.mockClear();
});

// Need to import after mocks set or the real axios module will be imported before mocks
import {AxiosResponse} from "axios";
import {
  addExtensionReasonToRequest
} from "../../client/apiclient"

const addReasonAxiosResponse: AxiosResponse<any> = {
  data: {
    etag: null,
    _id: "5cc84e5e1e8ff21f5863c22d",
    reason: "illness",
    reason_information: "reason information text",
    startOn: "2018-06-14",
    endOn: "2019-01-14",
    links: {
      "linksMap": {
        "self": "/company/00006400/extensions/requests/5ccc31d61e8ff21f28c3b919/reasons/5cc84e5e1e8ff21f5863c22d"
      }
    }
  },
  status: 200,
  statusText: "OK",
  headers: "header",
  config: {}
};

describe("apiclient add reason unit tests", () => {
  it("should run add extension reason with correct url values", async () => {
    const result = await addExtensionReasonToRequest("SC100079", "", "abc123", "");
    const args = addReasonMockRequest.mock.calls[0][0];
    expect(args.url).toContain("SC100079");
    expect(args.url).toContain("abc123");
  });
});
