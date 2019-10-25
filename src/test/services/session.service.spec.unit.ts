import { IExtensionSession, IExtensionRequest } from "../../session/types";
import Session from "../../session/session";
import * as sessionService from "../../services/session.service";
import {UPLOAD_DOCUMENTS_YES} from "../../session/keys";

jest.mock("../../session/store/redis.store");

describe("cache service tests", () => {
  it("should return true if request exists", async () => {
    let session: Session = Session.newInstance();
    session.data = {extension_session: dummySession("00006400", "00006400")};

    const hasRequest: boolean = await sessionService.hasExtensionRequest(session);
    expect(hasRequest).toBeTruthy();
  });

  it("should update extensions session value", async () => {
    let session: Session = Session.newInstance();
    session.data = {extension_session: dummySession("00006400", "00006400")};
    await sessionService.updateExtensionSessionValue(session, UPLOAD_DOCUMENTS_YES, true);
    expect(session.data.extension_session[UPLOAD_DOCUMENTS_YES]).toEqual(true);
    await sessionService.updateExtensionSessionValue(session, UPLOAD_DOCUMENTS_YES, false);
    expect(session.data.extension_session[UPLOAD_DOCUMENTS_YES]).toEqual(false);
  });

  it("should return false if request does not exist", async () => {
    let session: Session = Session.newInstance();
    session.data = {extension_session: dummySession("00006401", "00006400")};

    const hasRequest: boolean = await sessionService.hasExtensionRequest(session);
    expect(hasRequest).toBeFalsy();
  });

  it("should throw an error if you attempt to add request when one already present for a company", async () => {
    let session: Session = Session.newInstance();
    session.data = {extension_session: dummySession("00006400", "00006400")};
    try {
      await sessionService.addRequest(session, "54321");
    } catch(e) {
      expect(e.message).toBe(`Request already exists for company 00006400`);
    }
    expect.assertions(1);
  });

  it("should add new extension request if one does not exist", async () => {
    let session: Session = Session.newInstance();
    session.data = {extension_session: dummySession("00006401", "00006400")};
    const expectedRequest = {
      company_number: "00006401",
      extension_request_id: "54321",
      reason_in_context_string: ""
    }
    await sessionService.addRequest(session, "54321");
    expect(session.data.extension_session.extension_requests.length).toBe(2);
    expect(session.data.extension_session.extension_requests.pop()).toEqual(expectedRequest);
  });

  // it("should add new page history if one does not exist", async () => {
  //   let session: Session = Session.newInstance();
  //
  // });

  it("should add a new company number to context", async () => {
    let session: Session = Session.newInstance();
    session.data = {extension_session: dummySession("00006401", "00006400")};

    await sessionService.changeCompanyInContext(session, "00006400");
    expect(session.data.extension_session.company_in_context).toEqual("00006400");
    expect(session.data.extension_session.extension_requests).toBeTruthy();
  });

  it("should create a new empty extension session", async () => {
    let session: Session = Session.newInstance();

    await sessionService.createExtensionSession(session, "00006400");
    expect(session.data.extension_session.company_in_context).toEqual("00006400");
    expect(session.data.extension_session.extension_requests.length).toEqual(0);
  });

  it("should get current extension request", async () => {
    let session: Session = Session.newInstance();
    session.data = {
      extension_session: {
        company_in_context: "00006400",
        extension_requests: [
        {
          company_number: "00006400",
          extension_request_id: "12345",
        },
        {
          company_number: "00006401",
          extension_request_id: "54321",
        }],
      }
    };

    const request: IExtensionRequest = await sessionService.getRequest(session);
    expect(request.extension_request_id).toEqual("12345");
  });
});

const dummySession = (companyInContext: string, companyInRequest: string): IExtensionSession => {
  return {
    company_in_context: companyInContext,
    extension_requests: [{
      company_number: companyInRequest,
      extension_request_id: "12345",
    }],
  }
}
