const downloadMockRequest: jest.Mock = jest.fn();
jest.mock("axios", () => {
  return {
    default: {
      request: downloadMockRequest
    }
  };
});

import axios, {AxiosResponse} from "axios";
import {download} from "../../client/apiclient";
import * as httpMocks from "node-mocks-http";
import {Readable} from "stream";
import {EventEmitter} from "events";

const PREFIXED_CONTENT_DISPOSITION_VALUE: string = "attachment; filename=\"CH_EXT_test.txt\"";
const CONTENT_DISPOSITION_VALUE: string = "attachment; filename=\"test.txt\"";
const CONTENT_TYPE_VALUE: string = "application/text";
const CONTENT_LENGTH_VALUE: string = "55621";


const inputBuffer: Buffer = Buffer.from("hello", "utf8");
const readable = new Readable();
readable.push(inputBuffer);
readable.push(null);

const downloadAxiosResponse: AxiosResponse<any> = {
  data: readable,
  status: 200,
  statusText: "OK",
  headers: {
    "content-disposition" : CONTENT_DISPOSITION_VALUE,
    "content-type" : CONTENT_TYPE_VALUE,
    "content-length" : CONTENT_LENGTH_VALUE
  },
  config: {}
};


describe("apiclient download unit tests", () => {
  beforeEach(() => {
    downloadMockRequest.mockReset();
  });

  it("Should stream data from axios response out to the node.js response", async () => {
    downloadMockRequest.mockImplementation(() => downloadAxiosResponse);

    const res = httpMocks.createResponse({
      eventEmitter: EventEmitter
    });

    // capture reference to data being piped into response
    let dataIntoResponse: Buffer = {} as Buffer;
    res.on('pipe', function (input: Readable) {
      dataIntoResponse = input.read();
    });

    await download("uri", "token", res);

    expect(res.getHeader("content-disposition")).toBe(PREFIXED_CONTENT_DISPOSITION_VALUE);
    expect(res.getHeader("content-type")).toBe(CONTENT_TYPE_VALUE);
    expect(res.getHeader("content-length")).toBe(CONTENT_LENGTH_VALUE);

    // check data to be piped into response is same as the one returned in mock axios response
    expect(inputBuffer.equals(dataIntoResponse));
  });


  it("Should throw an axios error back to the controller", async () => {
    const errorMessage = "errorMessage";
    const errorsData = "error1";

    downloadMockRequest.mockImplementation(() => {
      throw {
         message: errorMessage,
         response: {
           data: {
             errors: errorsData
           },
           status: 415
         }
       };
    });

    const res = httpMocks.createResponse();

    expect.assertions(3);

    await download("uri", "token", res)
      .catch((e) => {
        expect(e.status).toBe(415);
        expect(e.data).toBe(errorsData);
        expect(e.message).toBe(errorMessage);
      });
  });
});
