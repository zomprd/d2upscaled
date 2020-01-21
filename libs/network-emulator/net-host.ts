import * as ECSA from '../pixi-component';
import { NetOutputMessage, NetInputMessage, NetMsgTypes, NetData } from './net-message';
import { NetworkManager } from './network-manager';
import { NetworkMessages } from './net-client';
import { checkTime } from '../../src/utils/functions';


/**
 * Context data for each peer
 */
class PeerContext {
  id: number;					// assigned identifier of the peer
  peerIp: string = '';		// ip address of the peer
  peerPort: number;			// port of the peer


  // identifier of last received message
  lastReceivedMsgId: number = -1;
  // creation time of the last received message
  lastReceivedMsgTime: number = 0;
  // identifier of the last sent message
  lastSentMsgId: number = 0;
  // collection of not confirmed messages that will be re-sent repeatedly
  unconfirmedMessages: Map<number, NetOutputMessage> = new Map();
  // collection of messages that will be sent during the next update cycle
  messagesToSend: NetOutputMessage[] = [];
  // indicator whether the client is marked as missing
  postponed: boolean = false;
}

 /**
  * Component that communicates over network using UDP protocol and
  * sends synchronization messages
  *
  * May be used primarily for multiplayer
  * All messages have their synchronization id and the important ones must be
  * confirmed using the confirmation id that is packed together with regular messages
  *
  * The frequency of message exchange can also be regulated
  */
export class NetworkHost extends ECSA.Component {
  static peerCounter = 1; // peer id counter
  // id of the application
  applicationId: number;
  // port of the host
  hostPort: number;

  initialized: boolean = false;
  network: NetworkManager = null;

  // all peers mapped by their ids
  peers: Map<number, PeerContext> = new Map();
  // number of sending cycles per second
  sendingFrequency: number = 10;
  lastSendingTime: number = 0;
  // number of seconds the peer will be marked as missing
  postponeTimeout: number = 6;
  // number of seconds the peer will be automatically disconnected
  disconnectTimeout: number = 10;


 /**
  * Initializes the host, waiting for other peers to connect
  * @param applicationId id of application that defines the connection; is checked in every received message
  * @param hostPort port this host will listen on
  */
  initHost(applicationId: number, hostPort: number) {
    if (this.network !== null) {
      throw new Error('Host is already initialized!');
    }

    this.applicationId = applicationId;
    this.hostPort = hostPort;
    this.network = new NetworkManager();
    console.log(`Initialized host for application ${applicationId} on port ${hostPort}`);
    this.network.setupUDPReceiver(hostPort, 10000);
    this.initialized = true;
  }

 /**
	 * Will push a message that will be sent directly to a given peer
	 */
  pushMessageForSending(type: NetMsgTypes, action: number, time: number, peerId?: number, data?: NetData, isUpdateSample?: boolean, isReliable?: boolean) {
    let netMsg = new NetOutputMessage(0, peerId, type, action, data, time, isUpdateSample, isReliable);
    if (this.peers.size > 0) {
      if (peerId) {
        let found = this.peers.get(peerId);

        if (found) {
          found.messagesToSend.push(netMsg);
        }
      } else {
        // send to all peers
        for (let [, peer] of this.peers) {
          peer.messagesToSend.push(netMsg);
        }
      }
    }
  }

 /**
  * Closes the communication channel with a given peer
  */
  closePeer(id: number) {
    let peerTb = this.peers.get(id);

    if (peerTb) {
      console.log(`Closing client ${id}`);
      this.sendMessage(NetworkMessages.NET_DISCONNECTED, this.peers.get(id));
      peerTb.messagesToSend = [];
      this.peers.delete(id);
    }
  }

 /**
  * Connects to a peer with given ip address
  */
  connectToPeer(ip: string, port: number) {
    if (!this.initialized) {
      throw new Error('Host is not initialized!');
    }

    let newId = NetworkHost.peerCounter++;
    console.log(`Assigned peerId ${newId}`);
    let newPeerCtx = new PeerContext();
    newPeerCtx.peerIp = ip;
    newPeerCtx.peerPort = port;
    newPeerCtx.id = newId;
    this.peers.set(newId, newPeerCtx);

    return newId;
  }

  onUpdate(delta: number, absolute: number) {
    if (this.initialized) {
      this.handleListeningState(absolute);
      this.handleCommunicatingState(absolute);
    }
  }

  /** Update for listening state */
  protected handleListeningState(time: number) {
    let message = this.network.receiveUDPMessage(this.applicationId, time);

    if (message) {
      if (message.peerId !== 0) {
        // get message from peer
        this.processPeerMessage(message, time);
      } else if (message.msgType === NetMsgTypes.DISCOVER_REQUEST) {
        // received discover request . send discover response
        console.log(`Received discover message from ${message.sourceIp}:${message.sourcePort}`);
        // use listener to answer this message
        this.network.setupUDPSender(message.sourceIp, message.sourcePort);
        let response = new NetOutputMessage(1, 0, NetMsgTypes.DISCOVER_RESPONSE);
        this.network.sendUDPMessage(this.applicationId, response, time);
      } else if (message.msgType === NetMsgTypes.CONNECT_REQUEST) {
        // received connect request . send connect response
        console.log(`Connected peer ${message.sourceIp}:${message.sourcePort}`);
        let newPeerId = this.connectToPeer(message.sourceIp, message.sourcePort);
        this.peers.get(newPeerId).lastReceivedMsgTime = time;

        // notify other components
        this.sendMessage(NetworkMessages.NET_CONNECTED, this.peers.get(newPeerId));

        // send confirmation message
        this.network.setupUDPSender(message.sourceIp, message.sourcePort);
        let msg = new NetOutputMessage(1, newPeerId, NetMsgTypes.CONNECT_RESPONSE);
        this.network.sendUDPMessage(this.applicationId, msg, time);
      }
    }
  }

  /** Update for communicating state */
  protected handleCommunicatingState(time: number) {
    let peersToDisconnect = new Set<number>();

    for (let peer of this.peers.values()) {
      if (!peer.postponed && (time - peer.lastReceivedMsgTime) > this.postponeTimeout * 1000) {
        // no msg received from peer for XXX seconds -> marked as lost
        console.log(`No message received from peer ${peer.id} for ${this.postponeTimeout} s, connection marked as lost`);
        peer.postponed = true;
      }

      if (peer.postponed && (time - peer.lastReceivedMsgTime) > this.disconnectTimeout * 1000) {
        // no message over last XXX seconds -> disconnecting
        console.log(`No message received from peer ${peer.id} for ${this.disconnectTimeout} s, disconnecting...`);
        peersToDisconnect.add(peer.id);
      }
    }

    // Close disconnected peers
    for (let peerId of peersToDisconnect) {
      this.closePeer(peerId);
    }

    // Process messages to send
    if (checkTime(this.lastSendingTime, time, this.sendingFrequency)) {
      this.lastSendingTime = time;

      for (let peer of this.peers.values()) {
        if (!peer.postponed) {
          // send all messages for this peer
          this.sendMessages(time, peer);
        }
      }
    }
  }

  /** Processes an incoming general message from a peer  */
  protected processPeerMessage(message: NetInputMessage, time: number) {
    let peer = this.peers.get(message.peerId);
    if (peer) {
      peer.postponed = false; // reset the postpone indicator

      let type = message.msgType;
      if ((type === NetMsgTypes.DATA || type === NetMsgTypes.ACCEPT)) {
        // got update or acceptation message
        peer.lastReceivedMsgTime = time;
        this.processUpdateMessage(message, peer);
      } else if (type === NetMsgTypes.DISCONNECT) {
        console.log(`Peer ${peer.id} has disconnected`);
        this.closePeer(peer.id);
      } else if (type === NetMsgTypes.CONNECT_REQUEST) {
        console.log(`Peer ${peer.id} is reconnecting`);
        peer.lastReceivedMsgTime = time;
        let msg = new NetOutputMessage(1, peer.id, NetMsgTypes.CONNECT_RESPONSE);
        // notify other components
        this.sendMessage(NetworkMessages.NET_CONNECTED, peer);
        this.network.setupUDPSender(peer.peerIp, peer.peerPort);
        this.network.sendUDPMessage(this.applicationId, msg, time);
      } else if (type === NetMsgTypes.BEACON) {
        // the peer is just leeting us know it is still alive, even if it doesn't have any data to send
        peer.lastReceivedMsgTime = time;
      }
    }
  }

  /** Processes an incoming update message from a peer  */
  protected processUpdateMessage(message: NetInputMessage, peer: PeerContext) {
    const acceptedMsgId = message.confirmId;
    if (acceptedMsgId !== 0) {
      console.log(`Received confirmation of ${message.confirmId} from ${message.peerId}`);
      // got id of a confirmation message
      peer.unconfirmedMessages.delete(acceptedMsgId);
    }

    if (message.msgType === NetMsgTypes.DATA) {
      if (message.syncId > peer.lastReceivedMsgId || (peer.lastReceivedMsgId - message.syncId) > (2 ^ 16)
        || (!message.isUpdateSample)) {
        // old messages can be still processed but not update messages, because old updates are not important anymore

        // synchronization ids may be in range 0-2^16 so if the difference is greater than 128 it means that
        // the numbering goes from zero again
        if (message.syncId > peer.lastReceivedMsgId || peer.lastReceivedMsgId - message.syncId > (2 ^ 16)) {
          peer.lastReceivedMsgId = message.syncId;
        }
        this.sendMessage(NetworkMessages.NET_MESSAGE_RECEIVED, message);
      }
    }
  }


 /**
	 * Sends queued messages and re-sends those that weren't still confirmed
	 */
  protected sendMessages(time: number, peer: PeerContext) {
    this.network.setupUDPSender(peer.peerIp, peer.peerPort);

    let counter = 0;
    if (peer.messagesToSend.length !== 0) {

      for (let msg of peer.messagesToSend) {
        peer.lastSentMsgId++;
        if (peer.lastSentMsgId === 0) {
          peer.lastSentMsgId++; // zero is for undefined sync messages
        }
        // the syncId may differ for each peer, however the message is serialized into a stream for each peer anyway
        msg.syncId = peer.lastSentMsgId;
        msg.msgType = NetMsgTypes.DATA;

        if (msg.isReliable) {
          // reliable message has to be confirmed. Hence, there can't be two
          // reliable messages with the same time value
          msg.msgTime = time + (counter++);
          peer.unconfirmedMessages.set(msg.syncId, msg);
        }

        this.network.sendUDPMessage(this.applicationId, msg, time);
      }

      // send all messages that haven't been confirmed
      for (let [, val] of peer.unconfirmedMessages) {
        this.network.sendUDPMessage(this.applicationId, val, time);
      }

      peer.messagesToSend = [];
    }
  }
}
