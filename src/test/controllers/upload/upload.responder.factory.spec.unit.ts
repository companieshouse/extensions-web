jest.mock("redis", () => {
  return {
    createClient: jest.fn().mockReturnThis(),
    on: jest.fn().mockReturnThis(),
  }
});

import {createUploadResponder, UploadResponder} from "../../../controllers/upload/upload.responder.factory";
import {HtmlUploadResponder} from "../../../controllers/upload/html.upload.responder";
import {AjaxUploadResponder} from "../../../controllers/upload/ajax.upload.responder";

describe("upload responder factory tests", () => {
  it("should return HtmlUploadResponder", () => {
    const isXhrRequest: boolean = false;
    const uploadResponder: UploadResponder = createUploadResponder(isXhrRequest);
    expect(uploadResponder instanceof HtmlUploadResponder).toBeTruthy();
    expect(uploadResponder instanceof AjaxUploadResponder).toBeFalsy();
  });

  it("should return AjaxUploadResponder", () => {
    const isXhrRequest: boolean = true;
    const uploadResponder: UploadResponder = createUploadResponder(isXhrRequest);
    expect(uploadResponder instanceof AjaxUploadResponder).toBeTruthy();
    expect(uploadResponder instanceof HtmlUploadResponder).toBeFalsy();
  })
});
