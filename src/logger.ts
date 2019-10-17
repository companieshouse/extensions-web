import { configure, getLogger } from "log4js";

const logger = getLogger("extensions-web");
logger.level = process.env.LOG_LEVEL || "info";

configure({
  appenders: { extensions: { type: "console"} },
  categories: { default: { appenders: ["extensions"], level: logger.level } },
});

export default logger;
