import * as ECSA from '../libs/pixi-component';
import { MessageActions } from './game-enums-and-constants';
import PIXISound from 'pixi-sound';

export default class PlayerMovementComponent extends ECSA.Component {

    moveBy = new ECSA.Vector(0, 0);
    stepLength = 5;
    soundFinished = true;

    onInit() {
        this.subscribe(MessageActions.MovePlayerBy);
        PIXISound.speed('step-sound', 1.5);
    }

    onMessage(msg: ECSA.Message) {
        this.moveBy = new ECSA.Vector(msg.data.x, msg.data.y);
    }

    onUpdate() {
        if (this.moveBy.magnitude() > this.stepLength) {
            const normalized = this.moveBy.normalize();
            const moveByThisStep = normalized.multiply(this.stepLength);
            this.moveOwnerAndRootBy(moveByThisStep);
            this.moveBy = this.moveBy.subtract(moveByThisStep);
            if (this.soundFinished) {
                this.soundFinished = false;                
                PIXISound.play('step-sound', () => this.soundFinished = true);
            }
        } else {
            this.moveOwnerAndRootBy(this.moveBy);
            this.moveBy = new ECSA.Vector(0, 0);
            this.sendMessage(MessageActions.SetPlayerMovement, {movement: 'NU'});
        }
    }

    moveOwnerAndRootBy(vector: ECSA.Vector) {
        this.owner.x += vector.x;
        this.owner.y += vector.y;
        this.scene.findObjectByName('root').x -= vector.x;
        this.scene.findObjectByName('root').y -= vector.y;
    }

}