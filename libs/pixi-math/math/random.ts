/**
 * Random number generator, period 2^128 - 1
 */
export default class Random {

  private x: number = 0;
  private y: number = 0;
  private z: number = 0;
  private w: number = 0;

  constructor(seed: number) {
    this.x = Math.floor(seed);
  }
  /**
   * 32 bits of randomness in float
   */
  float() {
    return (this.next() >>> 0) / 0x100000000;
  }

  /**
   * 56 bits of randomness
   */
  double() {
    let result;
    do {
      let top = this.next() >>> 11,
        bot = (this.next() >>> 0) / 0x100000000;
      result = (top + bot) / (1 << 21);
    } while (result === 0);
    return result;
  }

  normalRadial(location: number, mean: number, scale: number = 0) {
    const [u0, v] = this.nextNormal();
    // u0 is in range [-3.5, 3.5]
    if (scale === 1) {
        return location + mean * u0;
    }
    const delta = scale / Math.sqrt(1 + scale * scale);
    const u1 = delta * u0 + Math.sqrt(1 - delta * delta) * v;
    return location + mean * u1;
}

  /**
   * Random function with normal distribution by using Box-Muller transform
   * @param min min value
   * @param max max value
   */
  normal(min: number, max: number, scale: number = 1): number {
    return this.normalRadial((max - min) / 2 + min, (max - min) / 7, scale);
  }

  uniform(min: number = 0, max: number = 1) {
    return min + (max - min) * this.float();
  }

  /**
   * Generates a uniform integer with exclusive bounds
   * @param min min number, exclusive
   * @param max max number, exclusive
   */
  uniformInt(min: number, max: number) {
    return min + Math.floor((max - min + 1) * this.float());
  }

  private nextNormal() {
    let u1 = 0, u2 = 0;
    //Convert [0,1) to (0,1)
    while (u1 === 0) {
      u1 = Math.random();
    }

    while (u2 === 0) {
      u2 = Math.random();
    }

    const R = Math.sqrt(-2.0 * Math.log(u1));
    const theta = 2.0 * Math.PI * u2;
    return [R * Math.cos(theta), R * Math.sin(theta)];
}

  private next() {
    let t = this.x ^ (this.x << 11);
    this.x = this.y;
    this.y = this.z;
    this.z = this.w;
    return this.w ^= (this.w >>> 19) ^ t ^ (t >>> 8);
  }
}