import Component from './component';
import Scene from './scene';
import { GameObject, Container } from './game-object';
import Flags from './flags';


/**
 * Game entity that aggregates generic attributes and components
 * Is used as a proxy by objects directly inherited from PIXI objects
 */
export default class GameObjectProxy {
  private static idCounter = 0;

  // auto-incremented identifier
  protected _id = 0;
  // state of this object
  protected _stateId = 0;
  // game object this proxy is attached to
  protected _pixiObj: Container = null;
  // link to scene
  protected _scene: Scene = null;
  // collection of tags
  protected _tags: Set<string> = new Set();
  // bit-array of flags
  protected flags = new Flags();
  // set of all components, mapped by their id
  protected components = new Map<number, Component>();
  // generic attributse
  protected attributes: Map<string, any> = new Map<string, any>();
  // list of components that will be added at the end of update loop
  protected componentsToAdd = new Array<Component>();

  constructor(name: string, pixiObj: Container) {
    this._id = GameObjectProxy.idCounter++;
    this._pixiObj = pixiObj;
    this._pixiObj.name = name;
  }

  public get id() {
    return this._id;
  }

  public get pixiObj() {
    return this._pixiObj;
  }

  public get scene() {
    return this._scene;
  }

  public set scene(scene: Scene) {
    this._scene = scene;
  }

  public get rawAttributes() {
    return this.attributes;
  }

  public get rawComponents() {
    return this.components;
  }

  public get tags() {
    return new Set(this._tags);
  }

  public get isOnScene() {
    return this.scene !== null;
  }

  public getAllFlags(): Set<number> {
    return this.flags.getAllFlags();
  }

  /**
   * Adds a new component
   */
  addComponent(component: Component, runInstantly: boolean = false) {
    if(runInstantly) {
      if(!this.isOnScene) {
        throw new Error('This object hasn\'t been added to the scene yet');
      }
      this.initComponent(component);
      component.onUpdate(this.scene.currentDelta, this.scene.currentAbsolute);
    } else {
      this.componentsToAdd.push(component);
    }
  }

  /**
   * Removes an existing component
   */
  removeComponent(component: Component) {
    if(component.isRunning) {
      component._isFinished = true;
      component.onFinish();
    }
    component.onRemove();
    component._lastUpdate = 0;
    component.owner = null;
    this.components.delete(component.id);
    if(this.isOnScene) {
      this.scene._onComponentRemoved(component, this);
    }
  }

  /**
   * Removes all components
   */
  removeAllComponents() {
    for (let [, cmp] of this.components) {
      this.removeComponent(cmp);
    }
  }

  /**
   * Tries to find a component by given class name
   */
  findComponentByName<T extends Component>(name: string): T {
    for (let [, cmp] of this.components) {
      if (cmp.name === name) {
        return cmp as T;
      }
    }
    return null;
  }

  /**
   * Inserts a new attribute or modifies an existing one
   */
  assignAttribute(key: string, val: any) {
    if(!this.attributes.has(key)) {
      // new attribute
      this.attributes.set(key, val);
      if(this.isOnScene) {
        this.scene._onAttributeAdded(key, val, this);
      }
    } else {
      // replacing existing attribute
      let previous = this.attributes.get(key);
      this.attributes.set(key, val);
      if(this.isOnScene) {
        this.scene._onAttributeChanged(key, previous, val, this);
      }
    }
  }

  /**
   * Gets an attribute by its key
   */
  getAttribute<T>(key: string): T {
    return this.attributes.get(key);
  }

  /**
   * Removes an existing attribute
   */
  removeAttribute(key: string): boolean {
    if(this.attributes.has(key)) {
      let val = this.attributes.get(key);
      this.attributes.delete(key);
      if(this.isOnScene) {
        this.scene._onAttributeRemoved(key, val, this);
      }
      return true;
    }
    return false;
  }

  /**
   * Add a new tag
   */
  addTag(tag: string) {
    this._tags.add(tag);
    if(this.isOnScene) {
      this.scene._onTagAdded(tag, this);
    }
  }

  /**
   * Removes tag
   */
  removeTag(tag: string) {
    if(this._tags.has(tag)) {
      this._tags.delete(tag);
      if(this.isOnScene) {
        this.scene._onTagRemoved(tag, this);
      }
    }
  }

  /**
   * Returns true if given tag is set
   */
  hasTag(tag: string): boolean {
    return this._tags.has(tag);
  }

  /**
   * Sets flag at given index
   */
  setFlag(flag: number) {
    this.flags.setFlag(flag);
    if(this.isOnScene) {
      this.scene._onFlagChanged(flag, true, this);
    }
  }

  /**
   * Resets flag at given index
   */
  resetFlag(flag: number) {
    this.flags.resetFlag(flag);
    if(this.isOnScene) {
      this.scene._onFlagChanged(flag, false, this);
    }
  }

  /**
   * Returns true, if a flag at given index is set
   */
  hasFlag(flag: number): boolean {
    return this.flags.hasFlag(flag);
  }

  /**
   * Inverts a flag at given index
   */
  invertFlag(flag: number) {
    this.flags.invertFlag(flag);
    if(this.isOnScene) {
      this.scene._onFlagChanged(flag, this.flags.hasFlag(flag), this);
    }
  }

  /**
   * Gets state of this object
   */
  get stateId(): number {
    return this._stateId;
  }

  /**
   * Sets state of this object
   */
  set stateId(state: number) {
    let previous = this.stateId;
    this._stateId = state;
    if(this.isOnScene) {
      this.scene._onStateChanged(previous, state, this);
    }
  }

  /**
   * Processes a new child
   */
  onChildAdded(object: GameObjectProxy) {
    this.scene._onObjectAdded(object);
  }

  /**
   * Processes a removed child
   */
  onChildRemoved(object: GameObjectProxy) {
    object.removeAllComponents();
    this.scene._onObjectRemoved(object);
  }

  update(delta: number, absolute: number) {
    // initialize all components from the previous loop
    this.initAllComponents();

    // update all my components
    for (let [, cmp] of this.components) {
      if(cmp.isRunning) {
        if(cmp.frequency === 0) { // update each frame
          cmp.onUpdate(delta, absolute);
          cmp._lastUpdate = absolute;
        } else if((absolute - cmp._lastUpdate) >= 1000/cmp.frequency) {
          let delta = cmp._lastUpdate === 0 ? 1000 / cmp.frequency : (absolute - cmp._lastUpdate);
          cmp.onUpdate(delta, absolute);
          cmp._lastUpdate = absolute; // update at given intervals
        }
      }
    }

    // update all my children
    for (let child of this.pixiObj.children) {
      let cmpChild = <GameObject><any>child;
      if (cmpChild && cmpChild._proxy) { // some object may be regular PIXI objects, not PIXICmp
        cmpChild._proxy.update(delta, absolute);
      }
    }
  }

  initAllComponents() {
    if(this.componentsToAdd.length !== 0) {
      this.componentsToAdd.forEach(cmp => this.initComponent(cmp));
      this.componentsToAdd = [];
    }
  }

  initComponent(component: Component) {
    if(!this.isOnScene) {
      throw new Error('The object must be on the scene before its components are initialized');
    }
    if(component.owner !== null) {
      throw new Error(`The component ${component.name}:${component.id} seems to already have a game object assigned!`);
    }
    component.owner = this.pixiObj;
    this.components.set(component.id, component);
    this.scene._onComponentAdded(component, this);
    component._isFinished = false;
    component.onInit();
  }
}