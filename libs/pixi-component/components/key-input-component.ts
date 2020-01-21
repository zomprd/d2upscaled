import Component from '../engine/component';

export enum Keys {
  KEY_LEFT = 37,
  KEY_UP = 38,
  KEY_RIGHT = 39,
  KEY_DOWN = 40,
  KEY_CTRL = 17,
  KEY_ALT = 18,
  KEY_SPACE = 32,
  KEY_SHIFT = 16,
  KEY_ENTER = 13,
  KEY_A = 65,
  KEY_B = 66,
  KEY_C = 67,
  KEY_D = 68,
  KEY_E = 69,
  KEY_F = 70,
  KEY_G = 71,
  KEY_H = 72,
  KEY_I = 73,
  KEY_J = 74,
  KEY_K = 75,
  KEY_L = 76,
  KEY_M = 77,
  KEY_N = 78,
  KEY_O = 79,
  KEY_P = 80,
  KEY_Q = 81,
  KEY_R = 82,
  KEY_S = 83,
  KEY_T = 84,
  KEY_U = 85,
  KEY_V = 86,
  KEY_W = 87,
  KEY_X = 88,
  KEY_Y = 89,
  KEY_Z = 90,
}

/**
 * Component for key-input handling
 */
export class KeyInputComponent extends Component {

  protected keys = new Set<number>();

  constructor() {
    super();
    this._name = KeyInputComponent.name;
  }

  onInit() {
    document.addEventListener('keyup', this.onKeyUp, false);
    document.addEventListener('keydown', this.onKeyDown, false);
  }

  onRemove() {
    document.removeEventListener('keyup', this.onKeyUp);
    document.removeEventListener('keydown', this.onKeyDown);
  }

  isKeyPressed(keyCode: number) {
    return this.keys.has(keyCode);
  }

  private onKeyDown = (evt: KeyboardEvent) => {
    this.keys.add(evt.keyCode);
  }

  private onKeyUp = (evt: KeyboardEvent) => {
    this.keys.delete(evt.keyCode);
  }
}