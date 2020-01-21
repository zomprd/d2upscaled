import * as ECSA from '../../libs/pixi-component';

export class Interpolation {
  static linear: any = (current: number, start: number, length: number) => Math.min(1, Math.max(0, (current - start) / length));

  static easeinout: any = (current: number, start: number, length: number) => {
    let pos = Interpolation.linear(current, start, length);
    let posInt = pos < 0.5 ? 2 * pos * pos : -1 + (4 - 2 * pos) * pos;
    return Math.min(1, Math.max(0, posInt));
  }

  static quadraticEaseIn: any = (current: number, start: number, length: number) => {
    let pos = Interpolation.linear(current, start, length);
    let posInt = pos * pos;
    return Math.min(1, Math.max(0, posInt));
  }

  static quadraticEaseOut: any = (current: number, start: number, length: number) => {
    let pos = Interpolation.linear(current, start, length);
    let posInt = 1 - (1 - pos) * (1 - pos);
    return Math.min(1, Math.max(0, posInt));
  }

  static quadraticEaseInOut: any = (current: number, start: number, length: number) => {
    let pos = Interpolation.linear(current, start, length);
    return pos < 0.5 ? (Interpolation.quadraticEaseIn(pos * 2, 0, 1) * 0.5) : (1 - Interpolation.quadraticEaseIn(2 - pos * 2, 0, 1) * 0.5);
  }

  static sineIn: any = (current: number, start: number, length: number) => {
    let pos = Interpolation.linear(current, start, length);
    let posInt = Math.sin(pos * Math.PI / 2);
    return Math.min(1, Math.max(0, posInt));
  }

  static sineOut: any = (current: number, start: number, length: number) => {
    let pos = Interpolation.linear(current, start, length);
    let posInt = Math.sin((1 - pos) * Math.PI / 2);
    return Math.min(1, Math.max(0, posInt));
  }

  static expoIn: any = (current: number, start: number, length: number) => {
    let pos = Interpolation.linear(current, start, length);
    let posInt = Math.pow(2, 10 * (pos - 1));
    return Math.min(1, Math.max(0, posInt));
  }
}

export class BaseAnimation extends ECSA.Component {
  protected duration = 0;
  protected goBack = false;
  protected goingBack = false;
  protected loops = 0;
  protected currentLoop = 0;
  protected startTime = 0;
  public interpolation: any = null;

  // loops = 0 for infinite!
  constructor(duration: number, goBack: boolean = false, loops: number = 1) {
    super();
    this.duration = duration;
    this.goBack = goBack;
    this.loops = loops;
    this.interpolation = Interpolation.linear;
  }

  onUpdate(delta: number, absolute: number) {
    if (this.startTime === 0) {
      this.startTime = absolute;
    }

    if (!this.goingBack) {
      // going forward
      let percent = this.interpolation(absolute, this.startTime, this.duration);
      this.applyAnim(percent, false);

      if (percent >= 1) {
        if (this.goBack) {
          this.goingBack = true;
          this.startTime = absolute;
        } else {
          this.finish();
        }
      }
    } else {
      // going back (only if goBack == true)
      let percent = this.interpolation(absolute, this.startTime, this.duration);
      this.applyAnim(percent, true);

      if (percent >= 1) {
        if (++this.currentLoop !== this.loops) {
          this.goingBack = !this.goingBack;
          this.startTime = absolute;
        } else {
          this.finish();
        }
      }
    }
  }

  protected applyAnim(percent: number, inverted: boolean) {
    // override in child classes
  }
}

export class TranslateAnimation extends BaseAnimation {
  protected srcPosX = 0;
  protected srcPosY = 0;
  protected targetPosX = 0;
  protected targetPosY = 0;

  constructor(srcPosX: number, srcPosY: number, targetPosX: number, targetPosY: number, duration: number, goBack: boolean = false, loops: number = 1) {
    super(duration, goBack, loops);
    this.srcPosX = srcPosX;
    this.srcPosY = srcPosY;
    this.targetPosX = targetPosX;
    this.targetPosY = targetPosY;
  }

  onInit() {
    super.onInit();
    this.owner.pixiObj.position.x = this.srcPosX;
    this.owner.pixiObj.position.y = this.srcPosY;
  }

  protected applyAnim(percent: number, inverted: boolean) {
    if (inverted) {
      this.owner.pixiObj.position.x = this.targetPosX + percent * (this.srcPosX - this.targetPosX);
      this.owner.pixiObj.position.y = this.targetPosY + percent * (this.srcPosY - this.targetPosY);
    } else {
      this.owner.pixiObj.position.x = this.srcPosX + percent * (this.targetPosX - this.srcPosX);
      this.owner.pixiObj.position.y = this.srcPosY + percent * (this.targetPosY - this.srcPosY);
    }
  }
}

export class RotationAnimation extends BaseAnimation {
  protected srcRot = 0;
  protected targetRot = 0;

  constructor(srcRot: number, targetRot: number, duration: number, goBack: boolean = false, loops: number = 1) {
    super(duration, goBack, loops);
    this.srcRot = srcRot;
    this.targetRot = targetRot;
  }

  onInit() {
    super.onInit();
    this.owner.pixiObj.rotation = this.srcRot;
  }

  protected applyAnim(percent: number, inverted: boolean) {
    if (inverted) {
      this.owner.pixiObj.rotation = this.targetRot + percent * (this.srcRot - this.targetRot);
    } else {
      this.owner.pixiObj.rotation = this.srcRot + percent * (this.targetRot - this.srcRot);
    }
  }
}
