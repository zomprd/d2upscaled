import * as ECSA from '../../pixi-component';
import * as Matter from 'matter-js';

/**
 * Options for MatterBody object
 */
export interface MatterBodyOptions {
  fillStyle?: number;
  strokeStyle?: number;
  strokeStyleWireframe?: number;
  strokeStyleAngle?: number;
  lineWidth?: number;
  showWireframes?: boolean;
  showAngleIndicator?: boolean;
  showAxes?: boolean;
}

/**
 * Wrapper for Matter-JS bodies
 */
export class MatterBody extends ECSA.Graphics {

  body: Matter.Body;
  world: Matter.World;
  options: MatterBodyOptions;

  constructor(tag: string = '', body: Matter.Body, world: Matter.World, options?: MatterBodyOptions) {
    super(tag);
    if(!body.parts) {
      throw new Error('Body.parts is undefined');
    }
    this.body = body;
    this.world = world;
    this.options = {
      fillStyle: (options && options.fillStyle) ? options.fillStyle : 0x1a1a0aff,
      strokeStyle: (options && options.strokeStyle) ? options.strokeStyle : 0xe9e66f,
      strokeStyleWireframe: (options && options.strokeStyleWireframe) ? options.strokeStyleWireframe : 0xacacac,
      strokeStyleAngle: (options && options.strokeStyleAngle) ? options.strokeStyleAngle : 0xd54d47,
      lineWidth: (options && options.lineWidth) ? options.lineWidth : 1,
      showWireframes: (options && options.showWireframes) ? options.showWireframes : true,
      showAngleIndicator: (options && options.showAngleIndicator) ? options.showAngleIndicator : true,
      showAxes: (options && options.showAxes) ? options.showAxes : false,
    };
    this.createBodyPrimitive();

    this.addComponent(new ECSA.GenericComponent('MatterSync').doOnUpdate((cmp, delta, absolute) => {
      // synchronize position and rotation
      if(!this.body.isStatic) {
        // static bodies have rotation hardcoded in their vertices
        this.rotation = this.body.angle;
      }
      this.position.x = this.body.position.x;
      this.position.y = this.body.position.y;
    }));
  }

  // render body
  protected createBodyPrimitive() {
    let fillStyle = this.options.fillStyle,
      strokeStyle = this.options.strokeStyle,
      strokeStyleAngle = this.options.strokeStyleAngle,
      strokeStyleWireframe = this.options.strokeStyleWireframe,
      part;


    // clear the primitive
    this.clear();

    // handle compound parts
    for (let k = this.body.parts.length > 1 ? 1 : 0; k < this.body.parts.length; k++) {
      part = this.body.parts[k];
      if (!this.options.showWireframes) {
        this.beginFill(fillStyle, 1);
        this.lineStyle(this.options.lineWidth, strokeStyle, 1);
      } else {
        this.lineStyle(this.options.lineWidth, strokeStyleWireframe, 1);
      }
      this.moveTo(part.vertices[0].x - this.body.position.x, part.vertices[0].y - this.body.position.y);

      for (let j = 1; j < part.vertices.length; j++) {
        this.lineTo(part.vertices[j].x - this.body.position.x, part.vertices[j].y - this.body.position.y);
      }

      this.lineTo(part.vertices[0].x - this.body.position.x, part.vertices[0].y - this.body.position.y);

      this.endFill();

      // angle indicator
      if (this.options.showAngleIndicator || this.options.showAxes) {
        this.beginFill(0, 0);
        this.lineStyle(1, strokeStyleAngle, 1);
        this.moveTo(part.position.x - this.body.position.x, part.position.y - this.body.position.y);
        this.lineTo(((part.vertices[0].x + part.vertices[part.vertices.length - 1].x) / 2 - this.body.position.x),
          ((part.vertices[0].y + part.vertices[part.vertices.length - 1].y) / 2 - this.body.position.y));

        this.endFill();
      }
    }
  }
}

/**
 * Options for MatterConstraint object
 */
export class MatterConstraintOptions {
  strokeStyle: string = '0x00FF00';
  lineWidth: number = 1;
}

/**
 * Wrapper for Matter-JS constraints
 */
export class MatterConstraint extends ECSA.Graphics {

  constraint: Matter.Constraint;
  world: Matter.World;
  options?: MatterConstraintOptions;

  constructor(tag: string = '', constraint: Matter.Constraint, world: Matter.World, options?: MatterConstraintOptions) {
    super(tag);
    this.constraint = constraint;
    this.world = world;
    this.options = options || new MatterConstraintOptions();
    this.renderPrimitive();

    this.addComponent(new ECSA.GenericComponent('MatterSync').doOnUpdate((cmp, delta, absolute) => {
      this.renderPrimitive(); // re-render at each udpate
    }));

  }

  // render constraint
  protected renderPrimitive() {
    let strokeStyle = PIXI.utils.string2hex(this.options.strokeStyle);


    // clear the primitive
    this.clear();

    let bodyA = this.constraint.bodyA,
      bodyB = this.constraint.bodyB,
      pointA = this.constraint.pointA,
      pointB = this.constraint.pointB;

    // render the constraint on every update, since they can change dynamically
    this.beginFill(0, 0);
    this.lineStyle(this.options.lineWidth, strokeStyle, 1);

    if (bodyA) {
      this.moveTo(bodyA.position.x + pointA.x, bodyA.position.y + pointA.y);
    } else {
      this.moveTo(pointA.x, pointA.y);
    }

    if (bodyB) {
      this.lineTo(bodyB.position.x + pointB.x, bodyB.position.y + pointB.y);
    } else if (pointB) {
      this.lineTo(pointB.x, pointB.y);
    }

    this.endFill();
  }
}