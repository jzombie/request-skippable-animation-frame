# request-skippable-animation-frame

TODO: Build out this documentation

Note to self: Experimented with d3-timer for this, and actually wound up with much higher CPU usage when running multiple audio meters
Borrowed idea from this article: https://blog.envylabs.com/loops-d3-timer-2c5f4313588

Additional note to self: This utility also consolidates multiple requestAnimationFrame requests into a single request.  That alone doesn't seem to be a big deal these days with browsers, as it seems they optimize for this pretty well internally, but it may lead into more control over how those frames are rendered, as well, so it could be useful for other things.

Additional note to self: Also includes utility to detect monitor refresh rate