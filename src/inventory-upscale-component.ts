import * as ECSA from '../libs/pixi-component';
import { MessageActions } from './game-enums-and-constants';

export default class InventoryUpscaleComponent extends ECSA.Component {

    onInit() {
        this.subscribe(MessageActions.Downscale, MessageActions.Upscale);
    }

    onMessage(msg: ECSA.Message) {
        if (msg.action === MessageActions.Upscale) {
            this.owner.getChildAt(0).visible = true;
            this.owner.getChildAt(1).visible = false;
        } else {
            this.owner.getChildAt(0).visible = false;
            this.owner.getChildAt(1).visible = true;
        }
    }

}