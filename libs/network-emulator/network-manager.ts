import { UDPEmulator } from './udp-emulator';
import { NetReader } from './net-reader';
import { NetOutputMessage, NetInputMessage } from './net-message';
import { NetWriter } from './net-writer';

/**
 * UDP protocol wrapper (actually, for this case the UDP is only an emulator,
 * but this should work even when replaced by a real deal)
 */
export class NetworkManager {

  udpManager: UDPEmulator;
  port = 0;
  bufferStream: NetReader = null;

  constructor() {
    this.udpManager = new UDPEmulator();
    this.udpManager.create();
  }

 /**
  * Configures UDP sender
  * @param ip ip address of the destination point
  * @param port port of the destination service
  */
  setupUDPSender(ip: string, port: number) {
    this.udpManager.connect(ip, port);
  }

 /**
  * Configures UDP receiver
  * @param port port of the destination service
  * @param bufferSize size of buffer for incoming messages
  */
  setupUDPReceiver(port: number, bufferSize: number) {
    this.udpManager.bind(port);
    this.udpManager.setReceiveBufferSize(bufferSize);
    this.port = port;
    this.bufferStream = new NetReader(bufferSize);
  }

 /**
  * Sends UDP message
  * @param applicationId application identifier
  * @param msg msg to send
  * @param time current time
  */
  sendUDPMessage(applicationId: number, msg: NetOutputMessage, time: number) {
    msg.msgTime = time;
    let writer = new NetWriter(msg.getMessageLength() + 2); // 2 bytes for app id
    writer.write2B(applicationId);
    msg.saveToStream(writer);
    let buffer = writer.buffer;
    this.udpManager.send(buffer, writer.getUsedBytes(), time);
  }

 /**
  * Receives UDP message (at least it tries to)
  * @param applicationId application identifier
  * @param timeoutSec number of seconds the receiver should wait for a new message (set 0 for simple check)
  */
  receiveUDPMessage(applicationId: number, time: number): NetInputMessage {
      this.bufferStream.reset();
      let bytesBuff = 0;

      bytesBuff = this.udpManager.receive(this.bufferStream.buffer, this.bufferStream.bufferLength, time);

      if (!bytesBuff) {
        // error, return an empty messge
        return null;
      }

      if (bytesBuff > 0 && this.bufferStream.read2B() === applicationId) {
        // size of content (minus 2 bytes)
        let contentSize = bytesBuff - 2;
        let receivedMsg = new NetInputMessage(contentSize, this.udpManager.getRemoteIp(), this.udpManager.getRemotePort());
        receivedMsg.loadFromStream(this.bufferStream);
        return receivedMsg;
      }
      return null;
  }

 closeUDP() {
    this.udpManager.close();
  }
}
