import {NextFunction, Request, Response} from "express";
import {IUserProfile} from "../../session/types";
import {ExtensionFullRequest, getFullRequest} from "../../client/apiclient";
import {DOWNLOAD_NOT_AUTHORISED} from "../../model/template.paths";
import logger from "../../logger";

const DOWNLOAD_PERMISSION_NAME: string = process.env.PERMISSION_NAME_DOWNLOAD as string;
const VIEW_PERMISSION_NAME: string = process.env.PERMISSION_NAME_VIEW as string;

/**
 * Checks if the user is allowed to download the attachment identified in the request url
 * @param req
 * @param res
 * @param next
 */
export const authenticateForDownload = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const userProfile: IUserProfile = req.chSession.userProfile() as IUserProfile;

  if (userHasCorrectPermissions(userProfile)) {
    logger.debug("User " + userProfile.email + " authenticated for download via user download permission");
    return next();
  }

  if (await userCreatedTheRequest(userProfile, req)) {
    logger.debug("User " + userProfile.email + " authenticated for download via matching request created_by id");
    return next();
  }

  logger.debug("User " + userProfile.email + " not authenticated for download");
  return res.render(DOWNLOAD_NOT_AUTHORISED);
};

/**
 * Check if the user has the correct permissions to allow downloads
 */
const userHasCorrectPermissions = (userProfile: IUserProfile): boolean | undefined => {
  if (userProfile && userProfile.permissions) {
    return userProfile.permissions[DOWNLOAD_PERMISSION_NAME]
      && userProfile.permissions[VIEW_PERMISSION_NAME];
  }
};

/**
 * Check if the user is the creator of the extension request / attachment to download
 */
const userCreatedTheRequest = async (userProfile: IUserProfile, req: Request): Promise<boolean> => {
  const token: string = req.chSession.accessToken() as string;

  const fullRequest: ExtensionFullRequest =
    await getFullRequest(req.params.companyId, token, req.params.requestId);

  return userProfile && userProfile.id === fullRequest.created_by.id;
};
