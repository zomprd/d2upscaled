import * as ECSA from '../libs/pixi-component';
import EncampmentUpscaleComponent from './encampment-upscale-component';

export default class EncampmentBackground extends ECSA.Container {

    constructor() {
        super('encampment-background');
        let upscaledBackground = new PIXI.Container();
        for (let i = 0; i < 128; i++) {
            let mapFrame = PIXI.Sprite.from('encampment/cropped_' + i + '_rlt');
            mapFrame.x = (i % 16) * mapFrame.width;
            mapFrame.y = Math.floor(i / 16) * mapFrame.height;
            upscaledBackground.addChild(mapFrame);
        }
        this.addChild(upscaledBackground);

        let originalBackground = new PIXI.Container() as any;
        for (let i = 0; i < 8; i++) {
            let mapFrame = PIXI.Sprite.from('encampment_original/' + i + '.png');
            mapFrame.width *= 2;
            mapFrame.height *= 2;
            mapFrame.x = (i % 4) * mapFrame.width;
            mapFrame.y = Math.floor(i / 4) * mapFrame.height;
            originalBackground.addChild(mapFrame);
        }
        this.addChild(originalBackground);
        originalBackground.visible = false;
        this.addComponent(new EncampmentUpscaleComponent());
    }
}
