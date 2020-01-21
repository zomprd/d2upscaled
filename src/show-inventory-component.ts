import * as ECSA from '../libs/pixi-component';
import { MessageActions } from './game-enums-and-constants';

export default class ShowInventoryComponent extends ECSA.Component {

    inventoryOwner: string;

    constructor(inventoryOwner: string) {
        super();
        this.inventoryOwner = inventoryOwner;
    }

    onInit() {
        this.owner.interactive = true;
        this.owner.buttonMode = true;
        const onPointerDown = () => {
            this.sendMessage(MessageActions.ShowInventory, { owner: this.inventoryOwner });
        };
        this.owner.on('pointerdown', onPointerDown);
    }

}