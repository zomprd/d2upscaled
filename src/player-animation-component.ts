import * as ECSA from '../libs/pixi-component';
import { MessageActions } from './game-enums-and-constants';

export default class PlayerAnimationComponent extends ECSA.Component {

    animations = {};

    currentQuality = 'fartface';
    currentMovement = 'NU';
    currentDirection = '0';

    onInit() {
        this.subscribe(MessageActions.SetPlayerMovement, MessageActions.SetPlayerDirection, MessageActions.Downscale, MessageActions.Upscale);
        let qualities = ['original', 'fartface', 'fatality'];
        let movements = ['NU', 'TW'];
        let directions = 16;

        qualities.forEach(quality => {
            movements.forEach(movement => {
                for (let direction = 0; direction < directions; direction++) {
                    this.loadAnimation(quality, movement, direction);
                }
            });
        });
        this.setCurrentAnimation();
    }

    onMessage(msg: ECSA.Message) {
        if (msg.action === MessageActions.Upscale) {
            this.currentQuality = 'fartface';
        }
        if (msg.action === MessageActions.Downscale) {
            this.currentQuality = 'original';
        }
        if (msg.action === MessageActions.SetPlayerMovement) {
            this.currentMovement = msg.data.movement;
        }
        if (msg.action === MessageActions.SetPlayerDirection) {
            this.currentDirection = msg.data.direction;
        }
        this.setCurrentAnimation();
    }

    setCurrentAnimation() {
        this.setAnimation(this.currentQuality, this.currentMovement, this.currentDirection);
    }

    loadAnimation(quality: string, movement: string, direction: number) {
        let spriteArray = [];
        let directionAsString = '';
        if (direction < 10) {
            directionAsString = '0';
        }
        directionAsString += direction.toString();
        for (let i = 0; i < 8; i++) {
            spriteArray.push(PIXI.Texture.from('asn-' + quality + '/AI' + movement + '1HS/d' + directionAsString + '_f00' + i + '.png'));
        }
        let asnAnimation = new PIXI.AnimatedSprite(spriteArray);
        if (quality === 'original') {
            asnAnimation.width *= 2;
            asnAnimation.height *= 2;
        }
        if (movement === 'TW') {
            asnAnimation.x = 27;
            asnAnimation.y = 9;
        }
        let key = quality + '-' + movement + '-' + direction;
        this.animations[key] = asnAnimation;
    }

    setAnimation(quality: string, movement: string, direction: string) {
        let asnAnimation = this.animations[quality + '-' + movement + '-' + direction];
        asnAnimation.animationSpeed = 0.25;
        asnAnimation.play();
        this.owner.removeChildren();
        this.owner.addChild(asnAnimation);
    }

}