import * as ECSA from '../libs/pixi-component';
import ScaleButtonComponent from './scale-button-component';
import { Scale } from './game-enums-and-constants';

export default class ScaleButton extends ECSA.Container {

    constructor(scaleType: String) {
        super(scaleType + 'scale');
        this.assignAttribute('scale-type', scaleType);
        let graphics = new PIXI.Graphics();
        this.addChild(graphics);
        this.x = scaleType === Scale.Down ? 450 : 1245;
        this.y = 1010;

        let buttonText = scaleType === Scale.Down ? '[O]riginal' : '[U]pscale';
        let originalText = new PIXI.Text(buttonText);
        this.addChild(originalText);
        originalText.width = 200;
        originalText.height = 50;
        originalText.x = 10;
        originalText.y = 0;
        this.addComponent(new ScaleButtonComponent());
    }
}
