


/**
 * Reader of byte array received from the internet
 */
export class NetReader {

  private _buffer: Uint8Array;
  // pointer to current byte in buffer
  private _current: number;
  // length of the buffer
  private _bufferLength: number;


 /**
  * Creates a new NetReader
  * @param data data to read
  * @param capacity (size of data to read) in bytes
  */
  constructor(capacity: number, data?: Uint8Array) {
    if (data) {
      this._buffer = data;
    } else {
      this._buffer = new Uint8Array(capacity);
    }

    this._bufferLength = capacity;
    this._current = 0;
  }

 /**
  * Parses 1B
  */
  readByte(): number {
    if (!this.canReadBits(8)) {
      throw new Error('Buffer out of range');
    }

    let value = this.buffer[this._current];
    this._current++;
    return value;
  }

 /**
  * Parses 2B
  */
  read2B(): number {
    if (!this.canReadBits(16)) {
      throw new Error('Buffer out of range');
    }
    let value = 0;
    value |= this.readByte() << 8;
    value |= this.readByte();
    return value;
  }

 /**
  * Parses 4B
  */
  read4B(): number {
    if (!this.canReadBits(32)) {
      throw new Error('Buffer out of range');
    }
    let value = 0;
    value |= this.readByte() << 24;
    value |= this.readByte() << 16;
    value |= this.readByte() << 8;
    value |= this.readByte();
    return value;
  }

  /**
   * Parses 8B
   */
  read8B(): number {
    if (!this.canReadBits(64)) {
      throw new Error('Buffer out of range');
    }

    let value = 0;
    value |= this.readByte() << 56;
    value |= this.readByte() << 48;
    value |= this.readByte() << 40;
    value |= this.readByte() << 32;
    value |= this.readByte() << 24;
    value |= this.readByte() << 16;
    value |= this.readByte() << 8;
    value |= this.readByte();
    return value;
  }

  /**
   * Parses float, by using a dirty fixed-point hack for simplicity
   */
  readFloat(): number {
    if (!this.canReadBits(64)) {
      throw new Error('Buffer out of range');
    }
    let decimal = this.read8B();
    let float = decimal / 100000; // lol
    return float;
  }

  /**
   * Parses an array of bytes of given length
   */
  readBytes(length: number): Uint8Array {
    let output = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
      output[i] = this.readByte();
    }
    return output;
  }

  /**
   * Parses an array of 16bit words of given length
   */
  read2Bytes(length: number): Uint16Array {
    let output = new Uint16Array(length);
    for (let i = 0; i < length; i++) {
      output[i] = this.read2B();
    }
    return output;
  }

  /**
   * Parses an array of 32bit words of given length
   */
  read4Bytes(length: number): Uint32Array {
    let output = new Uint32Array(length);
    for (let i = 0; i < length; i++) {
      output[i] = this.read4B();
    }
    return output;
  }

  /**
   * Parses an array of 64bit words of given length
   */
  read8Bytes(length: number): number[] {
    let output = new Array(length);
    for (let i = 0; i < length; i++) {
      output[i] = this.read8B();
    }
    return output;
  }

  /**
   * Parses a 16-bit UTF string (JavaScript standard)
   */
  readString(): string {
    // size is stored as 32bit number
    const length = this.read4B();
    const array = this.read2Bytes(length);
    return String.fromCharCode(...array);
  }

  get buffer() {
    return this._buffer;
  }

  get currentPointer() {
    return this._current;
  }

  get bufferLength() {
    return this._bufferLength;
  }

  reset() {
    this._current = 0;
  }

  private canReadBits(bits: number) {
    return (this._bufferLength - (this.currentPointer)) * 8  >= bits;
  }
}
