import { DateTime } from "luxon";

const DISPLAY_DATE_FORMAT: string = "d MMMM y";
const REASON_DATE_FORMAT: string = "y-MM-dd";

export const formatISODateForDisplay = (inputDateAsISO: string): string => {
  return DateTime.fromISO(inputDateAsISO).toFormat(DISPLAY_DATE_FORMAT);
};

export const formatDateForReason = (day: string, month: string, year: string): string => {
  return DateTime.fromObject({
    day: parseInt(day, 10),
    month: parseInt(month, 10),
    year: parseInt(year, 10),
  }).toFormat(REASON_DATE_FORMAT);
};
