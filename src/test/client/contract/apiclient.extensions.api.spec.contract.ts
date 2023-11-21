import { Pact, Matchers } from "@pact-foundation/pact"
import * as path from "path";
import * as apiClient from "../../../client/apiclient";
import { IExtensionRequest } from "session/types";

describe('Pact', () => {

  const GIRLS_SCHOOL: string = "00006400";
  const TOKEN: string = "token";
  const STATIC_REQUEST_1 = "aaaaaaaaaaaaaaaaaaaaaa11";
  const STATIC_REQUEST_2 = "aaaaaaaaaaaaaaaaaaaaaa12";
  const REASON_DELETE_REQUEST = "aaaaaaaaaaaaaaaaaaaaaa13";
  const CREATE_REASON_REQUEST = "aaaaaaaaaaaaaaaaaaaaaa14";
  const ATTACHMENT_DELETE_REQUEST = "aaaaaaaaaaaaaaaaaaaaaa15";
  const PATCH_REASON_REQUEST = "aaaaaaaaaaaaaaaaaaaaaa16";

  let provider;

  beforeAll(() => {
    provider = new Pact({
      port: 9333,
      host: "localhost",
      log: path.resolve(process.cwd(), 'logs', 'mockserver-integration.log'),
      dir: path.resolve(process.cwd(), 'pacts'),
      consumer: "extensions-web",
      provider: "extensions-api",
      pactfileWriteMode: "update",
    });
  })

  beforeEach((done) => {
    provider.setup()
      .then(() => done(), e => done.fail(e));
  });

  afterEach((done) => {
    provider.finalize()
      .then(done, e => done.fail(e))
  });

  describe("contract tests", () => {
    describe("Full extensions request", () => {
      beforeEach(async () => {
        await provider.addInteraction({
          state: "i have full request object",
          uponReceiving: "a request for a full extensions object",
          withRequest: {
            method: "GET",
            path: `/company/${GIRLS_SCHOOL}/extensions/requests/${STATIC_REQUEST_1}`,
            headers: { Accept: "application/json" },
          },
          willRespondWith: {
            status: 200,
            headers: { "Content-Type": "application/json" },
            body: {
              id: STATIC_REQUEST_1,
              created_by: {
                id: Matchers.somethingLike("an id"),
              },
              reasons: [{
                id: Matchers.uuid(),
                reason: Matchers.somethingLike("a reason"),
                reason_information: Matchers.somethingLike("reason info"),
                start_on: Matchers.iso8601Date(),
                end_on: Matchers.iso8601Date(),
                continued_illness: Matchers.somethingLike("yes"),
                affected_person: Matchers.somethingLike("a company director"),
                attachments: [
                  {
                    id: Matchers.uuid(),
                    name: Matchers.somethingLike("a name")
                  }
                ],
              }],
            },
          }
        });
      });

      it("will return the full request", async () => {
        try {
          const response = await apiClient.getFullRequest(GIRLS_SCHOOL, TOKEN, STATIC_REQUEST_1);

          expect(response.id).toEqual(STATIC_REQUEST_1);
        } finally {
          await verify();
        }
      });
    });

    describe("create extension", () => {
      beforeEach(async () => {
        await provider.addInteraction({
          state: "I am expecting a post request",
          uponReceiving: "create extension request",
          withRequest: {
            method: "POST",
            path: `/company/${GIRLS_SCHOOL}/extensions/requests/`,
            headers: { 
              Accept: "application/json",
              "Content-Type": "application/json"
            },
            body: {
              accounting_period_start_on: Matchers.iso8601Date(),
              accounting_period_end_on: Matchers.iso8601Date()
            }
          },
          willRespondWith: {
            status: 201,
            headers: { "Content-Type": "application/json" },
            body: {
              id: Matchers.somethingLike("an id"),
              accounting_period_start_on: Matchers.iso8601Date(),
              accounting_period_end_on: Matchers.iso8601Date(),
            },
          }
        });
      });

      it("will create extension request", async () => {
        try {
          const response = await apiClient.createExtensionRequest({
            accountingPeriodEndOn: "2019-01-01",
            accountingPeriodStartOn: "2018-01-01",
            companyNumber: GIRLS_SCHOOL
          } as apiClient.ExtensionsCompanyProfile, TOKEN);

          expect(response.id).toEqual("an id");
        } finally {
          await verify();
        }
      });
    });

    describe("add reason", () => {
      beforeEach(async () => {
        await provider.addInteraction({
          state: "I have extension request aaaaaaaaaaaaaaaaaaaaaa14 for company number 00006400",
          uponReceiving: "post request for create reason",
          withRequest: {
            method: "POST",
            path: `/company/${GIRLS_SCHOOL}/extensions/requests/${CREATE_REASON_REQUEST}/reasons`,
            headers: { 
              Accept: "application/json",
              "Content-Type": "application/json"
            },
            body: {
              reason: "illness"
            }
          },
          willRespondWith: {
            status: 201,
            headers: { "Content-Type": "application/json" },
            body: {
              id: Matchers.uuid(),
              reason: Matchers.somethingLike("a reason"),
            },
          }
        });
      });

      it("will add reason to a request", async () => {
        try {
          const response = await apiClient.addExtensionReasonToRequest(GIRLS_SCHOOL, TOKEN, CREATE_REASON_REQUEST, "illness");

          expect(response.reason).toEqual("a reason");
        } finally {
          await verify();
        }
      });
    });

    describe("reason information update", () => {
      beforeEach(async () => {
        await provider.addInteraction({
          state: "I have extension request aaaaaaaaaaaaaaaaaaaaaa16 with reasonId: reason1 without reason information",
          uponReceiving: "patch request for reason update",
          withRequest: {
            method: "PATCH",
            path: `/company/${GIRLS_SCHOOL}/extensions/requests/${PATCH_REASON_REQUEST}/reasons/reason1`,
            headers: { 
              Accept: "application/json",
              "Content-Type": "application/json"
            },
            body: {
              reason_information: "information"
            }
          },
          willRespondWith: {
            status: 200,
            headers: { "Content-Type": "application/json" },
            body: {
              reason_information: "information",
            },
          }
        });
      });

      it("will update a reason in a request", async () => {
        try {
          const request: IExtensionRequest = {
            company_number: GIRLS_SCHOOL,
            extension_request_id: PATCH_REASON_REQUEST,
            reason_in_context_string: "reason1"
          }
          const response = 
            await apiClient.updateReason(request, TOKEN, {reason_information: "information"});

          expect(response.reason_information).toEqual("information");
        } finally {
          await verify();
        }
      });
    });

    describe("reason status update", () => {
      beforeEach(async () => {
        await provider.addInteraction({
          state: "I have extension request aaaaaaaaaaaaaaaaaaaaaa16 with reasonId: reason1 without reason information",
          uponReceiving: "patch request for reason update",
          withRequest: {
            method: "PATCH",
            path: `/company/${GIRLS_SCHOOL}/extensions/requests/${PATCH_REASON_REQUEST}/reasons/reason1`,
            headers: { 
              Accept: "application/json",
              "Content-Type": "application/json"
            },
            body: {
              reason_status: "COMPLETED"
            }
          },
          willRespondWith: {
            status: 200,
            headers: { "Content-Type": "application/json" },
            body: {
              reason_status: "COMPLETED",
            },
          }
        });
      });

      it("will update a reason in a request", async () => {
        try {
          const request: IExtensionRequest = {
            company_number: GIRLS_SCHOOL,
            extension_request_id: PATCH_REASON_REQUEST,
            reason_in_context_string: "reason1"
          }
          const response = 
            await apiClient.updateReason(request, TOKEN, {reason_status: "COMPLETED"});

          expect(response.reason_status).toEqual("COMPLETED");
        } finally {
          await verify();
        }
      });
    });

    describe("remove reason", () => {
      beforeEach(async () => {
        await provider.addInteraction({
          state: "I have extension request aaaaaaaaaaaaaaaaaaaaaa13 with reasonId: reason1",
          uponReceiving: "a reason delete request",
          withRequest: {
            method: "DELETE",
            path: `/company/${GIRLS_SCHOOL}/extensions/requests/${REASON_DELETE_REQUEST}/reasons/reason1`,
            headers: { 
              Accept: "application/json",
            }
          },
          willRespondWith: {
            status: 204,
          }
        });
      });

      it("will remove a reason from a request", async () => {
        try {
          const request: IExtensionRequest = {
            company_number: GIRLS_SCHOOL,
            extension_request_id: REASON_DELETE_REQUEST,
            reason_in_context_string: "reason1"
          }
          await apiClient.removeExtensionReasonFromRequest(request, TOKEN);
        } finally {
          await verify();
        }
      });
    });

    describe("remove attachment", () => {
      beforeEach(async () => {
        await provider.addInteraction({
          state: "I have extension request aaaaaaaaaaaaaaaaaaaaaa15 with reasonId: reason1 and attachment: attachment1",
          uponReceiving: "an attachment DELETE request",
          withRequest: {
            method: "DELETE",
            path: `/company/${GIRLS_SCHOOL}/extensions/requests/${ATTACHMENT_DELETE_REQUEST}/reasons/reason1/attachments/attachment1`,
          },
          willRespondWith: {
            status: 204,
          }
        });
      });

      it("will remove an attachment", async () => {
        try {
          await apiClient.removeAttachment(GIRLS_SCHOOL, TOKEN, ATTACHMENT_DELETE_REQUEST, "reason1", "attachment1");
        } finally {
          await verify();
        }
      });
    });

    describe("get list of reasons", () => {
      beforeEach(async () => {
        await provider.addInteraction({
          state: "I have extension request aaaaaaaaaaaaaaaaaaaaaa12 with reasonId: reason1",
          uponReceiving: "a get reasons request",
          withRequest: {
            method: "GET",
            path: `/company/${GIRLS_SCHOOL}/extensions/requests/${STATIC_REQUEST_2}/reasons`,
            headers: { 
              Accept: "application/json",
            }
          },
          willRespondWith: {
            status: 200,
            headers: { "Content-Type": "application/json" },
            body: {
              items_per_page: Matchers.somethingLike(1),
              start_index: Matchers.somethingLike(1),
              total_results: Matchers.somethingLike(1),
              items: [{
                id: Matchers.uuid(),
                reason: Matchers.somethingLike("a reason"),
                start_on: Matchers.iso8601Date(),
                end_on: Matchers.iso8601Date(),
                reason_information: Matchers.somethingLike("a reason information"),
                affected_person: Matchers.somethingLike("a person")
              },
              {
                id: Matchers.uuid(),
                reason: Matchers.somethingLike("a reason"),
                start_on: Matchers.iso8601Date(),
                continued_illness: Matchers.somethingLike("yes"),
                reason_information: Matchers.somethingLike("a reason information"),
                affected_person: Matchers.somethingLike("a person")
              }]
            }
          }
        });
      });

      it("will get list of reasons", async () => {
        try {
          const request: IExtensionRequest = {
            company_number: GIRLS_SCHOOL,
            extension_request_id: STATIC_REQUEST_2,
          }
          const response = 
            await apiClient.getReasons(request, TOKEN);

          expect(response.items[0].reason).toEqual("a reason");
        } finally {
          await verify();
        }
      });
    });
  });

  const verify = async () => {
    try {
      await provider.verify();
    } catch(e) {
      fail(e);
    }
  }
});
