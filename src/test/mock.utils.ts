import * as keys from "../session/keys";
import {ExtensionsCompanyProfile, ExtensionFullRequest} from "../client/apiclient";
import {loadSession} from "../services/redis.service";
import Session from "../session/session";

export const COMPANY_NUMBER = "00006400";
export const COMPANY_NAME = "GIRLS TRUST";
export const COMPANY_STATUS_ACTIVE = "Active";
export const COMPANY_STATUS_LIQUIDATED = "liquidated";
export const COMPANY_TYPE = "Limited";
export const COMPANY_INC_DATE = "23 September 1973";
export const HAS_BEEN_LIQUIDATED = false;
export const HAS_CHARGES = true;
export const HAS_INSOLVENCY_HISTORY = true;
export const LINE_1 = "123";
export const LINE_2 = "street";
export const POST_CODE = "CF1 123";
export const ACCOUNTS_NEXT_DUE_DATE = "2019-05-12";
export const ACCESS_TOKEN = "KGGGUYUYJHHVK1234";
export const EMAIL = "demo@ch.gov.uk";

export const loadMockSession = (mockLoadSessionFunction: jest.Mock<typeof loadSession>): void => {
  mockLoadSessionFunction.prototype.constructor.mockImplementation(async (cookieId) => {
    const session = Session.newWithCookieId(cookieId);
    session.data = {
      [keys.SIGN_IN_INFO]: {
        [keys.SIGNED_IN]: 1,
        [keys.ACCESS_TOKEN]: {
          [keys.ACCESS_TOKEN]: ACCESS_TOKEN,
        },
        [keys.USER_PROFILE]: {
          [keys.USER_ID]: "123",
        },
      },
      [keys.EXTENSION_SESSION]: {
        [keys.COMPANY_IN_CONTEXT]: COMPANY_NUMBER,
      },
      [keys.PAGE_HISTORY]: {
        page_history:[],
      }
    };
    return session;
  });
};

export const fullDummySession = () => {
  let session = Session.newWithCookieId("cookie");
  session.data = {
    [keys.SIGN_IN_INFO]: {
      [keys.SIGNED_IN]: 1,
      [keys.ACCESS_TOKEN]: {
        [keys.ACCESS_TOKEN]: ACCESS_TOKEN,
      },
      [keys.USER_PROFILE]: {
        [keys.USER_ID]: "123",
      },
      [keys.USER_PROFILE]: {
        email: EMAIL
      }
    },
    [keys.EXTENSION_SESSION]: {
      [keys.COMPANY_IN_CONTEXT]: "00006400",
      [keys.EXTENSION_REQUESTS]: [{
        [keys.COMPANY_NUMBER]: "00006400",
        "extension_request_id": "request1",
        "reason_in_context_string": "reason1",
      }]
    },
    [keys.PAGE_HISTORY]: {
      page_history: []
    }
  };
  return session;
};

export const sessionWithChangingDetails = () => {
  let session = Session.newInstance();
  session.data = {
    [keys.CHANGING_DETAILS]: true,
    [keys.SIGN_IN_INFO]: {
      [keys.SIGNED_IN]: 1,
      [keys.ACCESS_TOKEN]: {
        [keys.ACCESS_TOKEN]: "ACCESS_TOKEN",
      },
      [keys.USER_PROFILE]: {
        email: "EMAIL"
      }
    },
    [keys.EXTENSION_SESSION]: {
      [keys.COMPANY_IN_CONTEXT]: "00006400",
      [keys.EXTENSION_REQUESTS]: [{
        [keys.COMPANY_NUMBER]: "00006400",
        "extension_request_id": "request1",
        "reason_in_context_string": "reason1",
      }]
    }
  };
  return session;
};

export const getDummyCompanyProfile = (isOverdue: boolean, isActive): ExtensionsCompanyProfile => {
  return {
    accountingPeriodEndOn: ACCOUNTS_NEXT_DUE_DATE,
    accountingPeriodStartOn: ACCOUNTS_NEXT_DUE_DATE,
    hasBeenLiquidated: HAS_BEEN_LIQUIDATED,
    hasCharges: HAS_CHARGES,
    hasInsolvencyHistory: HAS_INSOLVENCY_HISTORY,
    companyName: COMPANY_NAME,
    companyNumber: COMPANY_NUMBER,
    companyStatus: isActive ? COMPANY_STATUS_ACTIVE : COMPANY_STATUS_LIQUIDATED,
    companyType: COMPANY_TYPE,
    incorporationDate: COMPANY_INC_DATE,
    address: {
      line_1: LINE_1,
      line_2: LINE_2,
      postCode: POST_CODE
    },
    accountsDue: ACCOUNTS_NEXT_DUE_DATE,
    isAccountsOverdue: isOverdue
  }
};

export const getDummyFullRequest: ExtensionFullRequest = {
  id : "77d8cdd9ddb57bb22e7997c5c",
  reasons : [
    {
      id : "reason0",
      reason : "other",
      attachments : [
        {
          id : "88ea9206-164f-4bff-a1f9-855b055dcfb0",
          name : "Rainbow.jpg",
        },
        {
          id : "2cfe5985-0907-48aa-90dc-ee480a956efb",
          name : "squirrel.gif",
        },
        {
          id : "a2ac9bc1-50b1-4930-a567-3ec83a668026",
          name : "elephant.jpg",
        },
      ],
      start_on: "2018-12-12",
      end_on: "2018-12-20",
      affected_person: "bob",
      reason_information: "s",
      continued_illness: "yes",
      reason_status : "DRAFT"
    },
    {
      id : "reason1",
      reason : "illness",
      attachments : [
        {
          id : "2222-164f-4bff-a1f9-855b055dcfb0",
          name : "Rainbow.jpg",
        },
        {
          id : "33335-0907-48aa-90dc-ee480a956efb",
          name : "squirrel.gif",
        },
        {
          id : "444441-50b1-4930-a567-3ec83a668026",
          name : "elephant.jpg",
        },
      ],
      start_on: "2019-12-12",
      end_on: "2019-12-20",
      affected_person: "dave",
      reason_information: "info",
      continued_illness: "yes",
      reason_status : "DRAFT"
    }
  ],
  created_by : {
    id : "djklkjdfdkl",
  },
};
