import { createApiClient, Resource } from "@companieshouse/api-sdk-node";
import CompanyProfileService from "@companieshouse/api-sdk-node/dist/services/company-profile/service";

import {
  addExtensionReasonToRequest,
  callProcessorApi,
  createExtensionRequest,
  ExtensionFullRequest,
  ExtensionsCompanyProfile,
  getCompanyProfile,
  getFullRequest,
  removeAttachment,
  removeExtensionReasonFromRequest,
  setExtensionRequestStatus,
  updateReason
} from "../../client/apiclient";
import axios from "axios";
import { IExtensionRequest } from 'session/types';
import { ExtensionRequestStatus } from "../../model/extension.request.status";
import { CompanyProfile } from '@companieshouse/api-sdk-node/dist/services/company-profile';

jest.mock("@companieshouse/api-sdk-node");
jest.mock("axios");

const mockAxiosRequest = jest.fn();
axios.request = mockAxiosRequest;

const mockGetCompanyProfile = jest.fn();
const mockCreateApiClient = createApiClient as jest.Mock;
mockCreateApiClient.mockReturnValue({
  companyProfile: {
    ...CompanyProfileService.prototype,
    getCompanyProfile: mockGetCompanyProfile
  }
});

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
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("will return a valid json response", async () => {
    mockGetCompanyProfile.mockResolvedValueOnce(companyProfileResponse);

    const company = await getCompanyProfile(companyNumber, accessToken);
    expect(company.companyName).toEqual("THE GIRLS' DAY SCHOOL TRUST");
  });

  it("returns 404 if unknown path", async () => {
    mockGetCompanyProfile.mockResolvedValueOnce({
      httpStatusCode: 404
    } as Resource<CompanyProfile>);

    await expect(getCompanyProfile("00006401", accessToken))
      .rejects.toHaveProperty("status", 404);
  });

  it("should return the correct response for create requests", async () => {
    mockGetCompanyProfile.mockResolvedValueOnce(companyProfileResponse);
    mockAxiosRequest.mockResolvedValueOnce({ data: expectedExtensionRequestResult });

    const response: string = await createExtensionRequest(await getCompanyProfile(companyNumber, accessToken), companyNumber);
    expect(response).toEqual(expectedExtensionRequestResult);
  });

  it("should return the correct response for add reason to request", async () => {
    mockAxiosRequest.mockResolvedValueOnce({ data: expectedReasonResult });

    const response: string = await addExtensionReasonToRequest(companyNumber, accessToken, requestId, "extensionReason");
    expect(response).toEqual(expectedReasonResult);
  });

  it("should not throw when remove reason from request", async () => {
    mockAxiosRequest.mockResolvedValueOnce({ data: {} });

    await expect(removeExtensionReasonFromRequest(extensionRequest, accessToken))
      .resolves.not.toThrow();
  });

  it("should return correct response for a reason update", async () => {
    mockAxiosRequest.mockResolvedValueOnce({ data: expectedUpdateReasonResult });

    const response: string = await updateReason(extensionRequest, accessToken, extensionReasonUpdate);
    expect(response).toEqual(expectedUpdateReasonResult);
  });

  it("should be able to make a delete call to the attachments endpoint", async () => {
    mockAxiosRequest.mockResolvedValueOnce({ data: "" });

    const response: string = await removeAttachment(companyNumber, accessToken, requestId, reasonId, "attachment1");
    expect(response).toEqual("");
  });

  it("should be able to call processor api without failing", async () => {
    mockAxiosRequest.mockResolvedValueOnce({ data: {} });

    await expect(callProcessorApi(companyNumber, accessToken, requestId))
      .resolves.not.toThrow();
  });

  it("should be able to set status without failing", async () => {
    mockAxiosRequest.mockResolvedValueOnce({ data: {} });
    await expect(
      setExtensionRequestStatus(
        ExtensionRequestStatus.REJECTED_MAX_EXT_LENGTH_EXCEEDED,
        requestId,
        companyNumber,
        accessToken
      )
    ).resolves.not.toThrow();
  });

  it("should receive 404 error if attachments delete endpoint not found", async () => {
    mockAxiosRequest.mockRejectedValueOnce({ response: { status: 404 } });

    await expect(
      removeAttachment(companyNumber, accessToken, requestId, reasonId, "attachment2")
    ).rejects.toHaveProperty("status", 404);
  });

  it("should get a full request from the api", async () => {
    mockAxiosRequest.mockResolvedValueOnce({ data: fullExtensionRequest });

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
    mockAxiosRequest.mockRejectedValueOnce(new Error("oops"));

    await expect(
      createExtensionRequest({} as ExtensionsCompanyProfile, companyNumber)
    ).rejects.toHaveProperty("status", -1);
  });
});

const companyProfileResponse = {
  httpStatusCode: 200,
  resource: {
    companyNumber: "00006400",
    companyName: "THE GIRLS' DAY SCHOOL TRUST",
    companyStatus: "active",
    type: "private",
    accounts: {
      nextAccounts: {
        periodEndOn: "2020-12-31",
        periodStartOn: "2020-01-01"
      },
      nextDue: "2020-12-31",
      overdue: false
    },
    registeredOfficeAddress: {
      addressLineOne: "123 Fake Street",
      addressLineTwo: "Faketown",
      postalCode: "FA1 1AA"
    }
  }
} as Resource<CompanyProfile>;

const expectedExtensionRequestResult = {
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

const fullExtensionRequest = {
    "etag": null,
    "id": requestId,
    "links": {
        "self": `/company/00006400/extensions/requests/${requestId}`
    },
    "status": "OPEN",
    "reasons": [{
        "etag": null,
        "id": "reason1",
        "reason": "illness",
        "links": {
            "self": `/company/00006400/extensions/requests/${requestId}/reasons/reason1`
        },
        "attachments": [{
            "id": "attachment1",
            "name": "upload1.jpg"
        }],
        "start_on": "2018-12-12",
        "end_on": "2018-12-13",
        "affected_person": "director",
        "reason_information": "information",
        "continued_illness": "no"
    }],
    "created_on": "2019-05-09T10:10:31.861",
    "created_by": {
        "id": "Y2VkZWVlMzhlZWFjY2M4MzQ3MT",
        "forename": null,
        "surname": null,
        "email": "demo@ch.gov.uk"
    },
    "accounting_period_start_on": null,
    "accounting_period_end_on": null
};
