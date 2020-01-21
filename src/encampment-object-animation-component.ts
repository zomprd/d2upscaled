import * as ECSA from '../libs/pixi-component';
import { MessageActions } from './game-enums-and-constants';

export default class EncampmentObjectAnimationComponent extends ECSA.Component {

    animations = {};

    currentQuality = 'upscaled';
    animationKey;
    frames;

    constructor(animationKey: string, frames: number) {
        super();
        this.animationKey = animationKey;
        this.frames = frames;
    }

    onInit() {
        this.subscribe(MessageActions.Downscale, MessageActions.Upscale);
        let qualities = ['original', 'upscaled'];
        qualities.forEach(quality => {
            this.loadAnimation(quality);
        });
        this.setCurrentAnimation();
    }

    onMessage(msg: ECSA.Message) {
        if (msg.action === MessageActions.Upscale) {
            this.currentQuality = 'upscaled';
        }
        if (msg.action === MessageActions.Downscale) {
            this.currentQuality = 'original';
        }
        this.setCurrentAnimation();
    }

    setCurrentAnimation() {
        this.setAnimation(this.currentQuality);
    }

    loadAnimation(quality: string) {
        let spriteArray = [];
        for (let i = 0; i < this.frames; i++) {
            const frame = i < 10 ? '0' + i : i;
            spriteArray.push(PIXI.Texture.from('encobjs/' + quality + '/' + this.animationKey + 'HTH/f0' + frame + '.png'));
        }
        let animation = new PIXI.AnimatedSprite(spriteArray);
        if (quality === 'original') {
            animation.width *= 2;
            animation.height *= 2;
        }
        let key = quality;
        this.animations[key] = animation;
    }

    setAnimation(quality: string) {
        let newAnimation = this.animations[quality];
        newAnimation.animationSpeed = 0.25;
        newAnimation.play();
        this.owner.removeChildren();
        this.owner.addChild(newAnimation);
    }

}