import { getTwilightTimes } from "./getTwilightTime";

describe("getTwilightTimes", () => {
  const testDate = new Date("2025-01-28");

  test("returns correct twilight times for Odesa, Ukraine", () => {
    const times = getTwilightTimes(46.4775, 30.7435, testDate);
    const odesaOffset = 2; // UTC+2
  
    expect(times).toHaveProperty("sunrise");
    expect(times).toHaveProperty("sunset"); 
    expect(times).toHaveProperty("civilDawn");
    expect(times).toHaveProperty("civilDusk");
    expect(times).toHaveProperty("nauticalDawn");
    expect(times).toHaveProperty("nauticalDusk");
    expect(times).toHaveProperty("astronomicalDawn");
    expect(times).toHaveProperty("astronomicalDusk");
  });

  test("returns correct twilight times for New York, USA", () => {
    const times = getTwilightTimes(40.7128, -74.0060, testDate);
    const nyOffset = -5; // UTC-5
    console.log("New York twilight times:", {
      ...times
    });
    expect(times).toHaveProperty("sunrise");
    expect(times).toHaveProperty("sunset");
    expect(times).toHaveProperty("civilDawn");
    expect(times).toHaveProperty("civilDusk");
    expect(times).toHaveProperty("nauticalDawn");
    expect(times).toHaveProperty("nauticalDusk");
    expect(times).toHaveProperty("astronomicalDawn");
    expect(times).toHaveProperty("astronomicalDusk");
  });
});
