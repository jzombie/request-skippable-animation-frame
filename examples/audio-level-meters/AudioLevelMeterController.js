let renderIdx = -1;

/**
 * Adapted from:
 * @see https://raw.githubusercontent.com/tomnomnom/vumeter/master/vumeter.js
 */
class AudioLevelMeterController {
  constructor(elem, frameGroupName, config = {}) {
    // Settings
    this._max = config.max || 100;
    this._boxCount = config.boxCount || 10;
    this._boxCountRed = config.boxCountRed || 2;
    this._boxCountYellow = config.boxCountYellow || 3;
    this._boxGapFraction = config.boxGapFraction || 0.2;
    this._jitter = config.jitter || 0.02;

    // Colors
    this._redOn = "rgba(255,47,30,0.9)";
    this._redOff = "rgba(64,12,8,0.9)";
    this._yellowOn = "rgba(255,215,5,0.9)";
    this._yellowOff = "rgba(64,53,0,0.9)";
    this._greenOn = "rgba(53,255,30,0.9)";
    this._greenOff = "rgba(13,64,8,0.9)";

    // Derived and starting values
    this._width = elem.width;
    this._height = elem.height;
    this._curVal = 0;

    // Gap between boxes and box height
    this._boxHeight =
      this._height /
      (this._boxCount + (this._boxCount + 1) * this._boxGapFraction);
    this._boxGapY = this._boxHeight * this._boxGapFraction;

    this._boxWidth = this._width - this._boxGapY * 2;
    this._boxGapX = (this._width - this._boxWidth) / 2;

    this._targetVal = 0;

    // Canvas starting state
    this._c = elem.getContext("2d");

    this._frameGroupName = frameGroupName;

    // Automatically start drawing
    this.draw();
  }

  // TODO: Document
  setValue(value) {
    this._targetVal = value;
  }

  // TODO: Implement
  /*
  destroy() {
    // window.cancelAnimationFrame
  }
  */

  // TODO: Document
  // Main draw loop
  draw() {
    window.requestSkippableAnimationFrame(
      () => this.draw(),
      this._frameGroupName
    );

    // or
    // window.requestAnimationFrame(() => this.draw());

    ++renderIdx;

    // Gradual approach
    if (this._curVal <= this._targetVal) {
      this._curVal += (this._targetVal - this._curVal) / 5;
    } else {
      this._curVal -= (this._curVal - this._targetVal) / 5;
    }

    // Apply jitter
    if (this._jitter > 0 && this._curVal > 0) {
      let amount = Math.random() * this._jitter * this._max;
      if (Math.random() > 0.5) {
        amount = -amount;
      }
      this._curVal += amount;
    }

    if (this._curVal < 0) {
      this._curVal = 0;
    }

    this._c.save();
    this._c.beginPath();
    this._c.rect(0, 0, this._width, this._height);
    this._c.fillStyle = "rgb(32,32,32)";
    this._c.fill();
    this._c.restore();
    this.drawBoxes(this._c, this._curVal);
  }

  // TODO: Document
  // Draw the boxes
  drawBoxes(c, val) {
    c.save();
    c.translate(this._boxGapX, this._boxGapY);
    for (let i = 0; i < this._boxCount; i++) {
      let id = this.getId(i);

      c.beginPath();
      if (this.isOn(id, val)) {
        c.shadowBlur = 10;
        c.shadowColor = this.getBoxColor(id, val);
      }
      c.rect(0, 0, this._boxWidth, this._boxHeight);
      c.fillStyle = this.getBoxColor(id, val);
      c.fill();
      c.translate(0, this._boxHeight + this._boxGapY);
    }
    c.restore();
  }

  // TODO: Document
  // Get the color of a box given it's ID and the current value
  getBoxColor(id, val) {
    // on colours
    if (id > this._boxCount - this._boxCountRed) {
      return this.isOn(id, val) ? this._redOn : this._redOff;
    }
    if (id > this._boxCount - this._boxCountRed - this._boxCountYellow) {
      return this.isOn(id, val) ? this._yellowOn : this._yellowOff;
    }
    return this.isOn(id, val) ? this._greenOn : this._greenOff;
  }

  // TODO: Document
  getId(index) {
    // The ids are flipped, so zero is at the top and
    // boxCount-1 is at the bottom. The values work
    // the other way around, so align them first to
    // make things easier to think about.
    return Math.abs(index - (this._boxCount - 1)) + 1;
  }

  // TODO: Document
  isOn(id, val) {
    // We need to scale the input value (0-max)
    // so that it fits into the number of boxes
    const maxOn = Math.ceil((val / this._max) * this._boxCount);

    return id <= maxOn;
  }
}

window.AudioLevelMeterController = AudioLevelMeterController;
