import { NetReader } from './net-reader';
import { NetWriter } from './net-writer';

/**
 * Network message types
 */
export enum NetMsgTypes {
  DISCOVER_REQUEST = 1,
  DISCOVER_RESPONSE = 2,
  CONNECT_REQUEST = 3,
  CONNECT_RESPONSE = 4,
  DATA = 5, // sync messages, the ones that have an impact on the game state
  ACCEPT = 6, // message that only accepts a prevously sent reliable payload
  DISCONNECT = 7,
  BEACON = 8// beacon message used to let the server know the client is still here, event if it has nothing to send
}

/**
 * Abstract base class for entities that are part of network message
 * as a payload; both NetInputMessage and NetOutputMessage may contain a payload
 */
export abstract class NetData {

 /**
  * Loads object from a stream
  */
  abstract loadFromStream(reader: NetReader);

 /**
  * Saves objects into a stream
  */
  abstract saveToStream(writer: NetWriter);

 /**
  * Gets length of the data, very important for serialization
  */
  abstract getDataLength(): number;
}

/**
 * Base class for both NetInputMessage and NetOutputMessage, contains header data of all communication messages
 */
export class NetMessage {

  // synchronization id
  public syncId = 0;
  // confirmation id (id of a confirmed reliable message)
  public confirmId = 0; // 16 bit
  // either source or target peer id
  public peerId = 0; // 16 bit
  // type of message
  public msgType = NetMsgTypes.DATA; // 8bit
  // type of action
  public action: number; // 8 bit
  // time at which the message was sent
  public msgTime: number = 0; // 64bit
  // if true, the message is required to be accepted by the client
  public isReliable: boolean = false;
  // if true, the message contains an update sample
  public isUpdateSample: boolean = false;

 /**
  * Gets length of the header in bytes
  */
  static getHeaderLength(): number {
    return 2 // sync id
      + 2 // confirmation id
      + 2 // peer id
      + 1 // msgType
      + 8 // action
      + 8 // msgTime
      + 2; // booleans (1 byte for each)
  }
}

/**
 * Network read-only message that was received
 */
export class NetInputMessage extends NetMessage {
  // source ip address
  private _sourceIp: string;
  // source port
  private _sourcePort: number;
  // data payload
  private _data: Uint8Array = null;
  // length of data payload
  private _dataLength: number = 0;


 /**
  * Creates a new input message
  * @param messageLength length of the data payload
  */
  constructor(messageLength: number, sourceIp: string, sourcePort: number) {
    super();
    this._dataLength = messageLength - NetMessage.getHeaderLength();
    this._sourceIp = sourceIp;
    this._sourcePort = sourcePort;
  }

  get sourceIp() {
    return this._sourceIp;
  }

  get sourcePort() {
    return this._sourcePort;
  }

  get dataRaw() {
    return this._data;
  }

  parseData(output: NetData): NetData {
    let netReader = new NetReader(this._dataLength, this._data);
    output.loadFromStream(netReader);
    return output;
  }

  getMessageLength() {
    return NetMessage.getHeaderLength() + this.getDataLength();
  }

  getDataLength() {
    return this._dataLength;
  }

  loadFromStream(reader: NetReader) {
    this.syncId = reader.read2B();
    this.confirmId = reader.read2B();
    this.peerId = reader.read2B();
    this.msgType = reader.readByte();
    this.action = reader.read8B();
    this.msgTime = reader.readFloat();
    this.isReliable = reader.readByte() === 1;
    this.isUpdateSample = reader.readByte() === 1;

    if (this._dataLength !== 0) {
      this._data = reader.readBytes(this._dataLength);
    }
  }
}


/**
 * Network message that is serialized into a stream of bytes and sent
 * to the destination point
 */
export class NetOutputMessage extends NetMessage {
  // data payload
  public data: NetData = null;


 /**
  * Creates a new output message
  * @param syncId synchronization id
  * @param peerId id of the peer to whom the message is intended
  * @param msgType type of the message
  */
  constructor(syncId: number, peerId: number, msgType: NetMsgTypes, action?: number, data?: NetData, time?: number, isUpdateSample?: boolean, isReliable?: boolean) {
    super();
    this.syncId = syncId;
    this.peerId = peerId;
    this.msgType = msgType;
    this.action = action;
    this.data = data;
    this.msgTime = time;
    this.isUpdateSample = isUpdateSample;
    this.isReliable = isReliable;
  }



 /**
  * Gets length of the message, including data payload (if attached)
  */
  getMessageLength() {
    return (this.data ? this.data.getDataLength() : 0)
      + NetMessage.getHeaderLength();
  }

  saveToStream(writer: NetWriter) {
    writer.write2B(this.syncId);
    writer.write2B(this.confirmId);
    writer.write2B(this.peerId);
    writer.writeByte(this.msgType);
    writer.write8B(this.action);
    writer.writeFloat(this.msgTime);
    writer.writeByte(this.isReliable ? 1 : 0);
    writer.writeByte(this.isUpdateSample ? 1 : 0);

    if(this.data) {
      this.data.saveToStream(writer);
    }
  }
}
