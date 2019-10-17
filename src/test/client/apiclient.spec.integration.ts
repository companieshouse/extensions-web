import * as mockserver from 'mockserver';
import * as http from 'http';
import {
  createExtensionRequest,
  addExtensionReasonToRequest,
  updateReason,
  removeAttachment,
  removeExtensionReasonFromRequest,
  getCompanyProfile,
  CompanyProfile,
  ExtensionFullRequest,
  getFullRequest, callProcessorApi
} from "../../client/apiclient";
import axios from "axios"
import { IExtensionRequest } from 'session/types';
const port = 9333;
const companyNumber = "00006400";
const accessToken: string = "dummy-token";
const requestId: string = "5cc84e5e1e8ff21f5863c22d";
const reasonId: string = "5cc84e5e1e8ff21f5863c22d";

const extensionRequest: IExtensionRequest = {
  company_number: companyNumber,
  reason_in_context_string: reasonId,
  extension_request_id: requestId
}

describe("apiclient integration tests", () => {
  let app;

  beforeAll(done => {
    delete process.env['http_proxy'];
    delete process.env['HTTP_PROXY'];
    delete process.env['https_proxy'];
    delete process.env['HTTPS_PROXY'];
    app = http.createServer(mockserver('src/test/mockserver'))
              .listen(port, done);
  });

  afterAll(done => {
    app.close(done);
  });

  it("will return a valid json response", async () => {
    const company = await getCompanyProfile(companyNumber, accessToken);
    expect(company.companyName).toEqual("THE GIRLS' DAY SCHOOL TRUST");
  });

  it("returns 404 if unknown path", async () => {
    try {
      await getCompanyProfile("00006401", accessToken);
    } catch (e) {
      expect(e.status).toEqual(404);
    }
  });

  it("should return the correct response for create requests", async () => {
    const response: string = await createExtensionRequest(await getCompanyProfile(companyNumber, accessToken), companyNumber);
    expect(response).toEqual(expectedRequestResult);
  });

  it("should return the correct response for add reason to request", async () => {
    const response: string = await addExtensionReasonToRequest(companyNumber, accessToken, requestId, "extensionReason");
    expect(response).toEqual(expectedReasonResult);
  });

  it("should does not fail when remove reason from request", async () => {
    try {
      await removeExtensionReasonFromRequest(extensionRequest, accessToken);
    } catch (e) {
      expect(e.status).toEqual(-1);
    }
    expect.assertions(0);
  });

  it("should return correct response for a reason update", async () => {
    const response: string = await updateReason(extensionRequest, accessToken, extensionReasonUpdate);
    expect(response).toEqual(expectedUpdateReasonResult);
  });

  it("should be able to make a delete call to the attachments endpoint", async () => {
    const response: string = await removeAttachment(companyNumber, accessToken, requestId, reasonId, "attachment1");
    expect(response).toEqual("");
  });

  it("should be able to call processor api without failing", async () => {
    try {
      const response = await callProcessorApi(companyNumber, accessToken, requestId);
    } catch(e) {
      fail(JSON.stringify(e));
    }
  });

  it("should receive 404 error if attachments delete endpoint not found", async () => {
    try {
      await removeAttachment(companyNumber, accessToken, requestId, reasonId, "attachment2");
    } catch(e) {
      expect(e.status).toEqual(404);
    }
    expect.assertions(1);
  });

  it("should get a full request from the api", async () => {
    const extensionRequest: ExtensionFullRequest =
      await getFullRequest(companyNumber, accessToken, requestId);

    expect(extensionRequest.id).toEqual("5cc84e5e1e8ff21f5863c22d");
    expect(extensionRequest.reasons[0].reason).toEqual("illness");
    expect(extensionRequest.reasons[0].id).toEqual("reason1");
    expect(extensionRequest.reasons[0].start_on).toEqual("2018-12-12");
    expect(extensionRequest.reasons[0].end_on).toEqual("2018-12-13");
    expect(extensionRequest.reasons[0].affected_person).toEqual("director");
    expect(extensionRequest.reasons[0].continued_illness).toEqual("no");
    expect(extensionRequest.reasons[0].reason_information).toEqual("information");

    expect(extensionRequest.reasons[0].attachments[0].name).toEqual("upload1.jpg");
    expect(extensionRequest.reasons[0].attachments[0].id).toEqual("attachment1");
  });

  it("should return error if service unavailable", async () => {
    const spy = jest.spyOn(axios, "request");
    spy.mockRejectedValue(new Error("oops"));

    expect.assertions(1);
    try {
      await createExtensionRequest({} as CompanyProfile, companyNumber);
    } catch(e) {
      expect(e.status).toEqual(-1);
    }

    spy.mockRestore();
  });
});

const expectedRequestResult = {
  "accounting_period_end_on": "2019-04-18",
  "accounting_period_start_on": "2019-04-18",
  "created_by":
    {
      "email": null,
      "forename": null,
      "id": "MGQ1MGNlYmFkYzkxZTM2",
      "surname": null
    },
  "created_on": "2019-04-30T14:32:14.638",
  "etag": null,
  "id": requestId,
  "links":
    {
      "self": "/company/00006400/extensions/requests/5cc84e5e1e8ff21f5863c22d"
    },
  "reasons": [],
  "status": "OPEN"
};

const extensionReasonUpdate = {
  "reason_information": "blah",
}

const expectedReasonResult = {
  "etag": "",
  "id": "5cc84e5e1e8ff21f5863c22d",
  "reason": "illness",
  "reason_information": "blah",
  "start_on": "2018-12-12",
  "end_on": "2018-12-13"
};

const expectedUpdateReasonResult = {
  "etag": "",
  "id": "5cc84e5e1e8ff21f5863c22d",
  "reason_information": "blah",
};
