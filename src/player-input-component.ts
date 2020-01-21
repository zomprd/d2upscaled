import * as ECSA from '../libs/pixi-component';
import { MessageActions, Resolution } from './game-enums-and-constants';

export default class PlayerInputComponent extends ECSA.Component {

    characterFeetPosition: ECSA.Vector;

    onInit() {
        this.subscribe('pointer-down', 'pointer-tap');
        this.characterFeetPosition = new ECSA.Vector(Resolution.width / 2, Resolution.height / 2 + 20);
    }

    onMessage(msg: ECSA.Message) {
        if (msg.data.mousePos.posY > 1080 - 85) { // bottom ui panel
            return;
        }

        this.sendMessage(MessageActions.HideInventory);

        let xChange = msg.data.mousePos.posX - this.characterFeetPosition.x;
        let yChange = msg.data.mousePos.posY - this.characterFeetPosition.y;

        let moveToVector = new ECSA.Vector(xChange, yChange);
        let shiftedAngle = ((moveToVector.angle() * 16 / (2 * Math.PI)) + 12.5) % 16 - 0.5;
        let direction = Math.abs(Math.round(shiftedAngle));

        this.sendMessage(MessageActions.SetPlayerDirection, { direction: direction.toString() });
        this.sendMessage(MessageActions.SetPlayerMovement, { movement: 'TW' });
        this.sendMessage(MessageActions.MovePlayerBy, { x: xChange, y: yChange });
    }

}