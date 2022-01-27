const requestSkippableAnimationFrame = require("./requestSkippableAnimationFrame");
const { cancelAnimationFrameGroup, cancelAllAnimationFrameGroups } =
  requestSkippableAnimationFrame;

module.exports = requestSkippableAnimationFrame;

Object.assign(requestSkippableAnimationFrame, {
  cancelAnimationFrameGroup,
  cancelAllAnimationFrameGroups,

  detectMonitorRefreshRate: require("./utils/detectMonitorRefreshRate"),
});
