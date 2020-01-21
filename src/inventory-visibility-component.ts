import * as ECSA from '../libs/pixi-component';
import { MessageActions } from './game-enums-and-constants';

export default class InventoryVisibilityComponent extends ECSA.Component {

    protected ownerName: string;
    protected recentlyMadeVisible = false;

    constructor(ownerName: string) {
        super();
        this.ownerName = ownerName;
    }

    onInit() {
        this.subscribe(MessageActions.ShowInventory, MessageActions.HideInventory);
    }

    onMessage(msg: ECSA.Message) {
        if (msg.action === MessageActions.ShowInventory) {
            if (msg.data.owner === this.ownerName) {
                this.owner.visible = true;
                this.recentlyMadeVisible = true;
                setTimeout(() => this.recentlyMadeVisible = false, 500);
            }
        } else {
            if (!this.recentlyMadeVisible) {
                this.owner.visible = false;
            }
        }
    }

}