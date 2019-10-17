import RequestCountMonitor from "../../global/request.count.monitor";

describe("global request tests", () => {

  beforeEach( () => {
    RequestCountMonitor.resetNumRequestsForToday();
  });

  it("Should not return maximum flag for 49 requests", () => {
    const present: Date = new Date("2019-01-02T11:01:58.135Z");
    const yesterhour: Date = new Date("2019-01-02T10:01:58.135Z");
    jest.spyOn(Date, "now").mockReturnValue(present.getTime());
    RequestCountMonitor.setLastNumRequestsUpdate(yesterhour);
    RequestCountMonitor.updateTodaysRequestNumber(50);
    expect(RequestCountMonitor.maximumRequestsPerDayExceeded()).toBe(false);
  })

  it("Should return maximum flag when last update is earlier today for 50 requests", () => {
    const present: Date = new Date("2019-01-02T11:01:58.135Z");
    const yesterhour: Date = new Date("2019-01-02T10:01:58.135Z");
    jest.spyOn(Date, "now").mockReturnValue(present.getTime());
    RequestCountMonitor.setLastNumRequestsUpdate(yesterhour);
    RequestCountMonitor.updateTodaysRequestNumber(51);
    expect(RequestCountMonitor.maximumRequestsPerDayExceeded()).toBe(true);
  })

  it("Should not return maximum flag when last update is yesterday", () => {
    const present: Date = new Date("2019-01-02T11:01:58.135Z");
    const yesterday: Date = new Date("2019-01-01T11:01:58.135Z");
    jest.spyOn(Date, "now").mockReturnValue(present.getTime());
    RequestCountMonitor.setLastNumRequestsUpdate(yesterday);
    RequestCountMonitor.updateTodaysRequestNumber(51);
    expect(RequestCountMonitor.maximumRequestsPerDayExceeded()).toBe(false);
  })
});
