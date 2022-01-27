const test = require("tape");
const requestSkippableAnimationFrame = require("../src");
const { detectMonitorRefreshRate } = requestSkippableAnimationFrame;

const sleep = (time) => new Promise((resolve) => setTimeout(resolve, time));

let monitorRefreshRate = null;

test("detect monitor refresh rate", async (t) => {
  t.plan(1);

  monitorRefreshRate = await detectMonitorRefreshRate();

  t.ok(
    typeof monitorRefreshRate === "number",
    `detected monitor refresh rate (${monitorRefreshRate} Hz)`
  );

  t.end();
});

test("max animation frames per monitor refresh cycle", async (t) => {
  // Multiplied against monitor refresh rate in order to determine how many
  // times to loop requestSkippableAnimationFrame calls
  const BATCH_CYCLE_MULTIPLIER = 32;

  const MAX_SKIPPABLE_FRAME_CALLS = monitorRefreshRate * BATCH_CYCLE_MULTIPLIER;

  // Populated as requestSkippableAnimationFrame callbacks are called
  let invocationCount = 0;

  await new Promise(async (resolve) => {
    for (let i = 0; i < MAX_SKIPPABLE_FRAME_CALLS; i++) {
      // Sleep an amount of time less than the duration of a hertz
      //
      // This is especially needed as multiple calls to requestSkippableAnimationFrame
      // in a single event loop cycle are always superseded by the last call
      await sleep(0);

      requestSkippableAnimationFrame(() => {
        ++invocationCount;

        if (i === MAX_SKIPPABLE_FRAME_CALLS - 1) {
          resolve(invocationCount);
        }
      }, "t1");
    }
  });

  const cyclesPerSecond = 1000 / monitorRefreshRate;
  const invocationsPerMonitorRefreshCycle =
    invocationCount / BATCH_CYCLE_MULTIPLIER / cyclesPerSecond;

  // Purely informative
  console.log({
    MAX_SKIPPABLE_FRAME_CALLS,
    BATCH_CYCLE_MULTIPLIER,
    cyclesPerSecond,
    invocationCount,
    invocationsPerMonitorRefreshCycle,
  });

  t.ok(
    invocationsPerMonitorRefreshCycle <= 1,
    `no more than one invocation per monitor refresh (${invocationsPerMonitorRefreshCycle} invocations / Hz)`
  );

  // Testing environments can severely impact performance, but we want to
  // ensure it's not too low
  t.ok(
    invocationsPerMonitorRefreshCycle >= 0.75,
    "subsequent invocations performed within reasonable test time"
  );

  t.end();
});
