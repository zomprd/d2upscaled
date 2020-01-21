import * as ECSA from '../libs/pixi-component';
import EncampmentObjectAnimationComponent from './encampment-object-animation-component';

export default class EncampmentAnimatedObject extends ECSA.Container {

    constructor(x: number, y: number, animationKey: string, frames: number) {
        super();
        this.x = x;
        this.y = y;
        this.addComponent(new EncampmentObjectAnimationComponent(animationKey, frames));
    }
}
