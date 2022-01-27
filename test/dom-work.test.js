const test = require("tape");
const requestSkippableAnimationFrame = require("../src");

const sleep = (time) => new Promise((resolve) => setTimeout(resolve, time));

const LOOP_INTERVAL_TYPE_NATIVE_ANIMATION_FRAME = "requestAnimationFrame";
const LOOP_INTERVAL_TYPE_SKIPPABLE_ANIMATION_FRAME =
  "requestSkippableAnimationFrame";

test("less frame invocations for skippable vs native", async (t) => {
  const nativeNumInvocations = await (async () => {
    const { numInvocations, duration } = await measureLoopIntervals(
      LOOP_INTERVAL_TYPE_NATIVE_ANIMATION_FRAME
    );

    // FIXME: (jh) Remove?
    console.log("native: " + numInvocations + " | " + duration);

    return numInvocations;
  })();

  const skippableNumInvocations = await (async () => {
    const { numInvocations, duration } = await measureLoopIntervals(
      LOOP_INTERVAL_TYPE_SKIPPABLE_ANIMATION_FRAME
    );

    // FIXME: (jh) Remove?
    console.log("skippable: " + numInvocations + " | " + duration);

    return numInvocations;
  })();

  t.ok(
    nativeNumInvocations > skippableNumInvocations,
    "more native frame handlers invoked than skippable frames"
  );

  t.end();
});

/**
 * Determines amount of frame invocations and the amount of time for the total
 * run for the respective loop interval type.
 *
 * @param {LOOP_INTERVAL_TYPE_NATIVE_ANIMATION_FRAME | LOOP_INTERVAL_TYPE_SKIPPABLE_ANIMATION_FRAME} type
 * @return {Promise<Object>}
 */
async function measureLoopIntervals(type) {
  const MAX_LOOP_ITERATIONS = 512;

  let loopIdx = 0;
  let numInvocations = 0;

  // Create a DOM element to perform some work on
  const el = document.createElement("div");
  el.innerHTML = "hello world";
  el.style.position = "absolute";
  document.body.appendChild(el);

  const beforeStart = window.performance.now();

  await new Promise(async (resolve) => {
    let finalTimeout = null;

    function handleFrame(time) {
      // NOTE: This "could" be a test case, but it would largely inflate the
      // number of test conditions being run
      if (typeof time !== "number") {
        throw new TypeError("callback time is not a number");
      }

      numInvocations++;

      // Perform some DOM work
      // NOTE: Real-world usage should not try to update the DOM more than once
      // per frame, however the goal here is to use up some CPU cycles to
      // simulate real work being done
      for (let i = 0; i < 1024; i++) {
        el.innerHTML = numInvocations;
        el.style.top = i + "px";
        el.style.left = i + "px";
      }

      // handleFrame is called asynchronously from the loop it is iterating in,
      // and the final number will be the max loop iteration count
      if (loopIdx === MAX_LOOP_ITERATIONS) {
        // Debounce the last iteration so that all of the animation frame
        // requests within the group have a chance to run
        clearTimeout(finalTimeout);
        finalTimeout = window.setTimeout(resolve, 1000);
      }
    }

    // IMPORTANT: Assuming a 60Hz display, SUB_LOOP_NAMES should not go beyond
    // two, because each subLoop request frame will be paused by a minimum of
    // 4ms, causing many "skippable" frames to not be skipped
    const SUB_LOOP_NAMES = ["a", "b"];

    for (loopIdx = 0; loopIdx < MAX_LOOP_ITERATIONS; loopIdx++) {
      for (let subLoopName of SUB_LOOP_NAMES) {
        // Sleep to not schedule multiple requestAnimationFrame requests in the
        // same event loop cycle
        await sleep(0);

        switch (type) {
          case LOOP_INTERVAL_TYPE_NATIVE_ANIMATION_FRAME:
            window.requestAnimationFrame(handleFrame);
            break;

          case LOOP_INTERVAL_TYPE_SKIPPABLE_ANIMATION_FRAME:
            // Create skippable frames across different groups
            requestSkippableAnimationFrame(
              handleFrame,
              `${subLoopName}-group}`
            );
            break;

          default:
            throw new Error(`Unknown loop type "${type}"`);
        }
      }
    }
  });

  const afterEnd = window.performance.now();

  return {
    numInvocations,
    duration: afterEnd - beforeStart,
  };
}
