import * as ECSA from '../libs/pixi-component';
import { MessageActions, Scale } from './game-enums-and-constants';

export default class ScaleButtonComponent extends ECSA.Component {

    graphics: PIXI.Graphics;

    onInit() {
        this.subscribe(MessageActions.Upscale);
        this.subscribe(MessageActions.Downscale);
        this.owner.interactive = true;
        this.owner.buttonMode = true;
        const onPointerDown =
            this.owner.getAttribute('scale-type') === Scale.Up
                ? () => { this.sendMessage(MessageActions.Upscale); this.onMessage(new ECSA.Message(MessageActions.Upscale)) }
                : () => { this.sendMessage(MessageActions.Downscale); this.onMessage(new ECSA.Message(MessageActions.Downscale)) };
        this.owner.on('pointerdown', onPointerDown);
        this.graphics = <PIXI.Graphics>this.owner.getChildAt(0);
    }

    onMessage(msg: ECSA.Message) {
        const messageScaleType = msg.action.slice(0, -5); // 'upscale' -> 'up', 'downscale' -> 'down'
        if (messageScaleType === this.owner.getAttribute('scale-type')) {
            this.redrawGraphicsWitchAlpha(0.5);
        } else {
            this.redrawGraphicsWitchAlpha(0.05);
        }
    }

    redrawGraphicsWitchAlpha(alpha: number) {
        this.graphics.clear();
        this.graphics.lineStyle(2, 0xb8a469, 1);
        this.graphics.beginFill(0xFFFFFF, alpha);
        this.graphics.drawRect(0, 0, 220, 60);
        this.graphics.endFill();
    }

}