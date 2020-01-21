import * as ECSA from '../pixi-component';
import { NetworkManager } from './network-manager';
import { NetOutputMessage, NetInputMessage, NetMsgTypes, NetData } from './net-message';
import { checkTime } from '../../src/utils/functions';

/**
 * Messages for ECSA library that can be intercepted
 */
export enum NetworkMessages {
  NET_CONNECTED = 'NET_CONNECTED',
  NET_MESSAGE_RECEIVED = 'NET_MESSAGE_RECEIVED',
  NET_DISCONNECTED = 'NET_DISCONNECTED',
  NET_CONNECTION_LOST = 'NET_CONNECTION_LOST'
}

/**
 * State of a client
 */
export enum ClientState {
  NONE = 'NONE', // initial state
  DISCOVERING = 'DISCOVERING', // looking for servers
  CONNECTING = 'CONNECTING', // connecting to a server
  CONNECTED = 'CONNECTED' // connected and communicating
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
export class NetworkClient extends ECSA.Component {
  // number of broadcasts per second
  public broadcastingFrequency = 0.5;
  // number of sending cycles per second
  public sendingFrequency = 10;
  // number of reconnects per second
  public connectingFrequency = 2;
  // number of beep messages per seconds (beep messages only let the server know the peer is still there)
  public beaconFrequency = 2;

  public lastBroadcastTime = 0;
  public lastSendingTime = 0;
  public lastConnectingTime = 0;
  // number of seconds after which the connection will be made again
  public reconnectTimeout = 6;
  // number of seconds the per will be automatically disconnected
  public disconnectTimeout = 12;
  // set of ip adresses of discovered hosts
  public discoveredHosts: Set<string> = new Set();
  // identifier of this client
  public clientId = 0;

  // indicator whether the client should connect to the first host it finds
  public autoConnect = false;

  // communicator
  public network: NetworkManager = null;
  // current network state
  private _networkState: ClientState = ClientState.NONE;
  // application id
  private _applicationId: number;
  // ip address of the host
  private _hostIp = '';
  // port of the host
  private _hostPort: number;
  // port of the client
  private _clientPort: number;

  // collection of ids of messages that haven't been confirmed yet
  private forConfirmationMessageIds: Set<number> = new Set();
  // collection of arrival times of not confirmed messages (used for optimization...)
  private forConfirmationMessageTimes: Set<number> = new Set();
  // identifier of last received message
  private lastReceivedMsgId: number = -1;
  // time of creation of the last received message
  private lastReceivedMsgTime: number = 0;
  // identifier of the last message that was sent to the host
  private lastSentMsgId: number = 0;

  // collection of messages that will be sent in the next update
  private messagesToSend: NetOutputMessage[] = [];


  /**
   * Gets network current status
   */
  get networkState() {
    return this._networkState;
  }

 /**
	 * Gets an indicator whether the peer is connected to a host
	 */
  get isConnected() {
    return this.networkState === ClientState.CONNECTED;
  }

 /**
	 * Gets id of current application
	 */
  get applicationId() {
    return this._applicationId;
  }

 /**
	 * Gets ip address of the host
	 */
  get hostIp() {
    return this._hostIp;
  }

 /**
	 * Gets port of the host
	 */
  get hostPort() {
    return this._hostPort;
  }

  /**
   * Initializes broadcasting mode, trying to found a peer
   * @param applicationId id of the current application
   * @param clientPort listening port
   * @param hostPort port of the target host
   * @param hostIp ip address of the host. If empty, the default subnets (192.x.x.x and 10.x.x.x) will be searched
   */
  initClient(applicationId: number, clientPort: number, hostPort: number, hostIp: string = '') {
    this.close(0);

    this._applicationId = applicationId;
    this._hostIp = hostIp;
    this._hostPort = hostPort;
    this._clientPort = clientPort;
    this.clientId = 0;
    this.forConfirmationMessageIds = new Set();
    this.forConfirmationMessageTimes = new Set();

    console.log(`Initialized client for application ${applicationId} on client port ${clientPort} and host port ${hostPort}`);
    this.network = new NetworkManager();
    this.network.setupUDPReceiver(clientPort, 10000); // buffer size is 10 kiB by default
    this._networkState = ClientState.DISCOVERING;
  }


 /**
  * Pushes a message that will be sent with the next sending cycle
  */
  pushMessageForSending(type: NetMsgTypes, action: number, time: number, data?: NetData, isUpdateSample?: boolean, isReliable?: boolean) {
    let netMsg = new NetOutputMessage(0, this.clientId, type, action, data, time, isUpdateSample, isReliable);

    // only when the communicator is in CONNECTED state there
    // could be sent more than one message at a time
    if (this.networkState !== ClientState.CONNECTED) {
      this.messagesToSend = [];
    }

    this.messagesToSend.push(netMsg);
  }


 /**
  * Closes the connection
  */
  close(time: number) {
    console.log(`Closing client ${this.clientId}`);

    if (this.network) {
      if (this.networkState === ClientState.CONNECTED) {
        let msg = new NetOutputMessage(0, this.clientId, NetMsgTypes.DISCONNECT);
        this.network.sendUDPMessage(this.applicationId, msg, time);
      }

      this.network.closeUDP();
      this.network = null;
    }

    this.lastReceivedMsgId = -1;
    this.lastSentMsgId = 0;
    this.messagesToSend = [];
    this.lastReceivedMsgTime = 0;
  }

  onUpdate(delta: number, absolute: number) {
    if (this.network) {
      switch (this.networkState) {
        case ClientState.DISCOVERING:
          this.handleDiscoveringState(absolute);
          break;
        case ClientState.CONNECTING:
          this.handleConnectingState(absolute);
          break;
        case ClientState.CONNECTED:
          this.handleConnectedState(absolute);
          break;
      }
    }
  }

  /** Connects to host with given ip address */
  protected connectToHost(ip: string, port: number) {
    this._hostIp = ip;
    this._hostPort = port;
    console.log(`Connecting to host ${ip} on port ${port}`);
    this.network.setupUDPSender(ip, port);
    this._networkState = ClientState.CONNECTING;
  }

  /** Update for discovering state */
  protected handleDiscoveringState(time: number) {
    // check if it is time to broadcast
    if (checkTime(this.lastBroadcastTime, time, this.broadcastingFrequency)) {
      this.lastBroadcastTime = time;
      let msg = new NetOutputMessage(this.lastReceivedMsgId, 0, NetMsgTypes.DISCOVER_REQUEST);
      console.log(`Broadcasting`);
      // send broadcast messsages to localhost
      if (this.hostIp === '') {
        this.network.setupUDPSender('192.168.0.255', this._hostPort);
        this.network.sendUDPMessage(this.applicationId, msg, time);
        this.network.setupUDPSender('10.16.0.255', this._hostPort);
        this.network.sendUDPMessage(this.applicationId, msg, time);
        this.network.setupUDPSender('127.0.0.1', this._hostPort);
        this.network.sendUDPMessage(this.applicationId, msg, time);
      } else {
        this.network.setupUDPSender(this.hostIp, this.hostPort);
        this.network.sendUDPMessage(this.applicationId, msg, time);
      }
      // check for discover responses
      let message = this.network.receiveUDPMessage(this.applicationId, time);
      if (message && (message.msgType === NetMsgTypes.DISCOVER_RESPONSE)) {
        console.log(`Found host ${message.sourceIp}`);
        // notify other components
        this.sendMessage(NetworkMessages.NET_MESSAGE_RECEIVED, message);

        // update list of discovered servers
        this.discoveredHosts.add(message.sourceIp);
        this.lastReceivedMsgTime = time;

        // connect to host automatically
        if (this.autoConnect) {
          this.connectToHost(message.sourceIp, message.sourcePort);
        }
      }
    }
  }

  /** Update for connecting state */
  protected handleConnectingState(time: number) {
    if (checkTime(this.lastConnectingTime, time, this.connectingFrequency)) {
      this.lastConnectingTime = time;
      // send connection request. Client Id is 0 when not assigned yet, however in case of reconnect, the id is already set
      let msg = new NetOutputMessage(0, this.clientId, NetMsgTypes.CONNECT_REQUEST);
      this.network.sendUDPMessage(this.applicationId, msg, time);
    }

    if (this.lastReceivedMsgTime === 0) {
      this.lastReceivedMsgTime = time;
    }
    // check connection response
    let message = this.network.receiveUDPMessage(this.applicationId, time);

    if (message && message.msgType === NetMsgTypes.CONNECT_RESPONSE) {
      console.log(`Connected to host ${message.sourceIp}, assigned peer id ${message.peerId}`);
      this.lastReceivedMsgTime = time;
      this._networkState = ClientState.CONNECTED;
      this.clientId = message.peerId;

      // notify other components
      this.sendMessage(NetworkMessages.NET_CONNECTED, message);
    } else if ((time - this.lastReceivedMsgTime) > this.disconnectTimeout * 1000) {
      // no message received for XXX seconds -> disconnect
      console.log(`No message received from host for ${this.disconnectTimeout}s, disconnecting...`);
      this.sendMessage(NetworkMessages.NET_DISCONNECTED);
      this.initClient(this.applicationId, this._clientPort, this.hostPort, this.hostIp);
    }
  }

  /** Update for communicating state */
  protected handleConnectedState(time: number) {
    // process until there are no received messages
    while (true) {
      let message = this.network.receiveUDPMessage(this.applicationId, time);

      if (!message) {
        break;
      }
      const type = message.msgType;
      if (type === NetMsgTypes.DATA) {
        this.lastReceivedMsgTime = time;
        this.processUpdateMessage(message);
      }
    }

    if (checkTime(this.lastSendingTime, time, this.sendingFrequency)) {
      // send all messages
      this.sendMessages(time);
    }

    if ((time - this.lastReceivedMsgTime) > this.reconnectTimeout * 1000) {
      // no msg received from host for XXX second -> reconnect
      console.log(`No message received from host for ${this.reconnectTimeout}s, reconnecting...`);
      this._networkState = ClientState.CONNECTING;
      this.sendMessage(NetworkMessages.NET_CONNECTION_LOST);
    }
  }

  /** Processes a message from the host */
  protected processUpdateMessage(message: NetInputMessage) {
    if (message.isReliable && !this.forConfirmationMessageIds.has(message.syncId)) {
      console.log(`Received reliable message ${message.syncId}`);
      // got a reliable message that must be confirmed -> update collection of messages for acceptation
      this.forConfirmationMessageIds.add(message.syncId);
    }

    if (!this.forConfirmationMessageTimes.has(message.msgTime)) {
      if (message.syncId > this.lastReceivedMsgId || (this.lastReceivedMsgId - message.syncId) > (2 ^ 16)
        || (!message.isUpdateSample)) {
        // old messages can be still processed but not update messages, because old updates are not important anymore
        // synchronization ids may be in range 0-2^16 so if the difference is greater than 2^16 it means that
        // the numbering goes from zero again
        if (message.syncId > this.lastReceivedMsgId || this.lastReceivedMsgId - message.syncId > (2 ^ 16)) {
          this.lastReceivedMsgId = message.syncId;
        }

        this.sendMessage(NetworkMessages.NET_MESSAGE_RECEIVED, message);
      }

      if (message.isReliable) {
        this.forConfirmationMessageTimes.add(message.msgTime);

        if (this.forConfirmationMessageTimes.size > 512) {
          // TODO remove messages that are not relevant anymore
        }
      }
    }
  }

 /**
	 * Sends queued messages and re-sends those that weren't still confirmed
	 */
  protected sendMessages(time: number) {
    if (this.messagesToSend.length !== 0) {

      for (let msg of this.messagesToSend) {
        this.lastSentMsgId++;
        if (this.lastSentMsgId === 0) {
          this.lastSentMsgId++; // zero is for for undefined sync messages
        }

        msg.syncId = this.lastSentMsgId;
        msg.peerId = this.clientId;

        if (this.forConfirmationMessageIds.size !== 0) {
          // if there is at least one id that hasn't been confirmed
          // yet, send it with the message
          const lastItem = this.forConfirmationMessageIds.values().next();
          msg.confirmId = lastItem.value;
          this.forConfirmationMessageIds.delete(lastItem.value);
        }

        msg.msgType = NetMsgTypes.DATA;
        this.network.sendUDPMessage(this.applicationId, msg, time);
      }

      this.lastSendingTime = time;
      this.messagesToSend = [];
    } else if (this.forConfirmationMessageIds.size !== 0) {
      // send the rest of confirmation messages separately (not very optimal -> we should send it as one message)
      for (let acc of this.forConfirmationMessageIds) {
        let msg = new NetOutputMessage(1, this.clientId, NetMsgTypes.ACCEPT);
        msg.msgTime = time;
        msg.confirmId = acc;
        this.network.sendUDPMessage(this.applicationId, msg, time);
      }

      this.forConfirmationMessageIds.clear();
    } else if (checkTime(this.lastSendingTime, time, this.beaconFrequency)) {
      // if there is nothing to send, we have to send a beep message in order to have the server know we're still here
      this.lastSendingTime = time;
      let msg = new NetOutputMessage(1, this.clientId, NetMsgTypes.BEACON);
      msg.msgTime = time;
      this.network.sendUDPMessage(this.applicationId, msg, time);
    }
  }
}
