

interface NetworkData {
  sourceIp: string;
  sourcePort: number;
  data: Uint8Array;
  time: number;
}

class NetworkMock {
  // hardcoded IP address for both endpoints
  listenIp = '127.0.0.1';
  networkData = new Map<string, NetworkData[]>();

  sendData(sourceIp: string, sourcePort: number, targetIp: string, targetPort: number, data: Uint8Array, time: number) {
    let url = targetIp + ':' + targetPort;
    if(!this.networkData.has(url)) {
      this.networkData.set(url, []);
    }

    this.networkData.get(url).push({sourceIp, sourcePort, data, time});
  }

  receiveData(ip: string, port: number, time: number, delay: number): NetworkData {
    let url = ip + ':' + port;
    if(this.networkData.has(url)) {
      let data = this.networkData.get(url);
      if(data.length !== 0 && (time - data[0].time) > delay) {
        let first = data[0];
        data.splice(0, 1);
        return first;
      }
    }
  }
}

/**
 * Simple emulator of UDP protocol
 */
export class UDPEmulator {
  static networkMock = new NetworkMock();

  // lag for outgoing messages in ms
  public lag: number = 0;
  // drop ration for packets (0 = none, 1 = 100% lost)
  public packetDropRatio: number = 0;

  remoteIp: string;
  remotePort: number;
  listenPort: number;
  listenIp: string;

  static reset() {
    UDPEmulator.networkMock = new NetworkMock();
  }

  create() {
    this.listenIp = UDPEmulator.networkMock.listenIp; // always the same
  }

  connect(ip: string, port: number) {
    this.remoteIp = ip;
    this.remotePort = port;
  }

  bind(port: number) {
    this.listenPort = port;
  }

  setReceiveBufferSize(length: number) {
    // nothing to do here, always receive full payload
  }

  receive(buffer: Uint8Array, bufferLength: number, time: number): number {
    let data = UDPEmulator.networkMock.receiveData(this.listenIp, this.listenPort, time, this.lag);
    if(data) {
      this.remoteIp = data.sourceIp;
      this.remotePort = data.sourcePort;
      for(let i=0; i< data.data.length; i++) {
        buffer[i] = data.data[i];
      }
      return data.data.length;
    } else {
      return null;
    }
  }

  send(data: Uint8Array, length: number, time: number) {
    if(data.length !== length) {
      data = data.subarray(0, length);
    }
    if(this.packetDropRatio === 0 || Math.random() > this.packetDropRatio) {
      UDPEmulator.networkMock.sendData(this.listenIp, this.listenPort, this.remoteIp, this.remotePort, data, time);
    }
  }

  getRemoteIp(): string {
    return this.remoteIp;
  }

  getRemotePort(): number {
    return this.remotePort;
  }

  close() {
    this.remoteIp = '';
    this.remotePort = 0;
  }
}