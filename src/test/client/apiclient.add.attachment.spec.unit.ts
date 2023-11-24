const addAttachmentMockRequest: jest.Mock = jest.fn( () => { return addAttachmentAxiosResponse });
jest.mock("axios", () => {
  return {
    default: {
      request: addAttachmentMockRequest
    }
  };
});

import {AxiosResponse} from "axios";
import {addAttachmentToReason} from "../../client/apiclient";
import * as fs from "fs";
import * as path from "path";

const addAttachmentAxiosResponse: AxiosResponse<any> = {
  data: {
    "links": {
      "download": "/company/00006400/extensions/requests/5cc84e5e1e8ff21f5863c22d/reasons/5cc84e5e1e8ff21f5863c22d/attachments/cce39605-733f-438f-ae88-3fbbe98527b3/download",
      "self": "/company/00006400/extensions/requests/5cc84e5e1e8ff21f5863c22d/reasons/5cc84e5e1e8ff21f5863c22d/attachments/cce39605-733f-438f-ae88-3fbbe98527b3"
    },
    "size": 9107,
    "name": "file",
    "contentType": "text/html",
    "id": "cce39605-733f-438f-ae88-3fbbe98527b3",
    "etag": ""
  },
  status: 202,
  statusText: "OK",
  headers: "header",
  config: {}
};

describe("apiclient add attachment unit tests", () => {
  it("should run add extension attachment with correct url values", async () => {
    const data = fs.readFileSync(path.join(__dirname + "/files/text.txt"));
    expect(data).not.toBeUndefined();

    const result = await addAttachmentToReason("SC100079", "", "abc123", "xyz789", data, "testFile");

    const args = addAttachmentMockRequest.mock.calls[0][0];

    expect(args.data._streams[0]).toContain("name=\"file\"");
    expect(args.data._streams[0]).toContain("name=\"testFile\"");
    expect(args.data._streams[1]).toEqual(data);
    expect(result).toBeTruthy();
    expect(args.url).toContain("SC100079");
    expect(args.url).toContain("abc123");
    expect(args.url).toContain("xyz789");
  });
});
