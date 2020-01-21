import Message from './message';
import Scene from './scene';
import { Container } from './game-object';

/**
 * Component that defines a functional behavior of an entity which is attached to
 */
export default class Component {

  // owner object of this component
  owner: Container = null;
  // link to scene
  scene: Scene = null;
  // update frequency each second (0 is for each frame)
  frequency: number;
  removeWhenFinished = true;
  // number of last update, is set automatically by its owner
  _lastUpdate: number;
  _isFinished = false;
  private static idCounter = 0;


  // auto-incremented id
  protected _id = 0;
  protected _name: string;

  constructor() {
    this._id = Component.idCounter++;
    this.frequency = 0; // 0 is for each frame
    this._lastUpdate = 0;
  }

  public get id() {
    return this._id;
  }

  public get name() {
    return this._name || this.constructor.name;
  }

  public get isRunning() {
    return !this._isFinished;
  }

  public get isFinished() {
    return this._isFinished;
  }

  /**
   * Called when the component is being added to the scene
   */
  onInit() {
    // override
  }

  /**
   * Handles incoming message
   */
  onMessage(msg: Message) {
    // override
  }

  /**
   * Handles update loop
   */
  onUpdate(delta: number, absolute: number) {
    // override
  }

  /**
   * Called before removal from scene
   */
  onRemove() {
    // override
  }

  /**
   * Called after finish()
   */
  onFinish() {
    // override
  }

  /**
   * Subscribes itself as a listener for action with given key
   */
  subscribe(...actions: string[]) {
    for (let action of actions) {
      this.scene._subscribeComponent(action, this);
    }
  }

  /**
   * Unsubscribes itself
   */
  unsubscribe(action: string) {
    this.scene._unsubscribeComponent(action, this);
  }

  /**
   * Sends a message to all subscribers
   */
  sendMessage(action: string, data: any = null) {
    this.scene.sendMessage(new Message(action, this, this.owner, data));
  }

  /**
   * Detaches component from scene
   */
  finish() {
    if(this.isRunning && this.owner) {
      this.onFinish();
      this._isFinished = true;
      if(this.removeWhenFinished) {
        this.owner.removeComponent(this);
      }
    }
  }
}