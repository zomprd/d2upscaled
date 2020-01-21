import { Container } from '../engine/game-object';
/**
 * Condition for generic object queries
 * If given value is null or undefined, it will not be taken into account
 */
export class QueryCondition {
  ownerId?: number;
  ownerName?: string;
  ownerTag?: string;
  ownerState?: number;
  ownerFlag?: number;
}

/**
 * Checks wheter a given game object meets given condition
 */
export const queryConditionCheck = (gameObject: Container, condition: QueryCondition): boolean => {
  if (gameObject) {
    if (condition.ownerId !== undefined && gameObject.id !== condition.ownerId) {
      return false;
    }
    if (condition.ownerName !== undefined && gameObject.name !== condition.ownerName) {
      return false;
    }
    if (condition.ownerTag !== undefined && !gameObject.hasTag(condition.ownerTag)) {
      return false;
    }
    if (condition.ownerState !== undefined && gameObject.stateId !== condition.ownerState) {
      return false;
    }
    if (condition.ownerFlag !== undefined && !gameObject.hasFlag(condition.ownerFlag)) {
      return false;
    }
    return true;
  }
  return false;
};
