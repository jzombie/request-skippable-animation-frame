const test = require("tape");
const requestSkippableAnimationFrame = require("../src");

const sleep = (time) => new Promise((resolve) => setTimeout(resolve, time));

test("single event loop", async (t) => {
  t.plan(2);

  let renderIdx = -1;

  for (let i = 0; i < 100; i++) {
    requestSkippableAnimationFrame(() => {
      ++renderIdx;

      // NOTE: (jh) I didn't use a promise to resolve after rendering to ensure
      // that this frame rendering is only called once

      t.ok(true, "frame handler invoked");
    }, "unit");
  }

  // Wait for frame to render (1 second is generous but we want to ensure it
  // only renders once)
  await sleep(1000);

  t.equals(
    renderIdx,
    0,
    "subsequent calls only execute the frame handler once"
  );

  t.end();
});

// This test will ensure that the order of operations are in order of
// definition, multiple calls to the same group names are replaced with the
// final attempts, and errors are ignored
test("multiple group execution flow and silent errors", async (t) => {
  t.plan(5);

  let testString = "";

  await new Promise((resolve) => {
    // IMPORTANT: The first frame groups intentionally start off in reverse-
    // alphabetical order, then switch to alphabetical, to ensure that
    // alphanumeric ordering this does not affect the order of operations.  It
    // should be FIFO (first in / first out) instead.

    requestSkippableAnimationFrame(() => {
      testString +=
        "THIS WILL BE IGNORED BECAUSE THERE IS A SUBSEQUENT REQUEST FOR THIS GROUP NAME IN THIS EVENT LOOP CYCLE";
    }, "z");

    requestSkippableAnimationFrame(() => {
      testString += "hello ";
    }, "z");

    requestSkippableAnimationFrame(() => {
      t.equals(testString, "hello ");

      throw new Error("THIS SHOULD NOT STOP EXECUTION FLOW");
    }, "z1");

    requestSkippableAnimationFrame(() => {
      testString +=
        "THIS WILL BE IGNORED BECAUSE THERE IS A SUBSEQUENT REQUEST FOR THIS GROUP NAME IN THIS EVENT LOOP CYCLE";
    }, "b");

    requestSkippableAnimationFrame(() => {
      testString += "world ";
    }, "b");

    requestSkippableAnimationFrame(() => {
      t.equals(testString, "hello world ");

      throw new Error("THIS SHOULD NOT STOP EXECUTION FLOW");
    }, "b1");

    requestSkippableAnimationFrame(() => {
      testString +=
        "THIS WILL BE IGNORED BECAUSE THERE IS A SUBSEQUENT REQUEST FOR THIS GROUP NAME IN THIS EVENT LOOP CYCLE";
    }, "c");

    requestSkippableAnimationFrame(() => {
      testString += "foo ";
    }, "c");

    requestSkippableAnimationFrame(() => {
      t.equals(testString, "hello world foo ");

      throw new Error("THIS SHOULD NOT STOP EXECUTION FLOW");
    }, "c1");

    requestSkippableAnimationFrame(() => {
      testString +=
        "THIS WILL BE IGNORED BECAUSE THERE IS A SUBSEQUENT REQUEST FOR THIS GROUP NAME IN THIS EVENT LOOP CYCLE";
    }, "d");

    requestSkippableAnimationFrame(() => {
      testString += "bar";
    }, "d");

    requestSkippableAnimationFrame(() => {
      t.equals(testString, "hello world foo bar");

      throw new Error("THIS SHOULD NOT STOP EXECUTION FLOW");
    }, "d1");

    requestSkippableAnimationFrame(() => {
      testString +=
        "THIS WILL BE IGNORED BECAUSE THERE IS A SUBSEQUENT REQUEST FOR THIS GROUP NAME IN THIS EVENT LOOP CYCLE";
    }, "e");

    requestSkippableAnimationFrame(() => {
      resolve();
    }, "e");
  });

  t.equals(testString, "hello world foo bar");

  t.end();
});
