export enum Messages {
  ANY = 'ANY',
  OBJECT_ADDED = 'OBJECT_ADDED',
  OBJECT_REMOVED = 'OBJECT_REMOVED',
  COMPONENT_ADDED = 'COMPONENT_ADDED',
  COMPONENT_REMOVED = 'COMPONENT_REMOVED',
  ATTRIBUTE_ADDED = 'ATTRIBUTE_ADDED',
  ATTRIBUTE_CHANGED = 'ATTRIBUTE_CHANGED',
  ATTRIBUTE_REMOVED = 'ATTRIBUTE_REMOVED',
  STATE_CHANGED = 'STATE_CHANGED',
  FLAG_CHANGED = 'FLAG_CHANGED',
  TAG_ADDED = 'TAG_ADDED',
  TAG_REMOVED = 'TAG_REMOVED',
  SCENE_CLEAR = 'SCENE_CLEAR'
}

export interface AttributeChangeMessage {
  key: string;
  type: Messages.ATTRIBUTE_ADDED | Messages.ATTRIBUTE_CHANGED | Messages.ATTRIBUTE_REMOVED;
  previousValue: any;
  currentValue: any;
}

export interface StateChangeMessage {
  previous: number;
  current: number;
}

export interface FlagChangeMessage {
  flag: number;
  isSet: boolean;
}

export interface TagChangeMessage {
  type: Messages.TAG_ADDED | Messages.TAG_REMOVED;
  tag: string;
}

export enum Attributes {
  DYNAMICS = 'DYNAMICS'
}


