

/**
 * Writer of byte array that is supposed to be sent to a remote endpoint
 */
export class NetWriter {

  private _buffer: Uint8Array;
  // pointer to current byte in buffer
  private _current: number;
  // length of the buffer
  private _bufferLength: number;

 /**
  * Creates a new NetWriter
  * @param capacity (size of data to write) in bytes
  */
  constructor(capacity: number) {
    this._buffer = new Uint8Array(capacity);
    this._bufferLength = capacity;
    this.reset();
  }

  writeByte(value: number) {
    if (!this.isFreeSpaceForBits(8)) {
      throw new Error('Free space exceeded');
    }
    this.buffer[this._current] = value;
    this.increment();
  }

  write2B(value: number) {
    if (!this.isFreeSpaceForBits(16)) {
      throw new Error('Free space exceeded');
    }
    this.writeByte(value >> 8);
    this.writeByte(value);
  }

  write4B(value: number) {
    if (!this.isFreeSpaceForBits(32)) {
      throw new Error('Free space exceeded');
    }
    this.writeByte(value >> 24);
    this.writeByte(value >> 16);
    this.writeByte(value >> 8);
    this.writeByte(value);
  }

  write8B(value: number) {
    if (!this.isFreeSpaceForBits(64)) {
      throw new Error('Free space exceeded');
    }
    this.writeByte(value >> 56);
    this.writeByte(value >> 48);
    this.writeByte(value >> 40);
    this.writeByte(value >> 32);
    this.writeByte(value >> 24);
    this.writeByte(value >> 16);
    this.writeByte(value >> 8);
    this.writeByte(value);
  }

  writeFloat(value: number) {
    if (!this.isFreeSpaceForBits(64)) {
      throw new Error('Free space exceeded');
    }
    // a simple hack to preserve the fractional part. We will divide it back in the NetReader
    // btw this works for simple cases (transformation, rotation etc.)
    // will definitely not work for complex dynamics and physics in general
    value = value * 100000;
    this.write8B(value);
  }

  writeBytes(bytes: Uint8Array, size: number) {
    for(let i=0; i< bytes.length; i++) {
      this.writeByte(bytes[i]);
    }
  }

  write2Bytes(bytes: Uint16Array, size: number) {
    for(let i=0; i< bytes.length; i++) {
      this.write2B(bytes[i]);
    }
  }

  write4Bytes(bytes: Uint32Array, size: number) {
    for(let i=0; i< bytes.length; i++) {
      this.write4B(bytes[i]);
    }
  }

  write8Bytes(bytes: number[]) {
    for(let i=0; i< bytes.length; i++) {
      this.write8B(bytes[i]);
    }
  }

  writeString(str: string) {
    this.write4B(str.length); // write length of the string
    for(let i =0; i < str.length; i++) {
      this.write2B(str.charCodeAt(i));
    }
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

  getUsedBytes() {
    return this._current;
  }

  reset() {
    this._current = 0;
    this._buffer[this._current] = 0;
  }

  private increment() {
    this._current ++;
    this._buffer[this._current] = 0;
  }

  private isFreeSpaceForBits(bits: number) {
    return (this._bufferLength - this.currentPointer) * 8 >= bits;
  }
}
