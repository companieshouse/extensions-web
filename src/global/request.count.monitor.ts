import logger from "../logger";
import {MAXIMUM_EXTENSION_REQUESTS_PER_DAY} from "../session/config";

export default class RequestCountMonitor {

  public static updateTodaysRequestNumber(augment: number): void {
    const present = new Date(Date.now());
    if (!RequestCountMonitor.isSameDay(present)) {
      logger.info("Lasted updated:  " + RequestCountMonitor.lastRequestNumberUpdate +
        " restting number for today");
      RequestCountMonitor.resetNumRequestsForToday();
    } else {
      logger.info("Augmenting the number of requests");
      RequestCountMonitor.numRequestsForToday += augment;
    }
    RequestCountMonitor.setLastNumRequestsUpdate(present);
  }

  public static maximumRequestsPerDayExceeded(): boolean {
    logger.info("Number of requests for today: " + RequestCountMonitor.numRequestsForToday);
    return RequestCountMonitor.numRequestsForToday > parseInt(MAXIMUM_EXTENSION_REQUESTS_PER_DAY, 10);
  }

  public static resetNumRequestsForToday(): void {
    RequestCountMonitor.numRequestsForToday = 0;
  }

  public static setLastNumRequestsUpdate = (date: Date): void => {
    RequestCountMonitor.lastRequestNumberUpdate = date;
  }

  private static numRequestsForToday: number = 0;

  private static lastRequestNumberUpdate: Date;

  private static isSameDay(present: Date): boolean {
    if (RequestCountMonitor.lastRequestNumberUpdate) {
      return present.getUTCFullYear() ===
         RequestCountMonitor.lastRequestNumberUpdate.getUTCFullYear()
      && present.getUTCMonth() ===
        RequestCountMonitor.lastRequestNumberUpdate.getUTCMonth()
      && present.getUTCDate() ===
        RequestCountMonitor.lastRequestNumberUpdate.getUTCDate();
    }
    return true;
  }
}
