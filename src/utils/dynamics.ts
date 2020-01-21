
import { Vector } from '../../libs/pixi-component';

/**
 * Storage for aceleration and velocity
 */
export default class Dynamics {
  aceleration: Vector;
  velocity: Vector;

  constructor(velocity: Vector = new Vector(0, 0), aceleration: Vector = new Vector(0, 0)) {
    this.velocity = velocity;
    this.aceleration = aceleration;
  }

  applyVelocity(delta: number, gameSpeed: number) {
    this.velocity = this.velocity.add(this.aceleration.multiply(delta * 0.001 * gameSpeed));
  }

  calcPositionChange(delta: number, gameSpeed: number): Vector {
    return this.velocity.multiply(delta * 0.001 * gameSpeed);
  }
}