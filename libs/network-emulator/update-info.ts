
/**
 * Entity describing update informations about continuous attributes
 * Is used during network synchronization
 */
export class UpdateInfo {
  // time the state was captured
  public time: number;
  // continous attributes
  public continuousValues: Map<number, number>;
  // discrete attributes
  public discreteValues: Map<number, number>;

  constructor(time: number = 0, continuousValues: Map<number, number> = new Map(), discreteValues: Map<number, number> = new Map()) {
    this.time = time;
    this.continuousValues = continuousValues;
    this.discreteValues = discreteValues;
  }

  findContinuousValue(key: number): number {
    return this.continuousValues.get(key);
  }

  findDiscreteValue(key: number): number {
    return this.discreteValues.get(key);
  }

  findValue(key: number): number {
    if (this.continuousValues.has(key)) {
      return this.findContinuousValue(key);
    } else {
      return this.findDiscreteValue(key);
    }
  }
}