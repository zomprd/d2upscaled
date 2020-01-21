import * as ECSA from '../libs/pixi-component';
import { MessageActions } from './game-enums-and-constants';

export default class EncampmentUpscaleComponent extends ECSA.Component {

    protected originalBackground: PIXI.Container;
    protected upscaledBackground: PIXI.Container;

    onInit() {
        this.subscribe(MessageActions.Upscale);
        this.subscribe(MessageActions.Downscale);
        this.originalBackground = <PIXI.Container>this.owner.getChildAt(1);
        this.upscaledBackground = <PIXI.Container>this.owner.getChildAt(0);
    }

    onMessage(msg: ECSA.Message) {
        if (msg.action === MessageActions.Upscale) {
            this.originalBackground.visible = false;
            this.upscaledBackground.visible = true;
        } else {
            this.originalBackground.visible = true;
            this.upscaledBackground.visible = false;
        }
    }

}