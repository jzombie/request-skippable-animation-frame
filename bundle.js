(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.requestSkippableAnimationFrame = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
/**
 * Frame render handlers associated to their frame group name. One handler per
 * group.
 *
 * @type {{key: string, value: Function}>}
 **/
let frameGroups = {};

/**
 * The pending ID associated with the window.requestAnimationFrame.
 *
 * Per this module's convention, if the value is set to -1, there is no pending
 * frame to render.
 *
 * @type {number}
 */
let pendingFrameId = -1;

/**
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/DOMHighResTimeStamp}
 *
 * @param {DOMHighResTimeStamp} timestamp A double-precision floating-point
 * value and set by the underlying requestAnimationFrameHandler. This value
 * represents how many milliseconds the DOM has been running prior to the
 * tick function being invoked. It does not include the amount of time the
 * tick handler takes to complete.
 * @return {void}
 */
function tick(timestamp) {
  pendingFrameId = -1;

  // FIXME: (jh) Implement pure array-based approach, if possible
  const groupNames = Object.keys(frameGroups);

  for (const groupName of groupNames) {
    const frameFunc = frameGroups[groupName];

    // IMPORTANT: This must come before frameFunc or frame-embedded calls to
    // requestSkippableAnimationFrame will delete themselves before they have
    // a chance to run
    delete frameGroups[groupName];

    // Ignore errors
    //
    // One frame's error shouldn't prevent the subsequent frames from
    // rendering
    try {
      frameFunc(timestamp);
    } catch (err) {
      console.error(err);
    }
  }
}

/**
 * Extends requestAnimationFrame with skippable "frame groups," where a
 * single render handler can be specified for a frame group at any given
 * time.
 *
 * Subsequent render handlers for any given frame group will replace the
 * previous render handler, thus making some of the render handlers
 * "skippable."
 *
 * NOTE: This render handler will exist until whichever condition occurs
 * first:
 *  - The requestAnimationFrame is rendered
 *  - A subsequent setFrameGroupHandler is invoked with the same group name
 *  - The frame group is cancelled
 *
 * @param {Function} frameFunc The function to execute when the screen renders
 * @param {string} groupName The group which the function should reside in
 */
function requestSkippableAnimationFrame(frameFunc, groupName) {
  // Register the frame function with the frame group
  frameGroups[groupName] = frameFunc;

  // If there is no pending animation frame, request one
  if (pendingFrameId === -1) {
    pendingFrameId = window.requestAnimationFrame(tick);
  }
}

/**
 * Prevents the given frame group from rendering if it is in a pending state.
 *
 * @param {string} groupName
 * @return {void}
 */
function cancelAnimationFrameGroup(groupName) {
  delete frameGroups[groupName];

  // Cancel scheduled animation frame if there are no pending frame groups
  if (pendingFrameId !== -1) {
    const pendingGroupNames = Object.keys(frameGroups);
    if (!pendingGroupNames.length) {
      window.cancelAnimationFrame(pendingFrameId);
    }
  }
}

/**
 * Prevents all pending animation frame groups from rendering.
 *
 * @return {void}
 */
function cancelAllAnimationFrameGroups() {
  frameGroups = {};
}

module.exports = requestSkippableAnimationFrame;

module.exports.cancelAnimationFrameGroup = cancelAnimationFrameGroup;
module.exports.cancelAllAnimationFrameGroups = cancelAllAnimationFrameGroups;

},{}],2:[function(require,module,exports){
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

},{}],3:[function(require,module,exports){
const requestSkippableAnimationFrame = require("./requestSkippableAnimationFrame");
const { cancelAnimationFrameGroup, cancelAllAnimationFrameGroups } =
  requestSkippableAnimationFrame;

module.exports = requestSkippableAnimationFrame;

Object.assign(requestSkippableAnimationFrame, {
  cancelAnimationFrameGroup,
  cancelAllAnimationFrameGroups,

  detectMonitorRefreshRate: require("./utils/detectMonitorRefreshRate"),
});

},{"./requestSkippableAnimationFrame":1,"./utils/detectMonitorRefreshRate":2}]},{},[3])(3)
});
