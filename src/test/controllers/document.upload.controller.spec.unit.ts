import app from "../../app";
import * as request from "supertest";
import * as fs from "fs";
import * as path from "path";
import * as pageURLs from "../../model/page.urls";
import {COOKIE_NAME} from "../../session/config";
import {loadSession} from "../../services/redis.service";
import {addAttachmentToReason, getFullRequest} from "../../client/apiclient"
import {loadMockSession, fullDummySession, sessionWithChangingDetails} from "../mock.utils";
import {getRequest, getCompanyInContext, createHistoryIfNone} from "../../services/session.service";
import * as keys from "../../session/keys";

jest.mock("../../services/redis.service");
jest.mock("../../client/apiclient");
jest.mock("../../services/session.service");

const mockCacheService = (<unknown>loadSession as jest.Mock<typeof loadSession>);
const mockAddAttachment = (<unknown>addAttachmentToReason as jest.Mock<typeof addAttachmentToReason>);
const mockRequest = (<unknown>getRequest as jest.Mock<typeof getRequest>);
const mockCompanyContext = (<unknown>getCompanyInContext as jest.Mock<typeof getCompanyInContext>);
const mockFullRequest = (<unknown>getFullRequest as jest.Mock<typeof getFullRequest>);
const mockCreateHistoryIfNone = (<unknown>createHistoryIfNone  as jest.Mock<typeof createHistoryIfNone>);

const GENERIC_ERROR = "Sorry, there is a problem with the service";
const TITLE = "Sorry, there is a problem with the service - GOV.UK";
const INVALID_MIME_TYPE = "The selected file must be a JPG, JPEG, ZIP, GIF, PNG, PDF, DOCX or XLSX";
const EXPECTED_MAX_FILE_SIZE_MESSAGE = "File size must be smaller than 0 MB";
const QUERY_ID: string = "?reasonId=reason1";

beforeEach( () => {
  loadMockSession(mockCacheService);
  mockAddAttachment.mockClear();
  mockAddAttachment.mockRestore();
  mockRequest.mockClear();
  mockCompanyContext.mockClear();

  mockRequest.prototype.constructor.mockImplementation(() => {
    return {
      [keys.COMPANY_NUMBER]: "00006400",
      "extension_request_id": "request1",
      "reason_in_context_string": "1234",
    }
  });
  mockCompanyContext.prototype.constructor.mockImplementationOnce(() => "00006400");

  mockFullRequest.prototype.constructor.mockImplementation(() => {
    return {
      reasons: [{
        "id":"1234",
        "reason":"illness",
        "attachments": [
          {
            "id" : "2ef57740-200d-4cb0-b814-c3149efcf87b",
            "name" : "squirrel.gif",
            "contentType" : "image/gif",
            "size" : 2089571
          },],
        "start_on":"1999-05-06",
        "end_on":"1999-07-08",
        "affected_person":"bob",
        "reason_information":"stuff",
        "continued_illness":"maybe"
      }]
    }
  });
  mockCreateHistoryIfNone.prototype.constructor.mockImplementation(() => {
    return {
      page_history:[],
    };
  });
});

describe ("document upload url tests", () => {
  it ("should find document upload page with get", async () => {
    const res = await request(app)
      .get(pageURLs.EXTENSIONS_DOCUMENT_UPLOAD)
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`]);
    expect(res.status).toEqual(200);
  });

  it ("should redirect to add extension reason page when continue with no docs is clicked ", async () => {
    const res = await request(app)
      .get(pageURLs.EXTENSIONS_DOCUMENT_UPLOAD_CONTINUE_NO_DOCS)
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`]);
    expect(res.status).toEqual(302);
    expect(res.header.location).toEqual(pageURLs.EXTENSIONS_ADD_EXTENSION_REASON);
  });

  it ("should redirect to check your answers page when continue with no docs is clicked ", async () => {
    mockCacheService.prototype.constructor.mockImplementationOnce(sessionWithChangingDetails);
    const res = await request(app)
      .get(pageURLs.EXTENSIONS_DOCUMENT_UPLOAD_CONTINUE_NO_DOCS)
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`]);
    expect(res.status).toEqual(302);
    expect(res.header.location).toEqual(pageURLs.EXTENSIONS_CHECK_YOUR_ANSWERS);
  });

  it ("should find document upload page with get when query is present", async () => {
    const res = await request(app)
      .get(pageURLs.EXTENSIONS_DOCUMENT_UPLOAD + QUERY_ID)
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`]);
    expect(res.status).toEqual(200);
  });

  it ("should return 404 if document upload page with put", async () => {
    const res = await request(app)
      .put(pageURLs.EXTENSIONS_DOCUMENT_UPLOAD)
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`]);
    expect(res.status).toEqual(404);
  });

  it ("should render error message when file is too big", async () => {
    // See global.setup.ts for unit test file size limit
    const response = await request(app)
      .post(pageURLs.EXTENSIONS_DOCUMENT_UPLOAD)
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`])
      .attach('file-upload', path.join(__dirname + "/../client/files/text_large.txt"));
    expect(response.text).toContain(EXPECTED_MAX_FILE_SIZE_MESSAGE);
   });

  it ("should render error message on 415 error", async () => {
    mockAddAttachment.prototype.constructor.mockImplementationOnce(() => {
      throw {
        data: ["error"],
        message: "error",
        status: 415
      }
    });

    const response = await request(app)
      .post(pageURLs.EXTENSIONS_DOCUMENT_UPLOAD)
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`])
      .attach('file-upload', path.join(__dirname + "/../client/files/text.txt"));
      expect(response.status).toEqual(200);
      expect(response).not.toBeUndefined();
  
      expect(response.text).toContain(INVALID_MIME_TYPE);
      expect(mockRequest).toHaveBeenCalled();
      expect(mockCompanyContext).toHaveBeenCalled();
      expect(mockAddAttachment).toHaveBeenCalled();
  });

  it ("should error screen if apiclient throws error", async () => {
    mockAddAttachment.prototype.constructor.mockImplementationOnce(() => {throw new Error()});
    const res = await request(app)
      .post(pageURLs.EXTENSIONS_DOCUMENT_UPLOAD)
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`])
      .attach('file-upload', path.join(__dirname + "/../client/files/text.txt"));
    expect(res.status).toEqual(500);
    expect(res.text).toContain(GENERIC_ERROR);
    expect(res.text).toContain(TITLE);
    expect(mockRequest).toHaveBeenCalled();
    expect(mockCompanyContext).toHaveBeenCalled();
    expect(mockAddAttachment).toHaveBeenCalled();
  });

  it ("should redirect when file uploaded", async () => {
    mockCacheService.prototype.constructor.mockImplementationOnce(fullDummySession);
    const expectedBuffer = fs.readFileSync(path.join(__dirname + "/../client/files/text.txt"));
    const res = await request(app)
      .post(pageURLs.EXTENSIONS_DOCUMENT_UPLOAD)
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`])
      .attach('file-upload', path.join(__dirname + "/../client/files/text.txt"));
    expect(res.status).toEqual(302);
    expect(res.header.location).toEqual(pageURLs.EXTENSIONS_DOCUMENT_UPLOAD);
    expect(mockAddAttachment).toBeCalledWith("00006400",
      "KGGGUYUYJHHVK1234",
      "request1",
      "1234",
      expectedBuffer,
      "text.txt");
  });

  it ("should show error message if continue pressed with no docs added", async () => {
    mockCacheService.prototype.constructor.mockImplementationOnce(fullDummySession);

    mockFullRequest.prototype.constructor.mockImplementationOnce(() => {
      return {
        reasons: [{
          "id":"1234",
          "reason":"illness",
          "attachments": [],
          "start_on":"1999-05-06",
          "end_on":"1999-07-08",
          "affected_person":"bob",
          "reason_information":"stuff",
          "continued_illness":"maybe"
        }]
      }
    });

    const res = await request(app)
      .post(pageURLs.EXTENSIONS_DOCUMENT_UPLOAD)
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`])
      .send({"continueCheck": "continueCheck"});
    expect(res.status).toEqual(200);
    expect(res.text).toContain("govuk-error-summary");
    expect(res.text).toContain("You must add a document or click &quot;Continue without " +
      "adding documents&quot;");
  });

  it ("AJAX - should render error message when file is too big", async () => {
    // See global.setup.ts for unit test file size limit
    const response = await request(app)
      .post(pageURLs.EXTENSIONS_DOCUMENT_UPLOAD)
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`])
      .set('X-Requested-With','XMLHttpRequest')
      .attach('file-upload', path.join(__dirname + "/../client/files/text_large.txt"));

    const responseObj = JSON.parse(response.text);
    expect(responseObj.divs.length).toEqual(2);
    expect(responseObj.divs[0].divId).toContain("errorSummaryDiv");
    expect(responseObj.divs[1].divId).toContain("fileUploadDiv");

    expect(responseObj.divs[0].divHtml).toContain("govuk-error-summary");
    expect(responseObj.divs[0].divHtml).toContain(EXPECTED_MAX_FILE_SIZE_MESSAGE);

    expect(responseObj.divs[1].divHtml).toContain("govuk-file-upload");
    expect(responseObj.divs[1].divHtml).toContain(EXPECTED_MAX_FILE_SIZE_MESSAGE);
    expect(responseObj.divs[1].divHtml).toContain("govuk-error-message");
  });

  it ("AJAX - should render error message on 415 error", async () => {
    mockAddAttachment.prototype.constructor.mockImplementationOnce(() => {
      throw {
        data: ["error"],
        message: "error",
        status: 415
      }
    });

    const errorMessage: string = "The selected file must be a JPG, JPEG, ZIP, GIF, PNG, PDF, DOCX or XLSX";

    const response = await request(app)
      .post(pageURLs.EXTENSIONS_DOCUMENT_UPLOAD)
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`])
      .set('X-Requested-With','XMLHttpRequest')
      .attach('file-upload', path.join(__dirname + "/../client/files/text.txt"));
    expect(response.status).toEqual(200);
    expect(response).not.toBeUndefined();

    const responseObj = JSON.parse(response.text);
    expect(responseObj.divs.length).toEqual(2);

    expect(responseObj.divs[0].divId).toContain("errorSummaryDiv");
    expect(responseObj.divs[1].divId).toContain("fileUploadDiv");

    expect(responseObj.divs[0].divHtml).toContain("govuk-error-summary");
    expect(responseObj.divs[0].divHtml).toContain(errorMessage);

    expect(responseObj.divs[1].divHtml).toContain("govuk-file-upload");
    expect(responseObj.divs[1].divHtml).toContain(errorMessage);

    expect(response.text).toContain(INVALID_MIME_TYPE);
    expect(mockRequest).toHaveBeenCalled();
    expect(mockCompanyContext).toHaveBeenCalled();
    expect(mockAddAttachment).toHaveBeenCalled();
  });

  it ("AJAX - should redirect to error screen if apiclient throws error", async () => {
    mockAddAttachment.prototype.constructor.mockImplementationOnce(() => {throw new Error()});
    const res = await request(app)
      .post(pageURLs.EXTENSIONS_DOCUMENT_UPLOAD)
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`])
      .set('X-Requested-With','XMLHttpRequest')
      .attach('file-upload', path.join(__dirname + "/../client/files/text.txt"));
    expect(res.status).toEqual(500);
    expect(res.text).toEqual("{\"redirect\":\"/extensions/error\"}");
    expect(mockRequest).toHaveBeenCalled();
    expect(mockCompanyContext).toHaveBeenCalled();
    expect(mockAddAttachment).toHaveBeenCalled();
  });

  it ("AJAX - should return divs html when file uploaded successfully", async () => {
    mockCacheService.prototype.constructor.mockImplementationOnce(fullDummySession);
    const expectedBuffer = fs.readFileSync(path.join(__dirname + "/../client/files/text.txt"));
    const res = await request(app)
      .post(pageURLs.EXTENSIONS_DOCUMENT_UPLOAD)
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`])
      .set('X-Requested-With','XMLHttpRequest')
      .attach('file-upload', path.join(__dirname + "/../client/files/text.txt"));
    expect(res.status).toEqual(200);
    const responseObj = JSON.parse(res.text);
    expect(responseObj.divs.length).toEqual(2);

    expect(responseObj.divs[0].divId).toContain("fileListDiv");
    expect(responseObj.divs[1].divId).toContain("fileUploadDiv");

    expect(responseObj.divs[0].divHtml).toContain("govuk-upload-list");
    expect(responseObj.divs[0].divHtml).toContain("squirrel.gif");
    expect(responseObj.divs[0].divHtml).toContain("documentID=2ef57740-200d-4cb0-b814-c3149efcf87b");

    expect(responseObj.divs[1].divHtml).toContain("govuk-file-upload");
    expect(responseObj.divs[1].divHtml).toContain("Add another document");

    expect(mockAddAttachment).toBeCalledWith("00006400",
      "KGGGUYUYJHHVK1234",
      "request1",
      "1234",
      expectedBuffer,
      "text.txt");
  });

  it ("AJAX - should show error message if continue pressed with no docs added", async () => {
    mockCacheService.prototype.constructor.mockImplementationOnce(fullDummySession);
    mockFullRequest.prototype.constructor.mockImplementationOnce(() => {
      return {
        reasons: [{
          "id": "1234",
          "reason": "illness",
          "attachments": [],
          "start_on": "1999-05-06",
          "end_on": "1999-07-08",
          "affected_person": "bob",
          "reason_information": "stuff",
          "continued_illness": "maybe"
        }]
      }
    });

    const errorMessage: string = "You must add a document or click &quot;Continue without " +
      "adding documents&quot;";

    const res = await request(app)
      .post(pageURLs.EXTENSIONS_DOCUMENT_UPLOAD)
      .set("Referer", "/")
      .set("Cookie", [`${COOKIE_NAME}=123`])
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({"continueCheck": "continueCheck"});
    expect(res.status).toEqual(200);

    const responseObj = JSON.parse(res.text);
    expect(responseObj.divs.length).toEqual(2);

    expect(responseObj.divs[0].divId).toEqual("errorSummaryDiv");
    expect(responseObj.divs[1].divId).toEqual("fileUploadDiv");

    expect(responseObj.divs[0].divHtml).toContain("govuk-error-summary");
    expect(responseObj.divs[0].divHtml).toContain(errorMessage);

    expect(responseObj.divs[1].divHtml).toContain("govuk-file-upload");
    expect(responseObj.divs[1].divHtml).toContain(errorMessage);
  });
});
