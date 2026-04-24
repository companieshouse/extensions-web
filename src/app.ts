import cookieParser from "cookie-parser";
import express from "express";
import nunjucks from "nunjucks";
import path from "path";
import Redis from "ioredis";
// ts-jest / test env can expose different module shapes; when running under Jest
// prefer requiring the module so the constructor is available. In production the
// TypeScript-style import is used for clarity.
const RedisCtor: any = (process.env.JEST_WORKER_ID !== undefined)
  ? (() => {
      const mod = require("ioredis");
      return (mod && (mod as any).default) ? (mod as any).default : mod;
    })()
  : ((Redis as any) && (Redis as any).default ? (Redis as any).default : Redis);


import { CsrfProtectionMiddleware } from "@companieshouse/web-security-node";
import { SessionMiddleware, SessionStore } from "@companieshouse/node-session-handler";

import authenticate from "./authentication/middleware/index";
import monitor from "./authentication/middleware/monitor";
import errorHandlers from "./controllers/error.controller";
import * as pageUrls from "./model/page.urls";
import sessionMiddleware from "./session/middleware";
import history from "./session/middleware/history";
import {appRouter} from "./routes/routes";
import accessibilityRoutes from "./routes/accessibility.routes";
import {ERROR_SUMMARY_TITLE} from "./model/error.messages";
import {CACHE_SERVER, COOKIE_DOMAIN, COOKIE_NAME, COOKIE_SECRET, DEFAULT_SESSION_EXPIRATION, PIWIK_SITE_ID, PIWIK_URL} from "./session/config";
import activeFeature from "./feature.flag";
import logger from "./logger";
import checkServiceAvailability from "./availability/middleware/service.availability";

const EXCLUDED_PATHS = /\/extensions\/((?!healthcheck).)*/;

const app = express();

// view engine setup
const env = nunjucks.configure([
    "views",
    "node_modules/govuk-frontend/",
    "node_modules/govuk-frontend/components/",
    "node_modules/@companieshouse"
  ], {
    autoescape: true,
    express: app,
});

env.addGlobal("CHS_URL", process.env.CHS_URL);
env.addGlobal("assetPath", process.env.CDN_HOST);
env.addGlobal("ERROR_SUMMARY_TITLE", ERROR_SUMMARY_TITLE);
env.addGlobal("PIWIK_URL", PIWIK_URL);
env.addGlobal("PIWIK_SITE_ID", PIWIK_SITE_ID);

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "html");

app.enable("trust proxy");
app.use(express.json());
app.use(express.urlencoded({ 
  extended: false 
}));

// check if we should show the service unavailable page
app.use(`${pageUrls.EXTENSIONS}`, checkServiceAvailability);

app.use(cookieParser());
app.use(EXCLUDED_PATHS, sessionMiddleware);
app.use(`${pageUrls.EXTENSIONS}/*path`, authenticate);

const cookieConfig = {
  cookieName: '__SID',
  cookieSecret: COOKIE_SECRET,
  cookieDomain: COOKIE_DOMAIN,
  cookieTimeToLiveInSeconds: parseInt(DEFAULT_SESSION_EXPIRATION, 10)
};
const sessionStore = new SessionStore(new RedisCtor(`redis://${CACHE_SERVER}`));
app.use(EXCLUDED_PATHS, SessionMiddleware(cookieConfig, sessionStore));

const csrfProtectionMiddleware = CsrfProtectionMiddleware({
  sessionStore,
  enabled: true,
  sessionCookieName: COOKIE_NAME
});
app.use(EXCLUDED_PATHS, csrfProtectionMiddleware);

if (activeFeature(process.env.ACCESSIBILITY_TEST_MODE)) {
  app.use(pageUrls.EXTENSIONS, accessibilityRoutes);
} else {
  app.use(`${pageUrls.EXTENSIONS}/*path`, monitor);
  app.use(`${pageUrls.EXTENSIONS}/*path`, history);
}
app.use(pageUrls.EXTENSIONS, appRouter);
app.use(...errorHandlers);

logger.info("Extensions service started");

export default app;
