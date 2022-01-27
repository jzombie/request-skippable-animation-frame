/**
 * Determines the approximate refresh cycles per second (Hertz / Hz) of the
 * display monitor / hardware.
 *
 * Accuracy will potentially be largely affected by the amount of work the
 * computer is doing in parallel to this function being run.
 *
 * @return {Promise<number>} Display Hz (i.e. 60 for "60 Hz")
 */
module.exports = async function detectMonitorRefreshRate() {
  const startTime = window.performance.now();

  const frameCount = await new Promise((resolve) => {
    // Takes into consideration potentially higher Hz than 60, as performing
    // multiple runs to potentially determine a better average approximation
    const ITERATIONS = 60 * 4;

    let frameCount = 0;

    let frameId = null;

    function iterate() {
      frameId = window.requestAnimationFrame(iterate);

      ++frameCount;

      if (frameCount === ITERATIONS) {
        window.cancelAnimationFrame(frameId);

        resolve(frameCount);
      }
    }

    iterate();
  });

  const endTime = window.performance.now();

  // Average out the number of frames rendered per second
  return Math.floor((frameCount / (endTime - startTime)) * 1000);
};
