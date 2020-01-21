import * as ECSA from '../libs/pixi-component';
import InventoryUpscaleComponent from './inventory-upscale-component';
import InventoryVisibilityComponent from './inventory-visibility-component';

export default class CharacterInventory extends ECSA.Container {

    constructor(character: string) {
        super(character + '-inventory');
        this.addChild(PIXI.Sprite.from('inv-' + character + '-upscaled'));
        const originalInv = PIXI.Sprite.from('inv-' + character + '-original');
        originalInv.width *= 1.8;
        originalInv.height *= 1.8;
        originalInv.visible = false;
        this.addChild(originalInv);
        if (character === 'player') {
            this.x = 1920-this.width;
        }
        this.visible = false;
        this.addComponent(new InventoryUpscaleComponent());
        this.addComponent(new InventoryVisibilityComponent(character));
    }
}
