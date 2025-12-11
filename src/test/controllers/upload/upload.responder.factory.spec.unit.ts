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

    expect(uploadResponder).toBeInstanceOf(HtmlUploadResponder);
    expect(uploadResponder).not.toBeInstanceOf(AjaxUploadResponder);
  });

  it("should return AjaxUploadResponder", () => {
    const isXhrRequest: boolean = true;
    const uploadResponder: UploadResponder = createUploadResponder(isXhrRequest);

    expect(uploadResponder).toBeInstanceOf(AjaxUploadResponder);
    expect(uploadResponder).not.toBeInstanceOf(HtmlUploadResponder);
  })
});
