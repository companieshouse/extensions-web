import {formatDateForDisplay, formatDateForReason, formatDateForRequest} from "../../client/date.formatter";


describe("date formatter tests", () => {
  it("should return a formatted date for displaying when given a date", () => {
    const formattedDate: string = formatDateForDisplay("1906-11-03");
    expect(formattedDate).toEqual("3 November 1906");
  });

  it("should return a formatted date for a reason when given a date", () => {
    const formattedDate: string = formatDateForReason("2", "3", "2007");
    expect(formattedDate).toEqual("2007-03-02T00:00:00");
  });

  it("should return a formatted date for a request when given a date", () => {
    const formattedDate: string = formatDateForRequest("1906-11-03");
    expect(formattedDate).toEqual("1906-11-03T00:00:00");
  });
});
