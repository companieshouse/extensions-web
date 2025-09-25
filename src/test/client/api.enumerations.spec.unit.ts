import {lookupCompanyStatus, lookupCompanyType} from "../../client/api.enumerations";

jest.mock("js-yaml", () => {
  return {
    safeLoad: jest.fn(() => {
      return {
        company_summary: {
          ltd: "Private limited company",
        },
        company_status: {
          receivership: "Receiver Action",
        }
      }
    })
  }
});

describe("api enumeration tests", () => {

  afterEach(() => {
    jest.resetModules();
  });

  it("should return a readable company type description when given a company type key", () => {
    const readableCompanyType: string = lookupCompanyType("ltd");
    expect(readableCompanyType).toEqual("Private limited company");
  });

  it("should return original key when there is no match for the company type key", () => {
    const key: string = "key";
    const readableCompanyType: string = lookupCompanyType(key);
    expect(readableCompanyType).toEqual(key);
  });

  it("should return a readable company status description when given a company status key", () => {
    const readableCompanyStatus: string = lookupCompanyStatus("receivership");
    expect(readableCompanyStatus).toEqual("Receiver Action");
  });

  it("should return original key when there is no match for the company status key", () => {
    const key: string = "key";
    const readableCompanyStatus: string = lookupCompanyStatus(key);
    expect(readableCompanyStatus).toEqual(key);
  });

  it("should return the key if company_summary is undefined", () => {
    jest.doMock("js-yaml", () => ({
      safeLoad: jest.fn(() => ({}))
    }));
    // Re-require the module so it picks up the new mock
    const { lookupCompanyType } = require("../../client/api.enumerations");
    expect(lookupCompanyType("ltd")).toEqual("ltd");
  });

  it("should return the key if company_status is undefined", () => {
    jest.doMock("js-yaml", () => ({
      safeLoad: jest.fn(() => ({}))
    }));
    // Re-require the module so it picks up the new mock
    const { lookupCompanyStatus } = require("../../client/api.enumerations");
    expect(lookupCompanyStatus("receivership")).toEqual("receivership");
  });

  it("should return the key if apiConstants is undefined", () => {
    jest.doMock("js-yaml", () => ({
      safeLoad: jest.fn(() => undefined)
    }));
    // Re-require the module so it picks up the new mock
    const { lookupCompanyType, lookupCompanyStatus } = require("../../client/api.enumerations");
    expect(lookupCompanyType("ltd")).toEqual("ltd");
    expect(lookupCompanyStatus("receivership")).toEqual("receivership");
  });

  it("should handle undefined input keys", () => {
    const { lookupCompanyType, lookupCompanyStatus } = require("../../client/api.enumerations");
    expect(lookupCompanyType(undefined as any)).toBeUndefined();
    expect(lookupCompanyStatus(undefined as any)).toBeUndefined();
  });
});

