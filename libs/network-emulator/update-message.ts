import { UpdateInfo } from './update-info';
import { NetReader } from './net-reader';
import { NetWriter } from './net-writer';
import { NetData } from './net-message';

/**
 * A network message consisting of hashed attributes
 */
export class UpdateMessage extends NetData {
  // continous attributes
  public continuousValues: Map<number, number>;
  // discrete attributes
  public discreteValues: Map<number, number>;

  updateMessage(info: UpdateInfo) {
    this.continuousValues = info.continuousValues;
    this.discreteValues = info.discreteValues;
  }

  loadFromStream(reader: NetReader) {
    // load both collections
    let contSize = reader.read2B();
    let discrSize = reader.read2B();

    for (let i = 0; i < contSize; i++) {
      let key = reader.read2B();
      let val = reader.read8B();

      this.continuousValues.set(key, val);
    }

    for (let i = 0; i < discrSize; i++) {
      let key = reader.read2B();
      let val = reader.read8B();

      this.discreteValues.set(key, val);
    }
  }

  saveToStream(writer: NetWriter) {
    writer.write2B(this.continuousValues.size);
    writer.write2B(this.discreteValues.size);

    for (let [key, val] of this.continuousValues) {
      writer.write2B(key);
      writer.write8B(val);
    }

    for (let [key, val] of this.discreteValues) {
      writer.write2B(key);
      writer.write8B(val);
    }
  }

  getDataLength() {
    // number of attributes * 64bit + their lenghts (32bit)
    return (this.continuousValues.size + this.discreteValues.size) * 8 + 4 + 4;
  }
}