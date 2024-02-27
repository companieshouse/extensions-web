import {
  updateReason,
  removeExtensionReasonFromRequest,
  getFullRequest,
  ExtensionFullRequest
} from "../../client/apiclient";
import * as mockUtils from "../mock.utils";
import * as reasonService from "../../services/reason.service";
import Session from "../../session/session";
import * as keys from "../../session/keys";
import {ReasonWeb} from "../../model/reason/extension.reason.web";
import {getDummyFullRequest} from "../mock.utils";

jest.mock("../../client/apiclient");

const mockUpdateReason = (<unknown>updateReason as jest.Mock<typeof updateReason>);
const mockDeleteReason = (<unknown>removeExtensionReasonFromRequest as jest.Mock<typeof removeExtensionReasonFromRequest>);
const mockGetFullRequest = (<unknown>getFullRequest as jest.Mock<typeof getFullRequest>);
mockGetFullRequest.prototype.constructor.mockImplementation(async (companyNumber: string, token: string,
                                                               requestId: string): Promise<ExtensionFullRequest> => {
  return getDummyFullRequest;
});

beforeEach(() => {
  mockUpdateReason.mockClear();
  mockDeleteReason.mockClear();
})

describe("reason service tests", () => {

  it("should call the apiClient to update a reason", async () => {
    await reasonService.updateReason(mockUtils.fullDummySession(), {illPerson: "joe"});

    expect(mockUpdateReason).toBeCalledWith(
      mockUtils.fullDummySession().extensionSession().extension_requests[0],
      "KGGGUYUYJHHVK1234", {illPerson: "joe"});
  });

  it("should reject promise if no token", async () => {
    const session = dummySession();
    try {
      await reasonService.updateReason(session, {illPerson: "joe"});
    } catch (e) {
      expect(e).toEqual("invalid session data when processing reason");
    }

    expect(mockUpdateReason).not.toBeCalled();
    expect.assertions(2);
  });

  it("should reject promise if no request", async () => {
    const session = mockUtils.fullDummySession()
    session.data.extension_session.extension_requests = [];
    try {
      await reasonService.updateReason(session, {illPerson: "joe"});
    } catch (e) {
      expect(e).toEqual("invalid session data when processing reason");
    }

    expect(mockUpdateReason).not.toBeCalled();
    expect.assertions(2);
  });

  it("should delete a reason", async () => {
    const session = mockUtils.fullDummySession();
    await reasonService.deleteCurrentReason(session);

    expect(mockUpdateReason).not.toBeCalled();
    expect(mockDeleteReason).toBeCalledWith(session.extensionSession().extension_requests[0], "KGGGUYUYJHHVK1234");
  });

});

it ("should return a full reason for the current reason", async () => {
  const session = mockUtils.fullDummySession();
  const reason: ReasonWeb = await reasonService.getCurrentReasonFull(session);

  expect(reason.id).toEqual(session.data.extension_session.extension_requests[0]["reason_in_context_string"]);
  expect(reason.reason).toEqual("illness");
  expect(reason.attachments.length).toEqual(3);
  expect(reason.attachments[0].id).toEqual("2222-164f-4bff-a1f9-855b055dcfb0");
  expect(reason.attachments[1].id).toEqual("33335-0907-48aa-90dc-ee480a956efb");
  expect(reason.attachments[2].id).toEqual("444441-50b1-4930-a567-3ec83a668026");
  expect(reason.start_on).toEqual("2019-12-12");
  expect(reason.end_on).toEqual( "2019-12-20");
  expect(reason.affected_person).toEqual("dave");
});

const dummySession = () => {
  let session = Session.newInstance();
  session.data = {
    [keys.SIGN_IN_INFO]: {
      [keys.SIGNED_IN]: 1,
      [keys.USER_PROFILE]: {
        email: "EMAIL"
      }
    },
    [keys.EXTENSION_SESSION]: {
      [keys.COMPANY_IN_CONTEXT]: "00006400",
      [keys.EXTENSION_REQUESTS]: [{
        [keys.COMPANY_NUMBER]: "00006400",
        "extension_request_id": "request1",
        "reason_in_context_string": "reason1"
      }]
    }
  };
  return session;
};
