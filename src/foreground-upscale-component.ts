import * as ECSA from '../libs/pixi-component';
import { MessageActions } from './game-enums-and-constants';

export default class ForegroundUpscaleComponent extends ECSA.Component {

    protected originalForeground: PIXI.Sprite;
    protected upscaledForeground: PIXI.Sprite;

    onInit() {
        this.subscribe(MessageActions.Upscale);
        this.subscribe(MessageActions.Downscale);
        this.originalForeground = PIXI.Sprite.from('bottom-panel-original');
        this.upscaledForeground = PIXI.Sprite.from('bottom-panel-upscaled');
        this.originalForeground.width *= 1.8;
        this.originalForeground.height *= 1.8;
        this.originalForeground.x = 0;
        this.originalForeground.y = 1080 - this.originalForeground.height;
        this.upscaledForeground.x = 0;
        this.upscaledForeground.y = 1080 - this.upscaledForeground.height;
        this.owner.addChild(this.originalForeground, this.upscaledForeground);
        this.originalForeground.visible = false;
    }

    onMessage(msg: ECSA.Message) {
        if (msg.action === MessageActions.Upscale) {
            this.upscaledForeground.visible = true;
            this.originalForeground.visible = false;
        } else {
            this.upscaledForeground.visible = false;
            this.originalForeground.visible = true;
        }
    }

}