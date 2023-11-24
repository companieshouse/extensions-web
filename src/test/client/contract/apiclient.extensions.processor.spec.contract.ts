import { Pact } from "@pact-foundation/pact"
import * as path from "path";
import * as apiClient from "../../../client/apiclient";

describe("Extensions-processor-api consumer tests", () => {

  const GIRLS_SCHOOL: string = "00006400";
  const TOKEN: string = "token";
  const FULL_REQUEST_ID = "aaaaaaaaaaaaaaaaaaaaaaaa4";

  let provider;

  beforeAll(() => {
    provider = new Pact({
      port: 9333,
      host: "localhost",
      log: path.resolve(process.cwd(), 'logs', 'mockserver-integration.log'),
      dir: path.resolve(process.cwd(), 'pacts'),
      consumer: "extensions-web",
      provider: "extensions-processor-api",
      pactfileWriteMode: "update",
      spec: 3
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

  describe("extensions-processor-api contract test", () => {
    describe("call processor api", () => {
      beforeEach(async () => {
        await provider.addInteraction({
          state: "i have full and OPEN request object",
          uponReceiving: "a post request to process the extension",
          withRequest: {
            method: "POST",
            path: `/company/${GIRLS_SCHOOL}/extensions/requests/${FULL_REQUEST_ID}/process`,
            headers: { Accept: "application/json" },
          },
          willRespondWith: {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        });
      });

      it("will process an OPEN request", async () => {
        try {
          await apiClient.callProcessorApi(GIRLS_SCHOOL, TOKEN, FULL_REQUEST_ID);
        } finally {
          await verify();
        }
      });
    });
  });

  const verify = async () => {
    try {
      await provider.verify();
    } catch (e) {
      fail(e);
    }
  }
});