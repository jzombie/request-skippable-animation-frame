const test = require("tape");
const requestSkippableAnimationFrame = require("../src");

const { cancelAnimationFrameGroup, cancelAllAnimationFrameGroups } =
  requestSkippableAnimationFrame;

const sleep = (time) => new Promise((resolve) => setTimeout(resolve, time));

test("individual frame group cancellation", async (t) => {
  t.plan(3);

  t.doesNotThrow(
    () => cancelAnimationFrameGroup("some-invalid-group"),
    "does not throw if cancelling group which does not exist"
  );

  const { i1, i2 } = await new Promise(async (resolve) => {
    // Invocation counts of respective "i1-group" and "i2-group"
    // requestSkippableAnimationFrame handlers
    let i1 = 0;
    let i2 = 0;

    for (let i = 0; i < 100; i++) {
      // Important this should intentionally be slower than the monitor refresh
      // rate so we can be sure to render each [otherwise] skippable frame
      await sleep(25);

      // "i1-group" will not be cancelled
      requestSkippableAnimationFrame(() => {
        i1++;

        // Some browsers may get to 100 at this point, due to the async nature,
        // others may only get to 99
        if (i >= 99) {
          resolve({ i1, i2 });
        }
      }, "i1-group");

      // "i2-group" will be cancelled via cancelAnimationFrameGroup halfway
      // through the run
      requestSkippableAnimationFrame(() => {
        i2++;

        // Some browsers may get to 100 at this point, due to the async nature,
        // others may only get to 99
        if (i >= 99) {
          throw new Error("i2-group was not cancelled!");
        }
      }, "i2-group");

      if (i > 50) {
        cancelAnimationFrameGroup("i2-group");
      }
    }
  });

  t.ok(i1 >= 99, "i1-group exceeds at least 99 invocations");
  t.equals(i2, 51, "i2-group is stopped at 51 invocations");

  t.end();
});

test("all frame group cancellation", async (t) => {
  t.plan(2);

  let i = 0;

  const handleFrame = () => {
    ++i;
  };

  await new Promise((resolve) => {
    requestSkippableAnimationFrame(() => {
      handleFrame();

      resolve();
    });
  });

  t.equals(i, 1, "i increments when handleFrame() is called");

  await Promise.race([
    new Promise((resolve) => {
      requestSkippableAnimationFrame(() => {
        handleFrame();

        resolve();
      }, "test-frame-group-1");
      requestSkippableAnimationFrame(() => {
        handleFrame();

        resolve();
      }, "test-frame-group-2");
      requestSkippableAnimationFrame(() => {
        handleFrame();

        resolve();
      }, "test-frame-group-3");
      requestSkippableAnimationFrame(() => {
        handleFrame();

        resolve();
      }, "test-frame-group-4");
    }),
    new Promise((resolve) => {
      cancelAllAnimationFrameGroups();

      setTimeout(resolve, 100);
    }),
  ]);

  t.equals(
    i,
    1,
    "cancelAllAnimationFrameGroups() prevents pending frames from rendering"
  );

  t.end();
});
