import { UpdateInfo } from './update-info';

/**
 * Simple interpolation utility
 */
export class Interpolator {
  // number of ms after which updates are discarded and reinitialized
  public updateDelayThreshold = 10000;
  // number of frames that will be extrapolated
  public extrapolatedSamples = 2;

  // number of received messages
  private messagesReceived = 0;
  // initialization time
  private _initTime = 0;
  // previous message
  private previous: UpdateInfo;
  // current received message used for interpolation
  private current: UpdateInfo;
  // the most recent message
  private next: UpdateInfo;
  // speed of updates, set automatically according to the situation
  private _updateSpeed = 1;


  constructor() {
    this.reset();
  }

  get currentUpdate() {
    return this.current;
  }

  reset() {
    this.messagesReceived = 0;
    this._initTime = 0;
    this.previous = null;
    this.next = null;
    this._updateSpeed = 1;
    this.current = new UpdateInfo();
  }

  acceptUpdateMessage(msg: UpdateInfo) {
    if (!this.previous) {
      // set the first received message
      this._initTime = msg.time;
      this.messagesReceived = 1;
      this.previous = msg;
      this.current.time = msg.time;
    } else if (!this.next) {
      // set the second received message
      this.next = msg;
      this.messagesReceived++;
    } else {
      // third and so on...
      this.previous = this.next;
      this.next = msg;
      this.messagesReceived++;
    }
  }

  update(delta: number) {
    if (this.previous && this.next) {

      if (Math.abs(((this.current.time) - this.next.time)) > this.updateDelayThreshold) {
        // disconnected for a long time -> reset the algorithm
        this.current.time = this.next.time;
        this.messagesReceived = 1;
        this._initTime = this.next.time;
      }


      // calculate average interval between frames
      const averageFrameDiff = (Math.floor(this.next.time - this._initTime)) / (this.messagesReceived);

      // some random staff that actually works (somehow and sometimes)
      if ((this.current.time < this.next.time) || ((this.current.time - this.next.time) < (averageFrameDiff * this.extrapolatedSamples))) {

        // update current time only if we can keep up with the server
        this.current.time += delta * this._updateSpeed;

        if (this.current.time < this.previous.time) {
          // we are behind the current state . accelerate speed little bit
          if (this._updateSpeed < 2.5) {
            this._updateSpeed *= 1.1;
          }

        } else if (this.current.time > this.next.time) {
          // we have overcame the current state -> deccelerate speed little bit
          if (this._updateSpeed > 1.0) {
            this._updateSpeed /= 1.1;
          }
        } else {
          // converge to 1
          if (this._updateSpeed > 1) {
            this._updateSpeed /= 1.2;
          } else if (this._updateSpeed < 1) {
            this._updateSpeed *= 1.2;
          } else {
            this._updateSpeed = 1;
          }
        }

        const diffTotal = (this.next.time - this.previous.time);
        const diffActual = (this.current.time - this.previous.time);

        // calculate percentage position between previous and next frame
        const ratio = diffActual / diffTotal;

        // calculate current values based on linear interpolation
        for (let [key, val] of this.next.continuousValues) {
          let prevIt = this.previous.continuousValues.get(key);

          let nextVal = val;
          let prevVal = prevIt ? prevIt : nextVal;
          let currentVal = prevVal + (nextVal - prevVal) * ratio;

          // set the current interpolated value
          this.current.continuousValues.set(key, currentVal);
        }
      }
    }
  }
}