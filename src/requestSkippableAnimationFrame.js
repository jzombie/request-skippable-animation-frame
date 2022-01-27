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
