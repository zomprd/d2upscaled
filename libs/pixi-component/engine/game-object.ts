import GameObjectProxy from './game-object-proxy';
import Component from './component';
import Scene from './scene';
import * as PIXI from 'pixi.js';


/**
 * PIXI object attached to the component architecture
 */
export interface GameObject {
  // unique identifier
  id: number;
  // name of the object
  name: string;
  // state of the object
  stateId: number;
  // wrapped pixi object
  pixiObj: PIXI.Container;
  // parent game object
  parentGameObject: GameObject;
  // scene
  scene: Scene;
  // Link to proxy object, <<<shouldn't be used from within any custom component>>>
  _proxy: GameObjectProxy;

  /*
  * Casts itself to container (works only if the object is an actual container!)
  */
  asContainer(): Container;

 /*
  * Casts itself to particle container (works only if the object is an actual particle container!)
  */
  asParticleContainer(): ParticleContainer;

 /*
  * Casts itself to Sprite (works only if the object is an actual sprite!)
  */
  asSprite(): Sprite;

  /*
  * Casts itself to TilingSprite (works only if the object is an actual tilingsprite!)
  */
  asTilingSprite(): TilingSprite;

  /*
   * Casts itself to Text (works only if the object is an actual text!)
   */
  asText(): Text;

  /*
   * Casts itself to BitmapText (works only if the object is an actual bitmap text!)
   */
  asBitmapText(): BitmapText;

  /*
   * Casts itself to Graphics (works only if the object is an actual graphics!)
   */
  asGraphics(): Graphics;

  /*
   * Casts itself to Mesh  (works only if the object is an actual Mesh!)
   */
   asMesh(): Mesh;

  /**
   * Adds a new component
   */
  addComponent(component: Component, runInstantly?: boolean): void;
  /**
   * Tries to find a component by its class
   */
  findComponentByName<T extends Component>(name: string): T;
  /**
   * Removes an existing component
   */
  removeComponent(component: Component): void;
  /**
   * Adds or changes generic attribute
   */
  assignAttribute(key: string, val: any): void;
  /**
   * Returns an attribute by its key
   */
  getAttribute<T>(key: string): T;
  /**
   * Removes an existing attribute
   * Returns true if the attribute was successfully removed
   */
  removeAttribute(key: string): boolean;
  /**
   * Add a new tag
   */
  addTag(tag: string);
  /**
   * Removes tag
   */
  removeTag(tag: string);
  /**
   * Returns true if given tag is set
   */
  hasTag(tag: string): boolean;
  /**
   * Sets flag at given index
   */
  setFlag(flag: number): void;
  /**
   * Resets flag at given index
   */
  resetFlag(flag: number): void;
  /**
   * Returns true, if there is a flag set at given index
   */
  hasFlag(flag: number): boolean;
  /**
   * Inverts a flag at given index
   */
  invertFlag(flag: number): void;
  /**
   * Removes itself from its parent
   */
  remove(): void;
}


/**
 * Wrapper for PIXI.Container
 */
export class Container extends PIXI.Container implements GameObject {
  _proxy: GameObjectProxy;

  constructor(name: string = '') {
    super();
    this._proxy = new GameObjectProxy(name, this);
  }

  get id(): number {
    return this._proxy.id;
  }

  get pixiObj(): PIXI.Container {
    return this;
  }

  get scene(): Scene {
    return this._proxy.scene;
  }

  get parentGameObject(): Container {
    return <Container><any>this.parent;
  }

  asContainer(): Container {
    return this;
  }

  asParticleContainer(): ParticleContainer {
    throw new Error('Can\'t cast this object to particle container!');
  }

  asSprite(): Sprite {
    throw new Error('Can\'t cast this object to sprite!');
  }

  asTilingSprite(): TilingSprite {
    throw new Error('Can\'t cast this object to tiling sprite!');
  }

  asText(): Text {
    throw new Error('Can\'t cast this object to text!');
  }

  asBitmapText(): BitmapText {
    throw new Error('Can\'t cast this object to bitmap text!');
  }

  asGraphics(): Graphics {
    throw new Error('Can\'t cast this object to graphics');
  }

  asMesh(): Mesh {
    throw new Error('Can\'t cast this object to mesh');
  }

  // overrides pixijs function
  addChild<T extends PIXI.DisplayObject[]>(
    ...children: T
  ): T[0] {
    let newChild = super.addChild(...children);
    for (let child of children) {
      let cmpObj = <GameObject><any>child;
      if (cmpObj && cmpObj._proxy) {
        this._proxy.onChildAdded(cmpObj._proxy);
      }
    }

    return newChild;
  }

  // overrides pixijs function
  addChildAt<T extends PIXI.DisplayObject>(child: T, index: number): T {
    let newChild = super.addChildAt(child, index);
    let cmpObj = <GameObject><any>newChild;
    if (cmpObj && cmpObj._proxy) {
      this._proxy.onChildAdded(cmpObj._proxy);
    }
    return newChild;
  }

  // overrides pixijs function
  removeChild<T extends PIXI.DisplayObject[]>(
    ...children: T
  ): T[0] {
    let removed = super.removeChild(...children);
    for (let child of children) {
      let cmpObj = <GameObject><any>child;
      if (cmpObj && cmpObj._proxy) {
        this._proxy.onChildRemoved(cmpObj._proxy);
      }
    }

    return removed;
  }

  // overrides pixijs function
  removeChildAt(index: number): PIXI.DisplayObject {
    let removed = super.removeChildAt(index);
    let cmpObj = <GameObject><any>removed;
    if (cmpObj && cmpObj._proxy) {
      this._proxy.onChildRemoved(cmpObj._proxy);
    }
    return removed;
  }

  // overrides pixijs function
  removeChildren(beginIndex?: number, endIndex?: number): PIXI.DisplayObject[] {
    let removed = super.removeChildren(beginIndex, endIndex);
    for (let removedObj of removed) {
      let cmpObj = <GameObject><any>removedObj;
      if (cmpObj && cmpObj._proxy) {
        this._proxy.onChildRemoved(cmpObj._proxy);
      }
    }
    return removed;
  }

  addComponent(component: Component, runInstantly: boolean = false) {
    this._proxy.addComponent(component, runInstantly);
  }
  findComponentByName<T extends Component>(name: string): T {
    return this._proxy.findComponentByName<T>(name);
  }
  removeComponent(component: Component) {
    this._proxy.removeComponent(component);
  }
  assignAttribute(key: string, val: any) {
    this._proxy.assignAttribute(key, val);
  }
  getAttribute<T>(key: string): T {
    return this._proxy.getAttribute<T>(key);
  }
  removeAttribute(key: string): boolean {
    return this._proxy.removeAttribute(key);
  }
  addTag(tag: string) {
    this._proxy.addTag(tag);
  }
  removeTag(tag: string) {
    this._proxy.removeTag(tag);
  }
  hasTag(tag: string): boolean {
    return this._proxy.hasTag(tag);
  }
  get tags() {
    return this._proxy.tags;
  }
  setFlag(flag: number) {
    this._proxy.setFlag(flag);
  }
  resetFlag(flag: number) {
    this._proxy.resetFlag(flag);
  }
  hasFlag(flag: number): boolean {
    return this._proxy.hasFlag(flag);
  }
  invertFlag(flag: number) {
    this._proxy.invertFlag(flag);
  }
  get stateId(): number {
    return this._proxy.stateId;
  }
  set stateId(state: number) {
    this._proxy.stateId = state;
  }
  remove() {
    this.parent.removeChild(this);
  }
}

/**
 * Wrapper for PIXI.ParticleContainer
 */
export class ParticleContainer extends PIXI.ParticleContainer implements GameObject {
  _proxy: GameObjectProxy;

  constructor(name: string = '') {
    super();
    this._proxy = new GameObjectProxy(name, this);
  }

  get id(): number {
    return this._proxy.id;
  }

  get pixiObj(): PIXI.Container {
    return this;
  }

  get scene(): Scene {
    return this._proxy.scene;
  }

  get parentGameObject(): Container {
    return <Container><any>this.parent;
  }

  asContainer(): Container {
    return this;
  }

  asParticleContainer(): ParticleContainer {
    return this;
  }

  asSprite(): Sprite {
    throw new Error('Can\'t cast this object to sprite!');
  }

  asTilingSprite(): TilingSprite {
    throw new Error('Can\'t cast this object to tiling sprite!');
  }

  asText(): Text {
    throw new Error('Can\'t cast this object to text!');
  }

  asBitmapText(): BitmapText {
    throw new Error('Can\'t cast this object to bitmap text!');
  }

  asGraphics(): Graphics {
    throw new Error('Can\'t cast this object to graphics');
  }

  asMesh(): Mesh {
    throw new Error('Can\'t cast this object to mesh');
  }

  // overrides pixijs function
  addChild<T extends PIXI.DisplayObject[]>(
    ...children: T
  ): T[0] {
    let newChild = super.addChild(...children);
    for (let child of children) {
      let cmpObj = <GameObject><any>child;
      if (cmpObj && cmpObj._proxy) {
        this._proxy.onChildAdded(cmpObj._proxy);
      }
    }

    return newChild;
  }

  // overrides pixijs function
  addChildAt<T extends PIXI.DisplayObject>(child: T, index: number): T {
    let newChild = super.addChildAt(child, index);
    let cmpObj = <GameObject><any>newChild;
    if (cmpObj && cmpObj._proxy) {
      this._proxy.onChildAdded(cmpObj._proxy);
    }
    return newChild;
  }

  // overrides pixijs function
  removeChild<T extends PIXI.DisplayObject[]>(
    ...children: T
  ): T[0] {
    let removed = super.removeChild(...children);
    for (let child of children) {
      let cmpObj = <GameObject><any>child;
      if (cmpObj && cmpObj._proxy) {
        this._proxy.onChildRemoved(cmpObj._proxy);
      }
    }

    return removed;
  }

  // overrides pixijs function
  removeChildAt(index: number): PIXI.DisplayObject {
    let removed = super.removeChildAt(index);
    let cmpObj = <GameObject><any>removed;
    if (cmpObj && cmpObj._proxy) {
      this._proxy.onChildRemoved(cmpObj._proxy);
    }
    return removed;
  }

  // overrides pixijs function
  removeChildren(beginIndex?: number, endIndex?: number): PIXI.DisplayObject[] {
    let removed = super.removeChildren(beginIndex, endIndex);
    for (let removedObj of removed) {
      let cmpObj = <GameObject><any>removedObj;
      if (cmpObj && cmpObj._proxy) {
        this._proxy.onChildRemoved(cmpObj._proxy);
      }
    }
    return removed;
  }

  addComponent(component: Component, runInstantly: boolean = false) {
    this._proxy.addComponent(component, runInstantly);
  }
  findComponentByName<T extends Component>(name: string): T {
    return this._proxy.findComponentByName<T>(name);
  }
  removeComponent(component: Component) {
    this._proxy.removeComponent(component);
  }
  assignAttribute(key: string, val: any) {
    this._proxy.assignAttribute(key, val);
  }
  getAttribute<T>(key: string): T {
    return this._proxy.getAttribute<T>(key);
  }
  removeAttribute(key: string): boolean {
    return this._proxy.removeAttribute(key);
  }
  addTag(tag: string) {
    this._proxy.addTag(tag);
  }
  removeTag(tag: string) {
    this._proxy.removeTag(tag);
  }
  hasTag(tag: string): boolean {
    return this._proxy.hasTag(tag);
  }
  get tags() {
    return this._proxy.tags;
  }
  setFlag(flag: number) {
    this._proxy.setFlag(flag);
  }
  resetFlag(flag: number) {
    this._proxy.resetFlag(flag);
  }
  hasFlag(flag: number): boolean {
    return this._proxy.hasFlag(flag);
  }
  invertFlag(flag: number) {
    this._proxy.invertFlag(flag);
  }
  get stateId(): number {
    return this._proxy.stateId;
  }
  set stateId(state: number) {
    this._proxy.stateId = state;
  }
  remove() {
    this.parent.removeChild(this);
  }
}

/**
 * Wrapper for PIXI.Graphics
 */
export class Graphics extends PIXI.Graphics implements GameObject {
  _proxy: GameObjectProxy;

  constructor(name: string = '') {
    super();
    this._proxy = new GameObjectProxy(name, this);
  }

  get id(): number {
    return this._proxy.id;
  }

  get pixiObj(): PIXI.Container {
    return this;
  }

  get scene(): Scene {
    return this._proxy.scene;
  }

  get parentGameObject(): Container {
    return <Container><any>this.parent;
  }

  asContainer(): Container {
    return this;
  }

  asParticleContainer(): ParticleContainer {
    throw new Error('Can\'t cast this object to particle container!');
  }

  asSprite(): Sprite {
    throw new Error('Can\'t cast this object to sprite!');
  }

  asTilingSprite(): TilingSprite {
    throw new Error('Can\'t cast this object to tiling sprite!');
  }

  asText(): Text {
    throw new Error('Can\'t cast this object to text!');
  }

  asBitmapText(): BitmapText {
    throw new Error('Can\'t cast this object to bitmap text!');
  }

  asGraphics(): Graphics {
    return this;
  }

  asMesh(): Mesh {
    throw new Error('Can\'t cast this object to mesh');
  }

  // overrides pixijs function
  addChild<T extends PIXI.DisplayObject[]>(
    ...children: T
  ): T[0] {
    let newChild = super.addChild(...children);
    for (let child of children) {
      let cmpObj = <GameObject><any>child;
      if (cmpObj && cmpObj._proxy) {
        this._proxy.onChildAdded(cmpObj._proxy);
      }
    }

    return newChild;
  }

  // overrides pixijs function
  addChildAt<T extends PIXI.DisplayObject>(child: T, index: number): T {
    let newChild = super.addChildAt(child, index);
    let cmpObj = <GameObject><any>newChild;
    if (cmpObj && cmpObj._proxy) {
      this._proxy.onChildAdded(cmpObj._proxy);
    }
    return newChild;
  }

  // overrides pixijs function
  removeChild<T extends PIXI.DisplayObject[]>(
    ...children: T
  ): T[0] {
    let removed = super.removeChild(...children);
    let cmpObj = <GameObject><any>removed;
    if (cmpObj && cmpObj._proxy) {
      this._proxy.onChildRemoved(cmpObj._proxy);
    }
    return removed;
  }

  // overrides pixijs function
  removeChildAt(index: number): PIXI.DisplayObject {
    let removed = super.removeChildAt(index);
    let cmpObj = <GameObject><any>removed;
    if (cmpObj && cmpObj._proxy) {
      this._proxy.onChildRemoved(cmpObj._proxy);
    }
    return removed;
  }

  // overrides pixijs function
  removeChildren(beginIndex?: number, endIndex?: number): PIXI.DisplayObject[] {
    let removed = super.removeChildren(beginIndex, endIndex);
    for (let removedObj of removed) {
      let cmpObj = <GameObject><any>removedObj;
      if (cmpObj && cmpObj._proxy) {
        this._proxy.onChildRemoved(cmpObj._proxy);
      }
    }
    return removed;
  }

  addComponent(component: Component, runInstantly: boolean = false) {
    this._proxy.addComponent(component, runInstantly);
  }
  findComponentByName<T extends Component>(name: string): T {
    return this._proxy.findComponentByName<T>(name);
  }
  removeComponent(component: Component) {
    this._proxy.removeComponent(component);
  }
  assignAttribute(key: string, val: any) {
    this._proxy.assignAttribute(key, val);
  }
  getAttribute<T>(key: string): T {
    return this._proxy.getAttribute<T>(key);
  }
  removeAttribute(key: string): boolean {
    return this._proxy.removeAttribute(key);
  }
  addTag(tag: string) {
    this._proxy.addTag(tag);
  }
  removeTag(tag: string) {
    this._proxy.removeTag(tag);
  }
  hasTag(tag: string): boolean {
    return this._proxy.hasTag(tag);
  }
  get tags() {
    return this._proxy.tags;
  }
  setFlag(flag: number) {
    this._proxy.setFlag(flag);
  }
  resetFlag(flag: number) {
    this._proxy.resetFlag(flag);
  }
  hasFlag(flag: number): boolean {
    return this._proxy.hasFlag(flag);
  }
  invertFlag(flag: number) {
    this._proxy.invertFlag(flag);
  }
  get stateId(): number {
    return this._proxy.stateId;
  }
  set stateId(state: number) {
    this._proxy.stateId = state;
  }
  remove() {
    this.parent.removeChild(this);
  }
}

/**
 * Wrapper for PIXI.Sprite
 */
export class Sprite extends PIXI.Sprite implements GameObject {
  _proxy: GameObjectProxy;

  constructor(name: string = '', texture?: PIXI.Texture) {
    super(texture);
    this._proxy = new GameObjectProxy(name, this);
  }

  get id(): number {
    return this._proxy.id;
  }

  get pixiObj(): PIXI.Container {
    return this;
  }

  get scene(): Scene {
    return this._proxy.scene;
  }

  get parentGameObject(): Container {
    return <Container><any>this.parent;
  }

  asContainer(): Container {
    return this;
  }

  asParticleContainer(): ParticleContainer {
    throw new Error('Can\'t cast this object to particle container!');
  }

  asSprite(): Sprite {
    return this;
  }

  asTilingSprite(): TilingSprite {
    throw new Error('Can\'t cast this object to tiling sprite!');
  }

  asText(): Text {
    throw new Error('Can\'t cast this object to text!');
  }

  asBitmapText(): BitmapText {
    throw new Error('Can\'t cast this object to bitmap text!');
  }

  asGraphics(): Graphics {
    throw new Error('Can\'t cast this object to graphics');
  }

  asMesh(): Mesh {
    throw new Error('Can\'t cast this object to mesh');
  }

  // overrides pixijs function
  addChild<T extends PIXI.DisplayObject[]>(
    ...children: T
  ): T[0] {
    let newChild = super.addChild(...children);
    for (let child of children) {
      let cmpObj = <GameObject><any>child;
      if (cmpObj && cmpObj._proxy) {
        this._proxy.onChildAdded(cmpObj._proxy);
      }
    }

    return newChild;
  }

  // overrides pixijs function
  addChildAt<T extends PIXI.DisplayObject>(child: T, index: number): T {
    let newChild = super.addChildAt(child, index);
    let cmpObj = <GameObject><any>newChild;
    if (cmpObj && cmpObj._proxy) {
      this._proxy.onChildAdded(cmpObj._proxy);
    }
    return newChild;
  }

  // overrides pixijs function
  removeChild<T extends PIXI.DisplayObject[]>(
    ...children: T
  ): T[0] {
    let removed = super.removeChild(...children);
    for (let child of children) {
      let cmpObj = <GameObject><any>child;
      if (cmpObj && cmpObj._proxy) {
        this._proxy.onChildRemoved(cmpObj._proxy);
      }
    }

    return removed;
  }

  // overrides pixijs function
  removeChildAt(index: number): PIXI.DisplayObject {
    let removed = super.removeChildAt(index);
    let cmpObj = <GameObject><any>removed;
    if (cmpObj && cmpObj._proxy) {
      this._proxy.onChildRemoved(cmpObj._proxy);
    }
    return removed;
  }

  // overrides pixijs function
  removeChildren(beginIndex?: number, endIndex?: number): PIXI.DisplayObject[] {
    let removed = super.removeChildren(beginIndex, endIndex);
    for (let removedObj of removed) {
      let cmpObj = <GameObject><any>removedObj;
      if (cmpObj && cmpObj._proxy) {
        this._proxy.onChildRemoved(cmpObj._proxy);
      }
    }
    return removed;
  }

  addComponent(component: Component, runInstantly: boolean = false) {
    this._proxy.addComponent(component, runInstantly);
  }
  findComponentByName<T extends Component>(name: string): T {
    return this._proxy.findComponentByName<T>(name);
  }
  removeComponent(component: Component) {
    this._proxy.removeComponent(component);
  }
  assignAttribute(key: string, val: any) {
    this._proxy.assignAttribute(key, val);
  }
  getAttribute<T>(key: string): T {
    return this._proxy.getAttribute<T>(key);
  }
  removeAttribute(key: string): boolean {
    return this._proxy.removeAttribute(key);
  }
  addTag(tag: string) {
    this._proxy.addTag(tag);
  }
  removeTag(tag: string) {
    this._proxy.removeTag(tag);
  }
  hasTag(tag: string): boolean {
    return this._proxy.hasTag(tag);
  }
  get tags() {
    return this._proxy.tags;
  }
  setFlag(flag: number) {
    this._proxy.setFlag(flag);
  }
  resetFlag(flag: number) {
    this._proxy.resetFlag(flag);
  }
  hasFlag(flag: number): boolean {
    return this._proxy.hasFlag(flag);
  }
  invertFlag(flag: number) {
    this._proxy.invertFlag(flag);
  }
  get stateId(): number {
    return this._proxy.stateId;
  }
  set stateId(state: number) {
    this._proxy.stateId = state;
  }
  remove() {
    this.parent.removeChild(this);
  }
}

/**
 * Wrapper for PIXI.Sprite
 */
export class TilingSprite extends PIXI.TilingSprite implements GameObject {
  _proxy: GameObjectProxy;

  constructor(name: string = '', texture?: PIXI.Texture, width?: number, height?: number) {
    super(texture, width, height);
    this._proxy = new GameObjectProxy(name, this);
  }

  get id(): number {
    return this._proxy.id;
  }

  get pixiObj(): PIXI.Container {
    return this;
  }

  get scene(): Scene {
    return this._proxy.scene;
  }

  get parentGameObject(): Container {
    return <Container><any>this.parent;
  }

  asContainer(): Container {
    return this;
  }

  asParticleContainer(): ParticleContainer {
    throw new Error('Can\'t cast this object to particle container!');
  }

  asSprite(): Sprite {
    return this;
  }

  asTilingSprite(): TilingSprite {
    return this;
  }

  asText(): Text {
    throw new Error('Can\'t cast this object to text!');
  }

  asBitmapText(): BitmapText {
    throw new Error('Can\'t cast this object to bitmap text!');
  }

  asGraphics(): Graphics {
    throw new Error('Can\'t cast this object to graphics');
  }

  asMesh(): Mesh {
    throw new Error('Can\'t cast this object to mesh');
  }

  // overrides pixijs function
  addChild<T extends PIXI.DisplayObject[]>(
    ...children: T
  ): T[0] {
    let newChild = super.addChild(...children);
    for (let child of children) {
      let cmpObj = <GameObject><any>child;
      if (cmpObj && cmpObj._proxy) {
        this._proxy.onChildAdded(cmpObj._proxy);
      }
    }

    return newChild;
  }

  // overrides pixijs function
  addChildAt<T extends PIXI.DisplayObject>(child: T, index: number): T {
    let newChild = super.addChildAt(child, index);
    let cmpObj = <GameObject><any>newChild;
    if (cmpObj && cmpObj._proxy) {
      this._proxy.onChildAdded(cmpObj._proxy);
    }
    return newChild;
  }

  // overrides pixijs function
  removeChild<T extends PIXI.DisplayObject[]>(
    ...children: T
  ): T[0] {
    let removed = super.removeChild(...children);
    for (let child of children) {
      let cmpObj = <GameObject><any>child;
      if (cmpObj && cmpObj._proxy) {
        this._proxy.onChildRemoved(cmpObj._proxy);
      }
    }

    return removed;
  }

  // overrides pixijs function
  removeChildAt(index: number): PIXI.DisplayObject {
    let removed = super.removeChildAt(index);
    let cmpObj = <GameObject><any>removed;
    if (cmpObj && cmpObj._proxy) {
      this._proxy.onChildRemoved(cmpObj._proxy);
    }
    return removed;
  }

  // overrides pixijs function
  removeChildren(beginIndex?: number, endIndex?: number): PIXI.DisplayObject[] {
    let removed = super.removeChildren(beginIndex, endIndex);
    for (let removedObj of removed) {
      let cmpObj = <GameObject><any>removedObj;
      if (cmpObj && cmpObj._proxy) {
        this._proxy.onChildRemoved(cmpObj._proxy);
      }
    }
    return removed;
  }

  addComponent(component: Component, runInstantly: boolean = false) {
    this._proxy.addComponent(component, runInstantly);
  }
  findComponentByName<T extends Component>(name: string): T {
    return this._proxy.findComponentByName<T>(name);
  }
  removeComponent(component: Component) {
    this._proxy.removeComponent(component);
  }
  assignAttribute(key: string, val: any) {
    this._proxy.assignAttribute(key, val);
  }
  getAttribute<T>(key: string): T {
    return this._proxy.getAttribute<T>(key);
  }
  removeAttribute(key: string): boolean {
    return this._proxy.removeAttribute(key);
  }
  addTag(tag: string) {
    this._proxy.addTag(tag);
  }
  removeTag(tag: string) {
    this._proxy.removeTag(tag);
  }
  hasTag(tag: string): boolean {
    return this._proxy.hasTag(tag);
  }
  get tags() {
    return this._proxy.tags;
  }
  setFlag(flag: number) {
    this._proxy.setFlag(flag);
  }
  resetFlag(flag: number) {
    this._proxy.resetFlag(flag);
  }
  hasFlag(flag: number): boolean {
    return this._proxy.hasFlag(flag);
  }
  invertFlag(flag: number) {
    this._proxy.invertFlag(flag);
  }
  get stateId(): number {
    return this._proxy.stateId;
  }
  set stateId(state: number) {
    this._proxy.stateId = state;
  }
  remove() {
    this.parent.removeChild(this);
  }
}

/**
 * Wrapper for PIXI.Text
 */
export class Text extends PIXI.Text implements GameObject {
  _proxy: GameObjectProxy;

  constructor(name: string = '', text: string = '') {
    super(text);
    this._proxy = new GameObjectProxy(name, this);
  }

  get id(): number {
    return this._proxy.id;
  }

  get pixiObj(): PIXI.Container {
    return this;
  }

  get scene(): Scene {
    return this._proxy.scene;
  }

  get parentGameObject(): Container {
    return <Container><any>this.parent;
  }

  asContainer(): Container {
    return this;
  }

  asParticleContainer(): ParticleContainer {
    throw new Error('Can\'t cast this object to particle container!');
  }

  asSprite(): Sprite {
    return this;
  }

  asTilingSprite(): TilingSprite {
    throw new Error('Can\'t cast this object to tiling sprite!');
  }

  asText(): Text {
    return this;
  }

  asBitmapText(): BitmapText {
    throw new Error('Can\'t cast this object to bitmap text!');
  }

  asGraphics(): Graphics {
    throw new Error('Can\'t cast this object to graphics');
  }

  asMesh(): Mesh {
    throw new Error('Can\'t cast this object to mesh');
  }

  // overrides pixijs function
  addChild<T extends PIXI.DisplayObject[]>(
    ...children: T
  ): T[0] {
    let newChild = super.addChild(...children);
    for (let child of children) {
      let cmpObj = <GameObject><any>child;
      if (cmpObj && cmpObj._proxy) {
        this._proxy.onChildAdded(cmpObj._proxy);
      }
    }

    return newChild;
  }

  // overrides pixijs function
  addChildAt<T extends PIXI.DisplayObject>(child: T, index: number): T {
    let newChild = super.addChildAt(child, index);
    let cmpObj = <GameObject><any>newChild;
    if (cmpObj && cmpObj._proxy) {
      this._proxy.onChildAdded(cmpObj._proxy);
    }
    return newChild;
  }

  // overrides pixijs function
  removeChild<T extends PIXI.DisplayObject[]>(
    ...children: T
  ): T[0] {
    let removed = super.removeChild(...children);
    for (let child of children) {
      let cmpObj = <GameObject><any>child;
      if (cmpObj && cmpObj._proxy) {
        this._proxy.onChildRemoved(cmpObj._proxy);
      }
    }

    return removed;
  }

  // overrides pixijs function
  removeChildAt(index: number): PIXI.DisplayObject {
    let removed = super.removeChildAt(index);
    let cmpObj = <GameObject><any>removed;
    if (cmpObj && cmpObj._proxy) {
      this._proxy.onChildRemoved(cmpObj._proxy);
    }
    return removed;
  }

  // overrides pixijs function
  removeChildren(beginIndex?: number, endIndex?: number): PIXI.DisplayObject[] {
    let removed = super.removeChildren(beginIndex, endIndex);
    for (let removedObj of removed) {
      let cmpObj = <GameObject><any>removedObj;
      if (cmpObj && cmpObj._proxy) {
        this._proxy.onChildRemoved(cmpObj._proxy);
      }
    }
    return removed;
  }

  addComponent(component: Component, runInstantly: boolean = false) {
    this._proxy.addComponent(component, runInstantly);
  }
  findComponentByName<T extends Component>(name: string): T {
    return this._proxy.findComponentByName<T>(name);
  }
  removeComponent(component: Component) {
    this._proxy.removeComponent(component);
  }
  assignAttribute(key: string, val: any) {
    this._proxy.assignAttribute(key, val);
  }
  getAttribute<T>(key: string): T {
    return this._proxy.getAttribute<T>(key);
  }
  removeAttribute(key: string): boolean {
    return this._proxy.removeAttribute(key);
  }
  addTag(tag: string) {
    this._proxy.addTag(tag);
  }
  removeTag(tag: string) {
    this._proxy.removeTag(tag);
  }
  hasTag(tag: string): boolean {
    return this._proxy.hasTag(tag);
  }
  get tags() {
    return this._proxy.tags;
  }
  setFlag(flag: number) {
    this._proxy.setFlag(flag);
  }
  resetFlag(flag: number) {
    this._proxy.resetFlag(flag);
  }
  hasFlag(flag: number): boolean {
    return this._proxy.hasFlag(flag);
  }
  invertFlag(flag: number) {
    this._proxy.invertFlag(flag);
  }
  get stateId(): number {
    return this._proxy.stateId;
  }
  set stateId(state: number) {
    this._proxy.stateId = state;
  }
  remove() {
    this.parent.removeChild(this);
  }
}

/**
 * Wrapper for PIXI.BitmapText
 */
export class BitmapText extends PIXI.BitmapText implements GameObject {
  _proxy: GameObjectProxy;

  constructor(name: string = '', text: string = '', fontName: string, fontSize: number, fontColor: number = 0xFFFFFF) {
    super(text, { font: { name: fontName, size: fontSize }, tint: fontColor });
    this._proxy = new GameObjectProxy(name, this);
  }

  get id(): number {
    return this._proxy.id;
  }

  get pixiObj(): PIXI.Container {
    return this;
  }

  get scene(): Scene {
    return this._proxy.scene;
  }

  get parentGameObject(): Container {
    return <Container><any>this.parent;
  }

  asContainer(): Container {
    return this;
  }

  asParticleContainer(): ParticleContainer {
    throw new Error('Can\'t cast this object to particle container!');
  }

  asSprite(): Sprite {
    throw new Error('Can\'t cast this object to sprite!');
  }

  asTilingSprite(): TilingSprite {
    throw new Error('Can\'t cast this object to tiling sprite!');
  }

  asText(): Text {
    throw new Error('Can\'t cast this object to text!');
  }

  asBitmapText(): BitmapText {
    return this;
  }

  asGraphics(): Graphics {
    throw new Error('Can\'t cast this object to graphics');
  }

  asMesh(): Mesh {
    throw new Error('Can\'t cast this object to mesh');
  }

  // overrides pixijs function
  addChild<T extends PIXI.DisplayObject[]>(
    ...children: T
  ): T[0] {
    let newChild = super.addChild(...children);
    for (let child of children) {
      let cmpObj = <GameObject><any>child;
      if (cmpObj && cmpObj._proxy) {
        this._proxy.onChildAdded(cmpObj._proxy);
      }
    }

    return newChild;
  }

  // overrides pixijs function
  addChildAt<T extends PIXI.DisplayObject>(child: T, index: number): T {
    let newChild = super.addChildAt(child, index);
    let cmpObj = <GameObject><any>newChild;
    if (cmpObj && cmpObj._proxy) {
      this._proxy.onChildAdded(cmpObj._proxy);
    }
    return newChild;
  }

  // overrides pixijs function
  removeChild<T extends PIXI.DisplayObject[]>(
    ...children: T
  ): T[0] {
    let removed = super.removeChild(...children);
    for (let child of children) {
      let cmpObj = <GameObject><any>child;
      if (cmpObj && cmpObj._proxy) {
        this._proxy.onChildRemoved(cmpObj._proxy);
      }
    }

    return removed;
  }

  // overrides pixijs function
  removeChildAt(index: number): PIXI.DisplayObject {
    let removed = super.removeChildAt(index);
    let cmpObj = <GameObject><any>removed;
    if (cmpObj && cmpObj._proxy) {
      this._proxy.onChildRemoved(cmpObj._proxy);
    }
    return removed;
  }

  // overrides pixijs function
  removeChildren(beginIndex?: number, endIndex?: number): PIXI.DisplayObject[] {
    let removed = super.removeChildren(beginIndex, endIndex);
    for (let removedObj of removed) {
      let cmpObj = <GameObject><any>removedObj;
      if (cmpObj && cmpObj._proxy) {
        this._proxy.onChildRemoved(cmpObj._proxy);
      }
    }
    return removed;
  }

  addComponent(component: Component, runInstantly: boolean = false) {
    this._proxy.addComponent(component, runInstantly);
  }
  findComponentByName<T extends Component>(name: string): T {
    return this._proxy.findComponentByName<T>(name);
  }
  removeComponent(component: Component) {
    this._proxy.removeComponent(component);
  }
  assignAttribute(key: string, val: any) {
    this._proxy.assignAttribute(key, val);
  }
  getAttribute<T>(key: string): T {
    return this._proxy.getAttribute<T>(key);
  }
  removeAttribute(key: string): boolean {
    return this._proxy.removeAttribute(key);
  }
  addTag(tag: string) {
    this._proxy.addTag(tag);
  }
  removeTag(tag: string) {
    this._proxy.removeTag(tag);
  }
  hasTag(tag: string): boolean {
    return this._proxy.hasTag(tag);
  }
  get tags() {
    return this._proxy.tags;
  }
  setFlag(flag: number) {
    this._proxy.setFlag(flag);
  }
  resetFlag(flag: number) {
    this._proxy.resetFlag(flag);
  }
  hasFlag(flag: number): boolean {
    return this._proxy.hasFlag(flag);
  }
  invertFlag(flag: number) {
    this._proxy.invertFlag(flag);
  }
  get stateId(): number {
    return this._proxy.stateId;
  }
  set stateId(state: number) {
    this._proxy.stateId = state;
  }
  remove() {
    this.parent.removeChild(this);
  }
}

/**
 * Wrapper for PIXI.Mesh
 */
export class Mesh extends PIXI.Mesh implements GameObject {
  _proxy: GameObjectProxy;

  constructor(name: string = '', geometry: PIXI.Geometry, shader: PIXI.Shader | PIXI.MeshMaterial, state?: PIXI.State, drawMode?: number) {
    super(geometry, shader, state, drawMode);
    this._proxy = new GameObjectProxy(name, this);
  }

  get id(): number {
    return this._proxy.id;
  }

  get pixiObj(): PIXI.Container {
    return this;
  }

  get scene(): Scene {
    return this._proxy.scene;
  }

  get parentGameObject(): Container {
    return <Container><any>this.parent;
  }

  asContainer(): Container {
    return this;
  }

  asParticleContainer(): ParticleContainer {
    throw new Error('Can\'t cast this object to particle container!');
  }

  asSprite(): Sprite {
    throw new Error('Can\'t cast this object to sprite!');
  }

  asTilingSprite(): TilingSprite {
    throw new Error('Can\'t cast this object to tiling sprite!');
  }

  asText(): Text {
    throw new Error('Can\'t cast this object to text!');
  }

  asBitmapText(): BitmapText {
    throw new Error('Can\'t cast this object to bitmap text!');
  }

  asGraphics(): Graphics {
    throw new Error('Can\'t cast this object to graphics');
  }

  asMesh(): Mesh {
    return this;
  }

  // overrides pixijs function
  addChild<T extends PIXI.DisplayObject[]>(
    ...children: T
  ): T[0] {
    let newChild = super.addChild(...children);
    for (let child of children) {
      let cmpObj = <GameObject><any>child;
      if (cmpObj && cmpObj._proxy) {
        this._proxy.onChildAdded(cmpObj._proxy);
      }
    }

    return newChild;
  }

  // overrides pixijs function
  addChildAt<T extends PIXI.DisplayObject>(child: T, index: number): T {
    let newChild = super.addChildAt(child, index);
    let cmpObj = <GameObject><any>newChild;
    if (cmpObj && cmpObj._proxy) {
      this._proxy.onChildAdded(cmpObj._proxy);
    }
    return newChild;
  }

  // overrides pixijs function
  removeChild<T extends PIXI.DisplayObject[]>(
    ...children: T
  ): T[0] {
    let removed = super.removeChild(...children);
    for (let child of children) {
      let cmpObj = <GameObject><any>child;
      if (cmpObj && cmpObj._proxy) {
        this._proxy.onChildRemoved(cmpObj._proxy);
      }
    }

    return removed;
  }

  // overrides pixijs function
  removeChildAt(index: number): PIXI.DisplayObject {
    let removed = super.removeChildAt(index);
    let cmpObj = <GameObject><any>removed;
    if (cmpObj && cmpObj._proxy) {
      this._proxy.onChildRemoved(cmpObj._proxy);
    }
    return removed;
  }

  // overrides pixijs function
  removeChildren(beginIndex?: number, endIndex?: number): PIXI.DisplayObject[] {
    let removed = super.removeChildren(beginIndex, endIndex);
    for (let removedObj of removed) {
      let cmpObj = <GameObject><any>removedObj;
      if (cmpObj && cmpObj._proxy) {
        this._proxy.onChildRemoved(cmpObj._proxy);
      }
    }
    return removed;
  }

  addComponent(component: Component, runInstantly: boolean = false) {
    this._proxy.addComponent(component, runInstantly);
  }
  findComponentByName<T extends Component>(name: string): T {
    return this._proxy.findComponentByName<T>(name);
  }
  removeComponent(component: Component) {
    this._proxy.removeComponent(component);
  }
  assignAttribute(key: string, val: any) {
    this._proxy.assignAttribute(key, val);
  }
  getAttribute<T>(key: string): T {
    return this._proxy.getAttribute<T>(key);
  }
  removeAttribute(key: string): boolean {
    return this._proxy.removeAttribute(key);
  }
  addTag(tag: string) {
    this._proxy.addTag(tag);
  }
  removeTag(tag: string) {
    this._proxy.removeTag(tag);
  }
  hasTag(tag: string): boolean {
    return this._proxy.hasTag(tag);
  }
  get tags() {
    return this._proxy.tags;
  }
  setFlag(flag: number) {
    this._proxy.setFlag(flag);
  }
  resetFlag(flag: number) {
    this._proxy.resetFlag(flag);
  }
  hasFlag(flag: number): boolean {
    return this._proxy.hasFlag(flag);
  }
  invertFlag(flag: number) {
    this._proxy.invertFlag(flag);
  }
  get stateId(): number {
    return this._proxy.stateId;
  }
  set stateId(state: number) {
    this._proxy.stateId = state;
  }
  remove() {
    this.parent.removeChild(this);
  }
}