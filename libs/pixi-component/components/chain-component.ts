import Message from '../engine/message';
import Component from '../engine/component';
import { Container } from '../engine/game-object';
import { QueryCondition, queryConditionCheck } from '../utils/query-condition';

const CMD_BEGIN_REPEAT = 1;
const CMD_END_REPEAT = 2;
const CMD_EXECUTE = 3;
const CMD_BEGIN_WHILE = 4;
const CMD_END_WHILE = 5;
const CMD_BEGIN_INTERVAL = 6;
const CMD_END_INTERVAL = 7;
const CMD_BEGIN_IF = 8;
const CMD_ELSE = 9;
const CMD_END_IF = 10;
const CMD_WAIT_TIME = 11;
const CMD_ADD_COMPONENT = 12;
const CMD_ADD_COMPONENT_AND_WAIT = 13;
const CMD_WAIT_FOR_FINISH = 14;
const CMD_WAIT_UNTIL = 15;
const CMD_WAIT_FRAMES = 16;
const CMD_WAIT_FOR_MESSAGE = 17;
const CMD_WAIT_FOR_MESSAGE_CONDITION = 18;
const CMD_REMOVE_COMPONENT = 19;
const CMD_REMOVE_GAME_OBJECTS_BY_QUERY = 20;
const CMD_REMOVE_GAME_OBJECT = 21;
const CMD_SET_INTERNAL_STATE = 22;
const CMD_ADD_COMPONENTS_AND_WAIT = 23;

// a function that doesn't return anything
interface Action<T> {
  (item: T): void;
}

// a function that has a return type
interface Func<T, TResult> {
  (item: T): TResult;
}


/**
 * Simple stack
 */
class Stack {
  protected topNode: ExNode = null;
  protected size = 0;

  constructor() {
    this.topNode = null;
    this.size = 0;
  }

  /**
   * Pushes a new node onto the stack
   */
  push(node: ExNode) {
    this.topNode = node;
    this.size += 1;
  }

  /**
   * Pops the current node from the stack
   */
  pop(): ExNode {
    let temp = this.topNode;
    this.topNode = this.topNode.previous;
    this.size -= 1;
    return temp;
  }

  /**
   * Returns the node on the top
   */
  top(): ExNode {
    return this.topNode;
  }
}

/**
 * Node for ChainComponent, represents a command context
 */
class ExNode {
  // key taken from CMD_XXX constants
  key = 0;
  // custom parameters
  param1: any = null;
  param2: any = null;
  param3: any = null;
  // cached custom parameters
  param1A: any = null;
  param2A: any = null;
  param3A: any = null;
  cached: boolean = false;
  // link to previous and next node
  next: ExNode = null;
  previous: ExNode = null;

  constructor(key: number, param1: any = null, param2: any = null, param3: any = null) {
    this.key = key;
    this.param1 = param1;
    this.param2 = param2;
    this.param3 = param3;

    this.param1A = null;
    this.param2A = null;
    this.param3A = null;
  }

  /**
   * Caches params or their results (if a corresponding parameter is a function) into param<num>A variables
   */
  cacheParams() {
    if (!this.cached) {
      if (this.param1 != null) {
        this.param1A = typeof (this.param1) === 'function' ? this.param1() : this.param1;
      }

      if (this.param2 != null) {
        this.param2A = typeof (this.param2) === 'function' ? this.param2() : this.param2;
      }

      if (this.param3 != null) {
        this.param3A = typeof (this.param3) === 'function' ? this.param3() : this.param3;
      }

      this.cached = true;
    }
  }

  /**
   * Gets result of param 1
   */
  getParam1() {
    if (!this.cached) {
      this.cacheParams();
    }
    return this.param1A;
  }

  setParam1(val: any) {
    this.param1A = val;
  }

  /**
   * Gets result of param 2
   */
  getParam2() {
    if (!this.cached) {
      this.cacheParams();
    }
    return this.param2A;
  }

  setParam2(val: any) {
    this.param2A = val;
  }

  /**
   * Gets result of param 3
   */
  getParam3() {
    if (!this.cached) {
      this.cacheParams();
    }
    return this.param3A;
  }

  setParam3(val: any) {
    this.param3A = val;
  }

  resetCache() {
    this.param1A = this.param2A = this.param3A = null;
    this.cached = false;
  }
}

/**
 * Component that executes a chain of commands during the update loop
 */
export default class ChainComponent extends Component {
  // stack of current scope
  protected scopeStack = new Stack();
  // current node
  protected current: ExNode = null;
  // linked list
  protected head: ExNode = null;
  protected tail: ExNode = null;
  // help parameters used for processing one node
  protected tmpParam: any = null;
  protected tmpParam2: any = null;

  // internal state of this component
  state: number;

  /**
   * Repeats the following part of the chain until endRepeat()
   * @param num number of repetitions, 0 for infinite loop; or function that returns that number
   */
  beginRepeat(param: number | Func<void, number>): ChainComponent {
    this.enqueue(CMD_BEGIN_REPEAT, param, param === 0);
    return this;
  }

  /**
   * Enclosing element for beginRepeat() command
   */
  endRepeat(): ChainComponent {
    this.enqueue(CMD_END_REPEAT);
    return this;
  }

  /**
   * Executes a closure
   * @param {action} func function to execute
   */
  execute(func: Action<ChainComponent>): ChainComponent {
    this.enqueue(CMD_EXECUTE, func);
    return this;
  }

  /**
   * Repeats the following part of the chain up to the endWhile()
   * till the func() keeps returning true
   * @param func function that returns either true or false
   */
  beginWhile(func: Func<void, boolean>): ChainComponent {
    this.enqueue(CMD_BEGIN_WHILE, func);
    return this;
  }

  /**
   * Enclosing command for beginWhile()
   */
  endWhile(): ChainComponent {
    this.enqueue(CMD_END_WHILE);
    return this;
  }

  /**
   * Starts an infinite loop that will repeat every num second
   * @param num number of seconds to wait or function that returns that number
   */
  beginInterval(num: number | Func<void, number>): ChainComponent {
    this.enqueue(CMD_BEGIN_INTERVAL, num);
    return this;
  }

  /**
   * Enclosing command for beginInterval()
   */
  endInterval(): ChainComponent {
    this.enqueue(CMD_END_INTERVAL);
    return this;
  }

  /**
   * Checks an IF condition returned by 'func' and jumps to the next element,
   * behind the 'else' element or behind the 'endIf' element, if the condition is not met
   * @param func function that returns either true or false
   */
  beginIf(func: Func<void, boolean>): ChainComponent {
    this.enqueue(CMD_BEGIN_IF, func);
    return this;
  }

  /**
   * Defines a set of commands that are to be executed if the condition of the current
   * beginIf() command is not met
   */
  else(): ChainComponent {
    this.enqueue(CMD_ELSE);
    return this;
  }

  /**
   * Enclosing command for beginIf()
   */
  endIf(): ChainComponent {
    this.enqueue(CMD_END_IF);
    return this;
  }

  /**
   * Adds a new component to a given game object (or to an owner if not specified)
   * @param component component or function that returns a component
   * @param gameObj game object or function that returns a game object
   */
  addComponent(component: Component | Func<void, Component>, gameObj: Container | Func<void, Container> = null): ChainComponent {
    this.enqueue(CMD_ADD_COMPONENT, component, gameObj);
    return this;
  }

  /**
   * Adds a new component to a given game object (or to an owner if not specified)
   * and waits until its finished
   * @param component component or function that returns a component
   * @param gameObj game object or function that returns a game object
   */
  addComponentAndWait(component: Component | Func<void, Component>, gameObj: Container | Func<void, Container> = null): ChainComponent {
    this.enqueue(CMD_ADD_COMPONENT_AND_WAIT, component, gameObj);
    return this;
  }

  /**
   * Adds a set of new components to a given game object (or to an owner if not specified)
   * and waits until all of them are finished
   * @param components list of components
   * @param gameObj game object or function that returns a game object
   */
  addComponentsAndWait(components: Component[], gameObj: Container | Func<void, Container> = null): ChainComponent {
    this.enqueue(CMD_ADD_COMPONENTS_AND_WAIT, components, gameObj);
    return this;
  }


  /**
   * Waits given amount of seconds
   * @param time number of seconds to wait; or function that returns this number
   */
  waitTime(time: number | Func<void, number>): ChainComponent {
    this.enqueue(CMD_WAIT_TIME, time);
    return this;
  }

  /**
   * Waits until given component isn't finished
   * @param component or function that returns this component
   */
  waitForFinish(component: Component | Func<void, Component>): ChainComponent {
    this.enqueue(CMD_WAIT_FOR_FINISH, component);
    return this;
  }

  /**
   * Waits until given function keeps returning true
   * @param func
   */
  waitUntil(func: Func<void, boolean>): ChainComponent {
    this.enqueue(CMD_WAIT_UNTIL, func);
    return this;
  }

  /**
   * Waits given number of iterations of update loop
   * @param num number of frames
   */
  waitFrames(num: number): ChainComponent {
    this.enqueue(CMD_WAIT_FRAMES, num);
    return this;
  }

  /**
   * Waits until a message with given key isn't sent
   * @param msg message key
   */
  waitForMessage(msg: string): ChainComponent {
    this.enqueue(CMD_WAIT_FOR_MESSAGE, msg);
    return this;
  }

  /**
   * Waits until a message with given key and a specific condition isn't sent
   */
  waitForMessageConditional(msg: string, condition: QueryCondition) {
    this.enqueue(CMD_WAIT_FOR_MESSAGE_CONDITION, msg, condition);
    return this;
  }

  /**
   * Removes component from given game object (or the owner if null)
   * @param cmp name of the component or the component itself
   * @param gameObj
   */
  removeComponent(cmp: string, gameObj: Container = null): ChainComponent {
    this.enqueue(CMD_REMOVE_COMPONENT, cmp, gameObj);
    return this;
  }

  /**
   * Removes game objects that meets given condition
   */
  removeGameObjectsByQuery(query: QueryCondition): ChainComponent {
    this.enqueue(CMD_REMOVE_GAME_OBJECTS_BY_QUERY, query);
    return this;
  }

  /**
   * Removes given game object
   * @param obj
   */
  removeGameObject(obj: Container): ChainComponent {
    this.enqueue(CMD_REMOVE_GAME_OBJECT, obj);
    return this;
  }

  /**
   * Sets an internal state of this component
   */
  setState(state: number): ChainComponent {
    this.enqueue(CMD_SET_INTERNAL_STATE, state);
    return this;
  }

  onMessage(msg: Message) {
    if(this.current && ((this.current.key === CMD_WAIT_FOR_MESSAGE && this.current.param1 === msg.action) || (
      this.current.key === CMD_WAIT_FOR_MESSAGE_CONDITION && this.current.param1 === msg.action &&
      queryConditionCheck(msg.gameObject, this.current.param2)))) {
      this.tmpParam2 = true; // set a flag that the message just arrived
    }
  }

  onUpdate(delta: number, absolute: number) {

    if(this.owner === null) {
      // one of the closures might have removed this component from its parent
      return;
    }

    if (this.current == null) {
      // take next item
      this.current = this.dequeue();
    }

    if (this.current == null) {
      // no more items -> finish
      this.finish();
      return;
    }

    switch (this.current.key) {
      case CMD_BEGIN_REPEAT:
        // push context and go to the next item
        this.current.cacheParams();
        this.scopeStack.push(this.current);
        this.gotoNextImmediately(delta, absolute);
        break;
      case CMD_END_REPEAT:
        // pop context and jump
        let temp = this.scopeStack.pop();

        temp.setParam1(temp.getParam1() - 1); // decrement number of repetitions
        if (temp.getParam2() === true || // infinite loop check
          temp.getParam1() > 0) {
          // jump to the beginning
          this.current = temp;
          this.onUpdate(delta, absolute);
        } else {
          // reset values to their original state
          temp.resetCache();
          this.gotoNextImmediately(delta, absolute);
        }
        break;
      case CMD_EXECUTE:
        // execute a function and go to the next item
        this.current.param1(this);
        this.gotoNextImmediately(delta, absolute);
        break;
      case CMD_BEGIN_WHILE:
        // push context and go to the next item
        this.scopeStack.push(this.current);
        this.gotoNextImmediately(delta, absolute);
        break;
      case CMD_END_WHILE:
        // pop contex and check condition
        let temp2 = this.scopeStack.pop();
        if (temp2.param1()) { // check condition inside while()
          // condition is true -> jump to the beginning
          this.current = temp2;
          this.onUpdate(delta, absolute);
        } else {
          // condition is false -> go to the next item
          this.gotoNextImmediately(delta, absolute);
        }
        break;
      case CMD_BEGIN_INTERVAL:
        if (!this.current.cached) {
          this.current.cacheParams();
        }
        if (this.tmpParam == null) {
          // save the time into a variable and wait to the next update cycle
          this.tmpParam = absolute;
        } else if ((absolute - this.tmpParam) >= this.current.getParam1()) {
          // push context and go to the next ite
          this.tmpParam = null;
          this.current.resetCache();
          this.scopeStack.push(this.current);
          this.gotoNextImmediately(delta, absolute);
        }
        break;
      case CMD_END_INTERVAL:
        // pop context and jump to the beginning
        this.current = this.scopeStack.pop();
        this.onUpdate(delta, absolute);
        break;
      case CMD_BEGIN_IF:
        if (this.current.param1()) {
          // condition met -> go to then ext item
          this.gotoNextImmediately(delta, absolute);
          break;
        }

        // condition not met -> we need to jump to the next ELSE or END-IF node
        let deepCounter = 1;
        while (true) {
          // search for the next node we might jump into
          this.current = this.dequeue();
          if (this.current.key === CMD_BEGIN_IF) {
            deepCounter++;
          }
          if (this.current.key === CMD_END_IF) {
            deepCounter--;
          }
          // we need to find the next ELSE of END of the current scope
          // thus, we have to skip all inner IF-ELSE branches
          if ((deepCounter === 1 && this.current.key === CMD_ELSE) ||
            deepCounter === 0 && this.current.key === CMD_END_IF) {
            this.gotoNext();
            break;
          }
        }
        this.onUpdate(delta, absolute);
        break;
      case CMD_ELSE:
        // jump to the first END_IF block of the current branch
        let deepCounter2 = 1;
        while (true) {
          this.current = this.dequeue();
          if (this.current.key === CMD_BEGIN_IF) {
            deepCounter2++;
          }
          if (this.current.key === CMD_END_IF) {
            deepCounter2--;
          }
          if (deepCounter2 === 0 && this.current.key === CMD_END_IF) {
            this.gotoNext();
            break;
          }
        }
        this.onUpdate(delta, absolute);
        break;
      case CMD_END_IF:
        // nothing to do here, just go to the next item
        this.gotoNextImmediately(delta, absolute);
        break;
      case CMD_WAIT_TIME:
        this.current.cacheParams();

        if (this.tmpParam == null) {
          // save the current time to a variable
          this.tmpParam = absolute;
        }

        if ((absolute - this.tmpParam) > this.current.getParam1()) {
          // it is time to go to the next item
          this.tmpParam = null;
          this.current.resetCache();
          this.gotoNextImmediately(delta, absolute);
        }
        break;
      case CMD_ADD_COMPONENT:
        // pop the object and its component, do the zamazingo thingy and go to the next item
        let gameObj = this.current.getParam2() != null ? this.current.getParam2() : this.owner;
        gameObj.addComponent(this.current.getParam1());
        this.gotoNextImmediately(delta, absolute);
        break;
      case CMD_ADD_COMPONENT_AND_WAIT:
        if (!this.current.cached) {
          // add only once
          this.current.cacheParams();
          let gameObj = this.current.param2A != null ? this.current.param2A : this.owner;
          gameObj.addComponent(this.current.param1A);
        }
        // wait for finish
        if (!this.current.getParam1().isRunning) {
          this.tmpParam = null;
          this.current.resetCache();
          this.gotoNextImmediately(delta, absolute);
        }
        break;
        case CMD_ADD_COMPONENTS_AND_WAIT:
          if (!this.current.cached) {
            // add only once
            this.current.cacheParams();
            let gameObj = this.current.param2A != null ? this.current.param2A : this.owner;
            for(let component of this.current.param1A) {
              gameObj.addComponent(component);
            }
          }
          // wait for finish
          if (!(this.current.getParam1()).find(cmp => cmp.isRunning)) {
            this.tmpParam = null;
            this.current.resetCache();
            this.gotoNextImmediately(delta, absolute);
          }
          break;
      case CMD_WAIT_FOR_FINISH:
        // wait until isFinished is true
        if (!this.current.cached) {
          this.current.cacheParams();
        }
        if (!this.current.getParam1().isRunning) {
          this.current.resetCache();
          this.gotoNextImmediately(delta, absolute);
        }
        break;
      case CMD_WAIT_UNTIL:
        if (!this.current.param1()) {
          this.gotoNextImmediately(delta, absolute);
        }
        break;
      case CMD_WAIT_FRAMES:
        // wait given number of update cycles
        if (this.tmpParam == null) {
          this.tmpParam = 0;
        }

        if (++this.tmpParam > this.current.param1) {
          this.tmpParam = null;
          this.gotoNextImmediately(delta, absolute);
        }
        break;
      case CMD_WAIT_FOR_MESSAGE:
      case CMD_WAIT_FOR_MESSAGE_CONDITION:
        // tmpParam indicates that this component has already subscribed the message
        if (this.tmpParam === true) {
          if (this.tmpParam2 === true) { // tmpParam2 indicates that the message has already arrived
            // got message -> unsubscribe and proceed
            this.unsubscribe(this.current.param1);
            this.tmpParam = this.tmpParam2 = null;
            this.gotoNextImmediately(delta, absolute);
          }
        } else {
          // just subscribe and wait
          this.tmpParam = true;
          this.tmpParam2 = false;
          this.subscribe(this.current.param1);
        }
        break;
      case CMD_REMOVE_COMPONENT:
        // pop the object, the name of the component, remove it and go to the next item
        let gameObj2 = this.current.param2 != null ? this.current.param2 : this.owner;
        gameObj2.removeComponentByClass(this.current.param1);
        this.gotoNextImmediately(delta, absolute);
        break;
      case CMD_REMOVE_GAME_OBJECTS_BY_QUERY:
        let objects = this.scene.findObjectsByQuery(this.current.param1);
        for(let obj of objects) {
          obj.remove();
        }
        this.gotoNextImmediately(delta, absolute);
        break;
      case CMD_REMOVE_GAME_OBJECT:
        this.current.param1.remove();
        this.gotoNextImmediately(delta, absolute);
        break;
      case CMD_SET_INTERNAL_STATE:
        this.state = this.current.param1;
        this.gotoNextImmediately(delta, absolute);
        break;
    }
  }

  protected enqueue(key: number, param1: any = null, param2: any = null, param3: any = null) {
    let node = new ExNode(key, param1, param2, param3);

    if (this.current != null && this.current !== this.head) {
      // already running -> append to the current node
      let temp = this.current.next;
      this.current.next = node;
      node.next = temp;
      node.previous = this.current;
      temp.previous = node;
    } else {
      // not yet running -> append to the tail
      if (this.head == null) {
        this.head = this.tail = node;
      } else {
        this.tail.next = node;
        node.previous = this.tail;
        this.tail = node;
      }

      if (this.current == null) {
        this.current = this.head;
      }
    }
  }

  // dequeues a next node
  protected dequeue(): ExNode {
    if (this.current == null || this.current.next == null) {
      return null;
    } else {
      this.current = this.current.next;
    }
    return this.current;
  }

  // goes to the next node
  protected gotoNext() {
    this.current = this.current.next;
  }

  // goes to the next node and re-executes the update loop
  protected gotoNextImmediately(delta: number, absolute: number) {
    this.current = this.current.next;
    this.onUpdate(delta, absolute);
  }
}