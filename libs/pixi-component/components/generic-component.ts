import Message from '../engine/message';
import Component from '../engine/component';
import { QueryCondition, queryConditionCheck } from '../utils/query-condition';

interface MessageCaptureContext {
  onlyOnce: boolean;
  condition?: QueryCondition;
  handler: (cmp: Component, msg: Message) => void;
}

/**
 * Builder for generic components
 */
export class GenericComponent extends Component {
  private onInitFunc: (cmp: Component) => void = null;
  private onMessageHandlers = new Map<string, MessageCaptureContext>();
  private onMessageConditionalHandlers = new Map<string, Set<MessageCaptureContext>>();
  private onUpdateFunc: (cmp: Component, delta: number, absolute: number) => void = null;
  private onRemoveFunc: (cmp: Component) => void = null;
  private onFinishFunc: (cmp: Component) => void = null;
  protected timeout: number = 0;
  protected firstRun: number = 0;

  /**
   * Creates a new generic component
   * @param name name that will be used instead of class name within the scene
   */
  constructor(name: string) {
    super();
    this._name = name;
  }

  public get name() {
    return this._name;
  }

  /**
   * Registers a function that will be invoked for onInit()
   */
  doOnInit(func: (cmp: Component) => void): GenericComponent {
    this.onInitFunc = func;
    return this;
  }

  /**
   * Registers a function that will be invoked when a specific message arrives
   */
  doOnMessage(action: string, handler: (cmp: Component, msg: Message) => void): GenericComponent {
    this.onMessageHandlers.set(action, { handler: handler, onlyOnce: false });
    return this;
  }

  /**
   * Registers a function that will be invoked when a specific message arrives, but only once
   */
  doOnMessageOnce(action: string, handler: (cmp: Component, msg: Message) => void): GenericComponent {
    this.onMessageHandlers.set(action, { handler: handler, onlyOnce: true });
    return this;
  }

  /**
   * Registers a function that will be invoked when a specific message arrives and given conditions are met
   * Can be used to listen only for a group of objects
   */
  doOnMessageConditional(action: string, condition: QueryCondition, handler: (cmp: Component, msg: Message) => void) {
    if (!this.onMessageConditionalHandlers.has(action)) {
      this.onMessageConditionalHandlers.set(action, new Set());
    }
    this.onMessageConditionalHandlers.get(action).add({ onlyOnce: false, handler: handler, condition: condition });
    return this;
  }


  /**
   * Registers a function that will be invoked for onUpdate
   */
  doOnUpdate(func: (cmp: Component, delta: number, absolute: number) => void): GenericComponent {
    this.onUpdateFunc = func;
    return this;
  }

  /**
   * Registers a function that will be invoked for onRemove()
   */
  doOnRemove(func: (cmp: Component) => void): GenericComponent {
    this.onRemoveFunc = func;
    return this;
  }

  /**
   * Registers a function that will be invoked for onFinish()
   */
  doOnFinish(func: (cmp: Component) => void): GenericComponent {
    this.onFinishFunc = func;
    return this;
  }

  setFrequency(frequency: number): GenericComponent {
    this.frequency = frequency;
    return this;
  }

  /**
   * Sets timeout for how long this component should run
   */
  setTimeout(timeout: number): GenericComponent {
    this.timeout = timeout;
    return this;
  }

  onInit() {
    if (this.onInitFunc != null) {
      this.onInitFunc(this);
    }

    // register all messages
    for (let [key] of this.onMessageHandlers) {
      this.subscribe(key);
    }
    for (let [key] of this.onMessageConditionalHandlers) {
      this.subscribe(key);
    }
  }

  onMessage(msg: Message) {
    if (this.onMessageHandlers.has(msg.action)) {
      let handler = this.onMessageHandlers.get(msg.action);
      handler.handler(this, msg); // invoke handler
      if (handler.onlyOnce) { // if true, the handler should be invoked only once
        this.onMessageHandlers.delete(msg.action);
        this.unsubscribe(msg.action);
      }
    }

    if (this.onMessageConditionalHandlers.has(msg.action)) {
      let set = this.onMessageConditionalHandlers.get(msg.action);
      for (let handler of set) {
        if (msg.gameObject && queryConditionCheck(msg.gameObject, handler.condition)) {
          handler.handler(this, msg);
        }
      }
    }
  }

  onUpdate(delta: number, absolute: number) {
    if (this.firstRun === 0) {
      this.firstRun = absolute;
    }
    if (this.timeout !== 0 && (absolute - this.firstRun) >= this.timeout) {
      this.finish();
      return;
    }

    if (this.onUpdateFunc != null) {
      this.onUpdateFunc(this, delta, absolute);
    }
  }

  onRemove() {
    if (this.onRemoveFunc != null) {
      this.onRemoveFunc(this);
    }
  }

  onFinish() {
    if (this.onFinishFunc != null) {
      this.onFinishFunc(this);
    }
  }
}