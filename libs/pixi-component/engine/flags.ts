
/**
 * Bit array for flags
 */
export default class Flags {
  // flag array 1-128
  flags = new Uint32Array(4);

  /**
   * Returns true, if given flag is set
   */
  hasFlag(flag: number): boolean {
    if (flag < 1 || flag > 128) {
      throw new Error('Only flag values between 1-128 are supported');
    }
    let index = this.getFlagIndex(flag);
    let offset = this.getFlagOffset(flag);
    let binary = 1 << offset;

    if (index <= 3) {
      switch (index) {
        case 0: return (this.flags[0] & binary) === binary;
        case 1: return (this.flags[1] & binary) === binary;
        case 2: return (this.flags[2] & binary) === binary;
        case 3: return (this.flags[3] & binary) === binary;
      }
    } else {
      throw new Error('Flag at unsupported index');
    }
    return false;
  }

  /**
   * Inverts given flag
   */
  invertFlag(flag: number) {
    if (this.hasFlag(flag)) {
      this.resetFlag(flag);
    } else {
      this.setFlag(flag);
    }
  }

  /**
   * Will switch two flags
   */
  switchFlag(flag1: number, flag2: number) {
    let hasFlag2 = this.hasFlag(flag2);

    if (this.hasFlag(flag1)) {
      this.setFlag(flag2);
    } else {
      this.resetFlag(flag2);
    }

    if (hasFlag2) {
      this.setFlag(flag1);
    } else {
      this.resetFlag(flag1);
    }
  }

  /**
   * Sets given flag to true
   */
  setFlag(flag: number) {
    this.changeFlag(true, flag);
  }

  /**
   * Sets given flag to false
   */
  resetFlag(flag: number) {
    this.changeFlag(false, flag);
  }

  /**
   * Gets set of all flags in numeric values (1-128)
   */
  getAllFlags(): Set<number> {
    let output = new Set<number>();
    let counter = 0;
    for(let i = 0; i< this.flags.length; i++) {
      let flg = this.flags[i];
      counter++;
      if(flg === 0) {
        continue; // skip unassigned flags
      }
      for(let j=1; j<= 32; j++) {
        let binary = 1 << (j - 1);
        if((flg & binary) === binary) {
          output.add(j + (counter-1) * 32);
        }
      }
    }

    return output;
  }

  private getFlagIndex(flag: number) {
    return Math.floor((flag-1) / 32); // sizeof 64bit int
  }

  private getFlagOffset(flag: number) {
    return (flag-1) % 32; // sizeof 64bit int
  }

  private changeFlag(set: boolean, flag: number) {
    if(flag < 1 || flag > 128) {
      throw new Error('Flag at unsupported index');
    }
    let index = this.getFlagIndex(flag);
    let offset = this.getFlagOffset(flag);
    let binary = 1 << offset;

    if (index <= 3) {
      switch (index) {
        case 0: if (set) { (this.flags[0] |= binary); } else { (this.flags[0] &= ~binary); } break;
        case 1: if (set) { (this.flags[1] |= binary); } else { (this.flags[1] &= ~binary); } break;
        case 2: if (set) { (this.flags[2] |= binary); } else { (this.flags[2] &= ~binary); } break;
        case 3: if (set) { (this.flags[3] |= binary); } else { (this.flags[3] &= ~binary); } break;
      }
    } else {
      throw new Error('Flag at unsupported index');
    }
  }
}
