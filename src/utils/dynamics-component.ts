import * as ECSA from '../../libs/pixi-component';
import Dynamics from './dynamics';

/**
 * Component that updates position of an object
 */
export default class DynamicsComponent extends ECSA.Component {

  protected dynamics: Dynamics;
  protected gameSpeed: number;
  protected attrName: string;

  constructor(attrName: string, gameSpeed: number = 1) {
    super();
    this.attrName = attrName;
    this.gameSpeed = gameSpeed;
  }

  onInit() {
    this.dynamics = this.owner.getAttribute(this.attrName);
    if (this.dynamics == null) {
      // add an initial one
      this.dynamics = new Dynamics();
      this.owner.assignAttribute(this.attrName, this.dynamics);
    }
  }

  onUpdate(delta: number, absolute: number) {
    this.dynamics.applyVelocity(delta, this.gameSpeed);

    // calculate delta position
    let deltaPos = this.dynamics.calcPositionChange(delta, this.gameSpeed);
    this.owner.pixiObj.position.x += deltaPos.x;
    this.owner.pixiObj.position.y += deltaPos.y;

  }
}