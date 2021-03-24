import * as cookieParser from "cookie-parser";
import * as express from "express";
import * as nunjucks from "nunjucks";
import * as path from "path";
import authenticate from "./authentication/middleware/index";
import monitor from "./authentication/middleware/monitor";
import errorHandlers from "./controllers/error.controller";
import * as pageURLs from "./model/page.urls";
import sessionMiddleware from "./session/middleware";
import history from "./session/middleware/history";
import {appRouter} from "./routes/routes";
import accessibilityRoutes from "./routes/accessibility.routes";
import {ERROR_SUMMARY_TITLE} from "./model/error.messages";
import {PIWIK_SITE_ID, PIWIK_URL} from "./session/config";
import activeFeature from "./feature.flag";
import logger from "./logger";
import checkServiceAvailability from "./availability/middleware/service.availability";

const app = express();

// view engine setup
const env = nunjucks.configure([
    "views",
    "node_modules/govuk-frontend/",
    "node_modules/govuk-frontend/components/",
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
app.use(express.urlencoded({ extended: false }));

// check if we should show the service unavailable page
app.use(`${pageURLs.EXTENSIONS}`, checkServiceAvailability);

app.use(cookieParser());
app.use(sessionMiddleware);
app.use(`${pageURLs.EXTENSIONS}/*`, authenticate);

if (activeFeature(process.env.ACCESSIBILITY_TEST_MODE)) {
  app.use(pageURLs.EXTENSIONS, accessibilityRoutes);
} else {
  app.use(`${pageURLs.EXTENSIONS}/*`, monitor);
  app.use(`${pageURLs.EXTENSIONS}/*`, history);
}
app.use(pageURLs.EXTENSIONS, appRouter);
app.use(...errorHandlers);

logger.info("Extensions service started");

export default app;
