jest.mock("redis", () => {
  return {
    createClient: jest.fn().mockReturnThis(),
    on: jest.fn().mockReturnThis(),
  }
});
jest.mock("../../services/session.service");

import { Request, Response, NextFunction } from "express";
import sessionMiddleware from "../../session/middleware/session.query";
import * as sessionService from "../../services/session.service";

const mockSetReasonInContext = (<unknown>sessionService.setReasonInContextAsString as jest.Mock<typeof sessionService.setReasonInContextAsString>);

beforeEach(() => {
  mockSetReasonInContext.mockClear();
});

describe("Query param session tests", () => {

  it("Should change the reason in context if reasonId is present", () => {
    const dummyRequest = {
      query: {
        reasonId: "123"
      },
      chSession: {}
    } as unknown as Request;
    const dummyResponse = {} as Response;
    const dummyNext = (() => {}) as NextFunction;
    sessionMiddleware(dummyRequest, dummyResponse, dummyNext);

    expect(mockSetReasonInContext).toHaveBeenCalledWith(dummyRequest.chSession, "123");
  });

  it("Should skip if no query param present", () => {
    const dummyRequest = {
      query: {},
      chSession: {}
    } as Request;
    const dummyResponse = {} as Response;
    const dummyNext = (() => {}) as NextFunction;
    sessionMiddleware(dummyRequest, dummyResponse, dummyNext);

    expect(mockSetReasonInContext).not.toHaveBeenCalled();
  });
});