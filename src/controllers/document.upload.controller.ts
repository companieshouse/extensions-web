import {NextFunction, Request, Response} from "express";
import * as pageURLs from "../model/page.urls";
import * as templatePaths from "../model/template.paths";
import * as keys from "../session/keys";
import {addAttachmentToReason} from "../client/apiclient";
import * as sessionService from "../services/session.service";
import logger from "../logger";
import {createGovUkErrorData, GovUkErrorData} from "../model/govuk.error.data";
import { IUserProfile, IExtensionRequest } from "session/types";
import {
  INVALID_MIME_TYPES,
  FILE_TOO_LARGE,
  NO_DOCUMENTS_ADDED, NO_FILE_CHOSEN,
} from "../model/error.messages";
import {MAX_FILE_SIZE_BYTES} from "../session/config";
import {ReasonWeb} from "../model/reason/extension.reason.web";
import {Socket} from "net";
import * as Busboy from "busboy";
import {createUploadResponder, UploadResponder} from "./upload/upload.responder.factory";
import {getCurrentReasonFull} from "../services/reason.service";

const maxSizeBytes: number = parseInt(MAX_FILE_SIZE_BYTES, 10);

// GET /extensions/document-upload
export const render = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  if (req.query.reasonId) {
    await sessionService.setReasonInContextAsString(req.chSession, req.query.reasonId);
  }
  const thisReason: ReasonWeb = await getCurrentReasonFull(req.chSession);
  return res.render(templatePaths.DOCUMENT_UPLOAD,
    {
      reason: thisReason,
      templateName: templatePaths.DOCUMENT_UPLOAD,
    });
};

// POST /extensions/document-upload
const route = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const uploadResponder: UploadResponder = createUploadResponder(req.xhr);
  const currentReason: ReasonWeb = await getCurrentReasonFull(req.chSession);
  if (req.body.continueCheck) {
    return await continueWithValidation(req, res, next, uploadResponder, currentReason);
  } else {
    logger.debug("Add attachment request type is " + (req.xhr ? "" : "NOT ") + "AJAX / XmlHttpRequest");
    return await addAttachment(req, res, next, uploadResponder, currentReason);
  }
};

const continueWithValidation = async (req: Request,
                                      res: Response,
                                      next: NextFunction,
                                      uploadResponder: UploadResponder,
                                      currentReason: ReasonWeb): Promise<void> => {

  if (currentReason && currentReason.attachments && !currentReason.attachments.length) {
    return buildError(req, res, NO_DOCUMENTS_ADDED, uploadResponder, currentReason);
  }
  return continueWithNoValidation(req, res, next);
};

// GET /extensions/document-upload-continue-no-docs
export const continueWithNoValidation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const changingDetails = req.chSession.data[keys.CHANGING_DETAILS];
  if (changingDetails) {
    return res.redirect(pageURLs.EXTENSIONS_CHECK_YOUR_ANSWERS);
  } else {
    res.redirect(pageURLs.EXTENSIONS_ADD_EXTENSION_REASON);
  }
};

const addAttachment = async (req: Request,
                             res: Response,
                             next: NextFunction,
                             uploadResponder: UploadResponder,
                             currentReason: ReasonWeb): Promise<void> => {

  const chunkArray: Buffer[] = [];

  const busboy: busboy.Busboy = new Busboy({
    headers: req.headers,
    limits: {
      fileSize: maxSizeBytes,
    },
  });

  // Busboy on file received event - start of file upload process when start of a file is initially received
  busboy.on("file",
    (fieldName: string,
     fileStream: Socket,
     filename: string,
     encoding: string,
     mimeType: string) => {

    // File on data event - fired when a new chunk of data arrives into busboy
    fileStream.on("data", (chunk: Buffer) => {
      chunkArray.push(chunk);
      logger.trace("Received " + chunk.length + " bytes for file " + filename);
    });

    // File on limit event - fired when file size limit is reached
    fileStream.on("limit", () => {
      fileStream.destroy();
      const maxInMB: number = getMaxFileSizeInMB(maxSizeBytes);
      logger.debug("File limit " + maxInMB + "MB reached for file " + filename);
      const errorMsg: string = `${FILE_TOO_LARGE} ${maxInMB} MB`;
      return buildError(req, res, errorMsg, uploadResponder, currentReason);
    });

    // File on end event - fired when file has finished - could be if file completed fully or ended
    // prematurely (destroyed / cancelled)
    fileStream.on("end", async () => {
      if (!fileStream.destroyed) {  // if file ended normally
        const fileData: Buffer = Buffer.concat(chunkArray);
        logger.debug("Total bytes received for " + filename + " = " + fileData.length);
        if (fileData.length === 0) {
          return await buildError(req, res, NO_FILE_CHOSEN, uploadResponder, currentReason);
        }
        try {
          await prepareAndSendAttachment(req, fileData, filename);
        } catch (e) {
          const userProfile = req.chSession.userProfile() as IUserProfile;
          logger.error(`User ${userProfile.id} has attempted to upload a ` +
            `file ${filename}, mime-type: ${mimeType} ` +
            `of size ${fileData.length} bytes. The api has returned the error: ${e.message}`);

          // render errors in the view
          if (e.status === 415) {
            return await buildError(req, res, INVALID_MIME_TYPES, uploadResponder, currentReason);
          }
          return uploadResponder.handleGenericError(res, e, next);
        }
        logger.debug("Successfully uploaded file " + filename);
        return uploadResponder.handleSuccess(req, res);
      }
    });
  });

  // send the request to busboy
  req.pipe(busboy);
};

// Gets max file size in MB rounded down to nearest whole number
const getMaxFileSizeInMB = (maxSizeInBytes: number): number => {
  return Math.floor(maxSizeInBytes / (1024 * 1024));
};

const buildError = async (req: Request,
                          res: Response,
                          errorMessage: string,
                          uploadResponder: UploadResponder,
                          currentReason: ReasonWeb): Promise<void> => {
  const documentUploadErrorData: GovUkErrorData =
    createGovUkErrorData(errorMessage, "#file-upload", true, "");
  return uploadResponder.handleGovUKError(res, documentUploadErrorData, currentReason);
};

const prepareAndSendAttachment = async (req: Request, fileData: Buffer, filename: string) => {
  const request: IExtensionRequest = sessionService.getRequest(req.chSession);
  const token: string = req.chSession.accessToken() as string;
  if (request && token && fileData) {
    const companyNumber: string = sessionService.getCompanyInContext(req.chSession);
    const requestId: string = request.extension_request_id;
    await addAttachmentToReason(companyNumber, token , requestId,
      request.reason_in_context_string as string, fileData, filename);
  }
};

export default[route];
