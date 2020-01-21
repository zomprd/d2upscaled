import * as ECSA from '../libs/pixi-component';
import { MessageActions } from './game-enums-and-constants';

export default class KeyboardInputComponent extends ECSA.Component {

    onUpdate() {
        let cmp = this.scene.stage.findComponentByName<ECSA.KeyInputComponent>(ECSA.KeyInputComponent.name);
        if (cmp.isKeyPressed(ECSA.Keys.KEY_O)) {
            this.sendMessage(MessageActions.Downscale);
        }
        if (cmp.isKeyPressed(ECSA.Keys.KEY_U)) {
            this.sendMessage(MessageActions.Upscale);
        }
    }
}