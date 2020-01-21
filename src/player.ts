import * as ECSA from '../libs/pixi-component';
import PlayerMovementComponent from './player-movement-component';
import PlayerAnimationComponent from './player-animation-component';
import PlayerInputComponent from './player-input-component';
import { Resolution } from './game-enums-and-constants';

export default class Player extends ECSA.Container {

    constructor() {
        super('player');
        this.x = 5760 + Resolution.width / 2 - 107;
        this.y = 2060 + Resolution.height / 2 - 85;
        this.addComponent(new PlayerMovementComponent());
        this.addComponent(new PlayerAnimationComponent());
        this.addComponent(new PlayerInputComponent());
    }
}
