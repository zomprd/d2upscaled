import Component from '../engine/component';
import Message from '../engine/message';

export enum PointerMessages {
  POINTER_TAP = 'pointer-tap',
  POINTER_DOWN = 'pointer-down',
  POINTER_OVER = 'pointer-over',
  POINTER_RELEASE = 'pointer-release'
}

/**
 * Component that handles touch and mouse events and transforms them into messages
 * that can be subscribed by any other component
 */
export class PointerInputComponent extends Component {

  private lastTouch: Touch | MouseEvent = null;
  private handleClick: boolean;
  private handlePointerDown: boolean;
  private handlePointerOver: boolean;
  private handlePointerRelease: boolean;
  private messagesToSend: Message[];

  private timer = null;
  private down = false;

  constructor(handleClick: boolean = true, handlePointerDown: boolean = false, handlePointerOver: boolean = false, handlePointerRelease: boolean = false) {
    super();
    this.handleClick = handleClick;
    this.handlePointerDown = handlePointerDown;
    this.handlePointerOver = handlePointerOver;
    this.handlePointerRelease = handlePointerRelease;
  }

  onInit() {
    this.lastTouch = null;
    this.messagesToSend = [];

    let canvas = this.scene.app.view;

    canvas.addEventListener('touchstart', this.handleStart, false);
    canvas.addEventListener('touchend', this.handleEnd, false);
    canvas.addEventListener('mousedown', this.handleStart, false);
    if (this.handlePointerRelease || this.handleClick) {
      canvas.addEventListener('mouseup', this.handleEnd, false);
    }
    if (this.handlePointerOver) {
      canvas.addEventListener('mousemove', this.handleMove, false);
      canvas.addEventListener('touchmove', this.handleMove, false);
    }
  }

  onUpdate(delta: number, absolute: number) {
    for (let msg of this.messagesToSend) {
      this.scene.sendMessage(msg);
    }
    this.messagesToSend = [];
  }

  onFinish() {
    let canvas = this.scene.app.view;
    canvas.removeEventListener('touchstart', this.handleStart);
    canvas.removeEventListener('touchend', this.handleEnd);
    canvas.removeEventListener('mousedown', this.handleStart);

    if (this.handlePointerRelease || this.handleClick) {
      canvas.removeEventListener('mouseup', this.handleEnd);
    }

    if (this.handlePointerOver) {
      canvas.removeEventListener('mousemove', this.handleMove);
      canvas.removeEventListener('touchmove', this.handleMove);
      //canvas.removeEventListener('mousemove', this.handleStart);
      //canvas.removeEventListener('touchmove', this.handleStart);
    }
  }

  sendMessage(action: string, data: any = null) {
    // wait for next update loop to send all the messages
    this.messagesToSend.push(new Message(action, this, this.owner, data));
  }

  protected handleStart = (evt: TouchEvent | MouseEvent) => {
    clearInterval(this.timer);
    this.down = true;
    this.timer = setInterval(() => {
      evt.preventDefault();
      let isTouch = window.TouchEvent && evt instanceof TouchEvent;
      if (isTouch && (evt as TouchEvent).changedTouches.length === 1) {
        // only single-touch
        this.lastTouch = (evt as TouchEvent).changedTouches[0];
      } else {
        this.lastTouch = evt as MouseEvent;
      }

      if (this.handlePointerDown) {
        this.sendMessage(PointerMessages.POINTER_DOWN, {
          mousePos: this.getMousePos(this.scene.app.view, evt, isTouch),
          isTouch: isTouch
        });
      }
    }, 1000 / 600);
  }

  protected handleMove = (evt: TouchEvent) => {
    clearInterval(this.timer);
    evt.preventDefault();
    let isTouch = typeof (evt.changedTouches) !== 'undefined';
    /*this.sendMessage(PointerMessages.POINTER_OVER, {
      mousePos: this.getMousePos(this.scene.app.view, evt, isTouch),
      isTouch: isTouch
    });*/
    this.timer = setInterval(() => {
      if (this.down)
      this.sendMessage(PointerMessages.POINTER_DOWN, {
        mousePos: this.getMousePos(this.scene.app.view, evt, isTouch),
        isTouch: isTouch
      })}, 1000 / 600);
}

  protected handleEnd = (evt: TouchEvent | MouseEvent) => {
  clearInterval(this.timer);
  this.down = false;
  evt.preventDefault();
  let posX, posY;
  let isTouch = window.TouchEvent && evt instanceof TouchEvent;
  if (this.lastTouch != null) {
    if (isTouch && (evt as TouchEvent).changedTouches.length === 1) {
      posX = (evt as TouchEvent).changedTouches[0].pageX;
      posY = (evt as TouchEvent).changedTouches[0].pageY;

    } else {
      // mouse
      posX = (evt as MouseEvent).pageX;
      posY = (evt as MouseEvent).pageY;
    }

    // 10px tolerance should be enough
    if (Math.abs(this.lastTouch.pageX - posX) < 10 &&
      Math.abs(this.lastTouch.pageY - posY) < 10 && (isTouch || this.handleClick)) {
      // at last send the message to all subscribers about this event
      this.sendMessage(PointerMessages.POINTER_TAP, {
        mousePos: this.getMousePos(this.scene.app.view, evt, isTouch),
        isTouch: isTouch
      });
    } else {
      this.sendMessage(PointerMessages.POINTER_RELEASE, {
        mousePos: this.getMousePos(this.scene.app.view, evt, isTouch),
        isTouch: isTouch
      });
    }
  }
}

  // Get the mouse position
  protected getMousePos(canvas: HTMLCanvasElement, evt: TouchEvent | MouseEvent, isTouch: boolean) {
  let rect = canvas.getBoundingClientRect();
  let res = this.scene.app.renderer.resolution;
  let clientX = isTouch ? (evt as TouchEvent).changedTouches[0].clientX : (evt as MouseEvent).clientX;
  let clientY = isTouch ? (evt as TouchEvent).changedTouches[0].clientY : (evt as MouseEvent).clientY;
  return {
    posX: Math.round((clientX - rect.left) / (rect.right - rect.left) * this.scene.app.view.width / res),
    posY: Math.round((clientY - rect.top) / (rect.bottom - rect.top) * this.scene.app.view.height / res)
  };
}
}
