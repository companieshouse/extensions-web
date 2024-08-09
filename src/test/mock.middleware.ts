/*
  Mock Implementation of Web Node Security CsrfProtectionMiddleware.
  Note: this needs to be imported before the 'app' component in each test module in order for 'app' to be able to mock it.
*/

import { NextFunction, Request, Response } from "express";
import { CsrfProtectionMiddleware } from "@companieshouse/web-security-node";

jest.mock("@companieshouse/web-security-node");
jest.mock('ioredis', () => {
  return {
    default: jest.fn().mockReturnThis()
  }
});
jest.mock("redis", () => {
  return {
    createClient: jest.fn().mockReturnThis(),
    on: jest.fn().mockReturnThis(),
  }
});

const mockCsrfProtectionMiddleware = CsrfProtectionMiddleware as jest.Mock;
mockCsrfProtectionMiddleware.mockImplementation((_opts) => (req: Request, res: Response, next: NextFunction) => next());

const mockMiddlewares = {
  mockSessionMiddleware: jest.fn().mockImplementation(),
  mockCsrfProtectionMiddleware
}

export default mockMiddlewares;
