/**
 * Module dependencies.
 */
import * as debugModule from 'debug';
const debug = debugModule('chat:client');
import * as crypto from 'crypto';
import { EventEmitter } from 'events';
import SocketWrapper from './socketwrapper';
import * as protocol from './protocol';
import fingerprint from 'key-fingerprint';
import Filter from './plugins/filters/filter';
import BotClient from './plugins/bots/botclient';
import { generateKeyPair } from './crypto/crypto';
import { World } from './app/canvas';
import { Snake } from './minigames/snake';
import { Pong } from './minigames/pong';
import { MiniGame } from './minigames/minigame';

/**
 * ChatClient class.
 */
export class Client {
  server_url: string; // String consisting of protocol, host, port and namespace
  nick: string;
  id: string | undefined; // String, we probably want to have a random id here eventually since SocketWrapper will give us a new socket id on every connect
  socket: any; // SocketWrapper Socket object //TODO
  eventHandler: EventEmitter;
  private_key!: string; // private key for the RSA key pair
  public_key!: string; // public key for the RSA key pair
  cli = false // false if user uses a browser, true if user uses the cli (default = false)
  verified: boolean; // if this is true, then the client is able to send commands to the server
  server_list: any; // list with trusted https servers //TODO remove any
  channels: Map<string, string> = new Map(); // All channels this client is in (format [name, password])
  allChannels: Set<string> = new Set(); // All channel names from existing channels
  directory: Map<string, string> = new Map(); // all the fingerprints of the contected clients with their local nickName
  colorDirectory: Map<string, string> = new Map(); // each connection has it's own color
  numberSentCommands: number; // A number that is unique per command for this user per for a "long enough" time
  loginCommandId = -1; // The id of the login command
  fingerPrint!: string;
  filters: Filter[];
  filtersIncoming: Filter[];
  activeBots: Map<string, BotClient>;
  helpCommands: Map<string, string[]>;
  publicKeys: Map<string, string>; // fingerprint: key public key element
  miniGame: MiniGame | null = null;
  inMinigame: Boolean = false;

  world: World | null = null;
  selectedWorld: string;
  canvas: HTMLCanvasElement | undefined;
  locationInVirtualWorld: number[] = []; // The x and y-coordinates of the user in the 2D-world.
  spriteNumber: number; // The number of the sprite of this client, for now it is an integer between 1 and 2
  orientationInVirtualWorld = 1; // The orientation of the user in the world represented by a number from 1 to 4.
  locationOfClients: Map<
    string,
    {
      nick: string;
      location: number[];
      orientation: number;
      spriteNumber: number;
      world: string
    }
  > = new Map(); // The location of all the other clients in the world described by a fingerprint that maps onto [nick, coordinates, orientation].

  tiles: string[][] = [
    // 2D-array that holds the static objects of the world as given by the server.
    ['w', 'w', 'w', 'w', 'w', 'w', 'w', 'w', 'w', 'w'],
    ['w', '.', '.', '.', '.', '.', '.', '.', '.', 'w'],
    ['w', '.', 'w', 'w', 'w', 'w', '.', '.', '.', 'w'],
    ['w', '.', 'w', '.', '.', 'w', '.', '.', '.', 'w'],
    ['w', '.', 'w', 'w', 'w', 'w', '.', '.', '.', 'w'],
    ['w', '.', '.', '.', '.', '.', '.', '.', '.', 'w'],
    ['w', '.', '.', '.', '.', '.', '.', 't', 't', 'w'],
    ['w', '.', '.', '.', '.', '.', '.', 't', 't', 'w'],
    ['w', '.', '.', '.', '.', '.', '.', '.', '.', 'w'],
    ['w', '.', '.', '.', '.', '.', '.', '.', '.', 'w'],
    ['w', 'w', 'w', 'w', 'w', 'w', 'w', 'w', 'w', 'w'],
  ];

  doorsMap: Map<string, number[]> = new Map();
  worldName = '';
  justSwitchedWorlds = false;

  colorList: string[] = ['#FF0000', /* Red */
    '#FFC000', /* Orange */
    '#FFFC00', /* Yellow*/
    '#FF0000', /* Green */
    '#00FFFF', /* Cyan = lightblue */
    '#FF0000', /* Magenta = purple*/
    '#ff006c', /* Vivid Raspberry */
    '#fe02a2', /* Shocking Pink */
    '#ffb3de', /* Light Hot Pink */
    '#06c2ac', /* Turquoise */
    '#56fcq2' /* Light green blue*/
  ];

  /**
   * @param {String} server_url   the server URL including protocol, host, port and namespace to connect to
   *                              e.g.: https://crzy.server.net:8889/admin-ns/
   * @param {String} nick         nick name to use in chat
   * @param {String} key          whether or not the server has a key pair
   */
  constructor(
    server_url: string,
    selectedWorld: string,
    nick?: string,
    key?: boolean,
    canvas?: HTMLCanvasElement,
    keys?: { publicKey: string; privateKey: string },
    cli?: boolean
  ) {
    this.server_url = server_url; // url for the server
    this.nick = nick!; // nick for the client
    this.selectedWorld = selectedWorld;
    this.eventHandler = new EventEmitter();
    this.verified = false; // client cannot send any messages until verified
    this.numberSentCommands = 0;
    this.canvas = canvas;

    if (typeof cli !== 'undefined') {
      this.cli = cli;
    }

    this.spriteNumber = Math.floor(Math.random() * 4) + 1; // TODO laat de user die kiezen

    debug(`Constructed new ChatClient "${nick}" @ ${server_url}`);

    // Read the server entries from the server list file
    // this.server_list = JSON.parse(fs.readFileSync('./bin/server_list.json').toString());
    this.server_list = {
      'https://localhost:3000': {
        cert: 'bin/cert.pem',
      },
      'wss://localhost:3000/': {
        cert: 'bin/cert.pem',
      },
      'https://localhost:25565': {
        cert: 'bin/cert.pem',
      }
    };

    // TODO
    // If the current url is in the trusted server list file, connect with certificate
    // if (server_url in this.server_list) {
    // this.socket = SocketWrapper.createSocket(this.server_url, { secure: true, rejectUnauthorized: true, ca: fs.readFileSync(this.server_list[this.server_url].cert).toString(), query: 'type=client' });
    // } else {
    debug(
      'ATTENTION - The key of this server is unknown.This server cannot be trusted.'
    );
    this.socket = SocketWrapper.createSocket(this.server_url, {
      secure: true,
      rejectUnauthorized: false,
      query: 'type=client',
    });
    // }

    this.setEventListeners();

    if (key) {
      debug('keyvalue: %o', key);
      debug('create new key');
      this.private_key = keys!.privateKey;
      this.public_key = keys!.publicKey;
      this.fingerPrint = fingerprint(this.public_key, 'sha256');
    } else {
      this.createKey(key!);
    }
    // plugin stuff
    this.filters = [];
    this.filtersIncoming = [];
    this.helpCommands = new Map();
    this.publicKeys = new Map();
    this.activeBots = new Map();
  }

  /**
       * Set all event listeners.
       */
  setEventListeners() {
    // Standard events of SocketWrapper
    SocketWrapper.OnSocket(this.socket, 'connect', () => this.onConnect());  // note this syntax to get 'this' correct in our member call
    SocketWrapper.OnSocket(this.socket, 'disconnect', (reason: unknown) => this.onDisconnect(reason));
    // Everything else is sent by this protocol
    SocketWrapper.OnSocket(this.socket, 'data', (data: protocol.S2CCommand) => this.onData(data));
    SocketWrapper.OnSocket(this.socket, 'reconnect_attempt', (attempt: number) => this.onReconnectAttempt(attempt));
  }
  /**
      * Our standard event handlers for dealing with SocketWrapper.
      */
  onConnect(): void {
    const prev_id = this.id;
    this.id = this.socket.id;
    debug(`Socket connect, prev_id=${prev_id}, new id=${this.id}`);
    // Check if this public key is the correct type (string)
    debug(typeof this.public_key);

    // Send a command to the server to authenticate this client (same as .emit function)
    this.loginCommandId = this.getCommandId(); // this way the challenge resulting in a login command will only be answered for the latest login command.
    SocketWrapper.sendRaw(this.socket, {
      id: this.loginCommandId,
      command: 'login',
      key: this.public_key,
      nick: this.nick,
      world: this.selectedWorld,
      timestamp: (new Date()).toISOString()
    });
  }

  /**
   * 'Lock' or remove the verification from the client, he cannot send
   * anymore messages.
   */
  onDisconnect(reason: unknown): void {
    debug(`Socket disconnect, we had id=${this.id}, reason=${reason}`);
    this.verified = false;
  }

  /**
   * Handles data from the server. Could be more elegant.
   * @param data 
   */
  onData(data: protocol.S2CCommand): void {
    // debug(`client received ${data.command}`)
    switch (data.command) {
      case 'message':
        this.onMessage(data);
        break;
      case 'success':
        this.onSuccess(data.id, data.data, data.to);
        break;
      case 'error':
        this.onError(data.errorCode, data.errorMsg);
        break;
      case 'event':
        this.onEvent(data.event, data.data);
        break;
    }
  }

  /**
   * If the key parameter is given on startup (--key), then use the keys in the bin folder
   * If the parameter is not given: create new private and public key 
   * @param key 
   */
  async createKey(key: boolean) {
    debug('keyvalue: %o', key);
    // if (!(key == true)) {
    debug('create new key');
    const keys = await generateKeyPair();
    this.private_key = keys.privateKey;
    this.public_key = keys.publicKey;
    this.fingerPrint = fingerprint(this.public_key, 'sha256');
    // } else {
    //     debug('read existing key');
    //     if (fs.existsSync('./../bin/privateKey.pem') && fs.existsSync('./../bin/publicKey.pem')) {
    //         this.private_key = fs.readFileSync('./../bin/privateKey.pem', {
    //             // format:'pem', type:'pkcs1'
    //         }).toString();
    //         this.public_key = fs.readFileSync('./../bin/publicKey.pem', {
    //             // format:'pem', type:'pkcs1'
    //         }).toString();
    //     }
    //     else throw new Error('No key files in ./bin');
    // }
    // debug('key : %o', this.public_key.toString());
  }

  /**
   * This is called when we receive a message from the server.
   */
  onMessage(data: protocol.S2CCommand): void {
    if (data.command != 'message') throw new Error('Invalid data type.');
    if (typeof data.msg.from != 'undefined' && data.msg.from != this.fingerPrint) this.world?.playSoundEffect('wup');
    const mystr = data.msg.message;
    const mystrArray = mystr.split(' ');

    if (
      mystrArray[0] == '-----BEGIN' &&
      mystrArray[1] == 'RSA' &&
      mystrArray[2] == 'PUBLIC'
    ) {
      this.publicKeys.set(data.msg.from!, mystr);
      return;
    }

    // decrypt channel encryption
    if (typeof data.msg.to != 'undefined' && (data.msg.to!.charAt(0) == '#')) {
      let mystr = this.decryptChannelMessage(data.msg.message, data.msg.to);
      const nickStr = mystr.split(':'); // Separate nickname and message
      const nick = nickStr[0];
      mystr = nickStr[1];
      mystr = this.filterMessage(mystr, data.msg.to);
      this.botOnMessage(data.msg.message, nick, data.msg.to);
      let args = { message: `[${nick}] ${mystr}`, from: this.directory.get(data.msg.from!), to: data.msg.to };
      if (typeof data.msg.metadata != 'undefined') {
        if (typeof data.msg.metadata.timestamp == 'string') {
          args = { message: `${data.msg.metadata.timestamp} [${nick}] ${mystr}`, from: this.directory.get(data.msg.from!), to: data.msg.to };
        }
      }
      this.eventHandler.emit('message', args);
    }

    // normal message: with from and to Direct Message
    else if (typeof data.msg.from !== 'undefined' && typeof data.msg.to !== 'undefined') {
      data.msg.message = this.filterMessage(data.msg.message, undefined);
      this.botOnMessage(
        data.msg.message,
        this.directory.get(data.msg.from!),
        null
      );

      let args;
      if (data.msg.to == 'all') {
        args = {
          message: data.msg.message,
          from: this.directory.get(data.msg.from!),
          to: 'all'
        };
        if (typeof data.msg.metadata != 'undefined') {
          if (typeof data.msg.metadata.timestamp == 'string') {
            args = {
              message: data.msg.metadata.timestamp + ' ' + data.msg.message,
              from: this.directory.get(data.msg.from!),
              to: 'all'
            };
          }
        }
      }
      else {
        args = {
          message: data.msg.message,
          from: this.directory.get(data.msg.from!),
          to: this.directory.get(data.msg.to!)
        };
        if (typeof data.msg.metadata != 'undefined') {
          if (typeof data.msg.metadata.timestamp == 'string') {
            args = {
              message: data.msg.metadata.timestamp + ' ' + data.msg.message,
              from: this.directory.get(data.msg.from!),
              to: this.directory.get(data.msg.to!)
            };
          }
        }
      }
      this.eventHandler.emit('message', args);
    }

    // no 'from:' send as anonymous
    else if (data.msg.from === undefined && data.msg.to !== undefined) {
      for (const [fingerprint,] of this.directory.entries()) {
        if (this.publicKeys.has(fingerprint)) {
          const buffer = Buffer.from(mystr, 'base64');

          let decryptedMessage = '';
          try {
            decryptedMessage = crypto
              .publicDecrypt(this.publicKeys.get(fingerprint)!, buffer)
              .toString('utf8');
          } catch (e) {
            debug('catch error');
          }
          if (decryptedMessage.startsWith('encryptedMessage: ')) {
            decryptedMessage = this.filterMessage(decryptedMessage, undefined);
            let args = { message: decryptedMessage, to: data.msg.to };
            if (typeof data.msg.metadata != 'undefined') {
              if (typeof data.msg.metadata.timestamp == 'string') {
                args = {
                  message: data.msg.metadata.timestamp + ' ' + decryptedMessage, to: data.msg.to
                };
              }
            }
            this.eventHandler.emit('message', args);
          }
        }
      }
    }

    // no 'to:' send to anonymous
    else if (
      data.msg.from !== undefined &&
      data.msg.to === undefined &&
      !/^#/.test(data.msg.from)
    ) {
      // Decrypt msg with own private key
      const buffer = Buffer.from(mystr, 'base64');
      let decryptedMessage = '';

      try {
        decryptedMessage = crypto
          .privateDecrypt(this.private_key, buffer)
          .toString('utf8');
      } catch (e) {
        debug('catch error: 250');
      }
      if (decryptedMessage.startsWith('message4U: ')) {
        let args = {
          message: decryptedMessage,
          from: this.directory.get(data.msg.from!),
        };
        if (typeof data.msg.metadata != 'undefined') {
          if (typeof data.msg.metadata.timestamp == 'string') {
            args = {
              message: data.msg.metadata.timestamp + ' ' + decryptedMessage,
              from: this.directory.get(data.msg.from!),
            };
          }
        }
        this.eventHandler.emit('message', args);
      }
    }
  }

  /**
   * Gives the bot messages this client receives
   * @param message
   */
  botOnMessage(
    text: string,
    nick: string | undefined,
    channel_name: string | null
  ) {
    for (const [, value] of this.activeBots.entries()) {
      value.onMessage({ nick, text, channel_name });
    }
  }

  /**
   * Filters incoming messages for the onMessage function
   * @param message
   * @param channel
   */
  filterMessage(message: string, channel: string | undefined): string {
    if (channel != undefined) {
      this.filtersIncoming.forEach((filter) => {
        if (filter.channelName == channel || filter.channelName == undefined) {
          message = filter.filter(message);
        }
      });
      return message;
    } else {
      this.filtersIncoming.forEach((filter) => {
        if (filter.channelName == undefined) {
          message = filter.filter(message);
        }
      });
      return message;
    }
  }

  /**
   * Look up the given channel's password, and decode the message using it.
   * @param message
   * @param channelName
   */
  decryptChannelMessage(message: string, channelName: string): string {
    if (!this.channels.has(channelName))
      throw new Error(`The user does not know channel ${channelName}`);
    debug('Decrypting channel message.');
    const key = crypto
      .createHash('sha256')
      .update(String(this.channels.get(channelName!)))
      .digest('base64')
      .substr(0, 32);

    const textParts = message.split(':');
    const iv = Buffer.from(textParts.shift()!, 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv('aes-256-ctr', key, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  }

  /**
   * Handles success commands from the server.
   * @param id
   * @param data
   */
  onSuccess(id: number, data?: protocol.JsonData, channel?: string) {
    if (id == this.loginCommandId) {
      if (data == undefined) throw new Error('no data is send');
      if (typeof data != 'string')
        throw new Error('Got challenge but verifiable data was not string.');
      this.onChallenge(data);
      this.loginCommandId = -1;
    } else if (typeof data == 'string') {
      debug(`data of successmessage= ${data}`);
      this.eventHandler.emit('serverMessage', { message: data, to: channel });
      // this.world?.playSoundEffect('woop2');
    }
  }

  /**
   * this function checks a gd. Otherwise this would fail and the server will know
   * that this client is untrustworthy
   *
   * @param verifiableData the data to perform the verification on
   */
  onChallenge(verifiableData: string): void {
    /**
     * source: https://www.sohamkamani.com/nodejs/rsa-encryption/
     */
    const signature = this.sign(Buffer.from(verifiableData)).toString('hex');

    SocketWrapper.sendRaw(this.socket, {
      id: this.getCommandId(),
      command: 'verify',
      verifiabledata: signature,
    });
  }

  sign(data: Buffer): Buffer {
    // TODO: are we assuming we can send Buffers?
    const signer = crypto.createSign('RSA-SHA256');
    signer.write(data);
    signer.end();
    return signer.sign({
      key: this.private_key, // crypto-browserify does not seem to support PSS padding correctly
    });
  }

  /**
   * Emit an error from the server.
   * @param errorCode
   * @param errorMsg
   */
  onError(errorCode: number, errorMsg?: string): void {
    debug(
      `Socket error, we have id=${this.id}, errorCode=${errorCode}, errorMsg=${errorMsg}`
    );
    const args = { message: `error code ${errorCode}, message: ${errorMsg}` };
    this.eventHandler.emit('error', args);
  }

  /**
   * Handles events from the server.
   * @param event
   * @param data
   */
  onEvent(event: string, data?: protocol.JsonData) {
    switch (event) {
      // User defined events
      case 'unlock':
        this.onUnlock();
        break;
      case 'forceDisconnect':
        this.onforceDisconnect(data);
        break;
      case 'askPublicKey':
        this.onAskPublicKey(data);
        break;
      case 'newUser':
        this.onNewUser(data);
        break;
      case 'removeUser':
        this.onRemoveUser(data);
        break;
      // Events concerning channels
      case 'clearAllChannels':
        this.allChannels = new Set();
        break;
      case 'addAllChannels':
        if (typeof data != 'string')
          throw new Error('Channel to add is of wrong type.'); // data is a string of channel names separated by :
        this.allChannels.add(data);
        break;
      case 'addChannel':
        if (typeof data != 'string')
          throw new Error('Channel to add is of wrong type.');
        // eslint-disable-next-line no-case-declarations
        const namePassword = data.split(':');
        this.channels.set(
          namePassword[0],
          namePassword[1] == undefined ? '' : namePassword[1]
        );
        this.eventHandler.emit('updateChannels', {});
        break;
      case 'delChannel':
        if (typeof data != 'string')
          throw new Error('Channel to delete is of wrong type.');
        this.channels.delete(data);
        break;
      case 'delAllChannel':
        if (typeof data != 'string')
          throw new Error('Channel to delete is of wrong type.');
        this.allChannels.delete(data);
        break;
      // Events concerning the virtual world
      case 'getWorld':
        if (!this.cli) {
          this.onGetWorld(data);
        }
        break;
      case 'worldUpdate':
        if (!this.cli) {
          this.onWorldUpdate(data);
        }
        break;
      case 'startMinigame':
        if (!this.cli) {
          this.startMinigame(data);
        }
        break;
      case 'leaveMinigame':
        if (!this.cli) {
          this.leaveMinigame();
        }
        break;
    }
  }

  // add startminigame to protocol TODO
  startMinigame(data: any) {
    const playButton = <HTMLSpanElement>document.getElementById('playButton');
    playButton.className = 'material-icons buttonBox';
    playButton.onclick = () => {
      switch (data) {
        case 'snake':
          try {
            this.miniGame = new Snake(this, document, data);
          } catch (e) {
            console.log(e);
          }
          break;
        case 'pong':
          try {
            this.miniGame = new Pong(this, document, data); // TODO change
          } catch (e) {
            console.log(e);
          }
          break;
      }
    };
  }

  /**
   * Delete play button after passing minigame table
   * @param data
   */
  leaveMinigame() {
    const playButton = <HTMLSpanElement>document.getElementById('playButton');
    playButton.className = 'material-icons unavailableButtonBox';
    playButton.onclick = () => { return false };
  }

  /**
   * Get the virtual world from the server.
   * Function is called after the client authentication
   */
  onGetWorld(data: protocol.JsonData | undefined): void {
    const previousWorld = this.worldName;
    if (Array.isArray(data)) {
      if (this.isStringMatrix(data[0])) {
        this.tiles = data[0];
      }
      if (this.isNumberArray(data[1])) {
        this.locationInVirtualWorld = [data[1][0], data[1][1]];
      }
      if (typeof data[2] == 'string') {
        this.locationOfClients = new Map(JSON.parse(data[2]));
        this.spriteNumber = this.locationOfClients.get(this.fingerPrint)!.spriteNumber;
        this.worldName = this.locationOfClients.get(this.fingerPrint)!.world;
      }
      if (typeof data[3] == 'string') {
        this.doorsMap = new Map(JSON.parse(data[3]));
      }
    }

    if (this.world && this.world.justChangedWorld) {
      this.world.setTiles(this.tiles);
      this.world.setAllClients(this.locationOfClients); // draws the map with users and sets canvas.locationClients
      this.world.userPos = this.locationInVirtualWorld;
      this.world!.justChangedWorld = false;
      if (this.world) {
        if (previousWorld == '') this.world.joinWorldChannel(this.worldName);
        else {
          this.world.leaveWorldChannel(previousWorld);
          this.world.joinWorldChannel(this.worldName);
        }
        if (this.world.gpsActive)
          this.world.setGPStoUser(this.world.gpsTarget.nick);
      }
    }
    if (this.world) {
      if (previousWorld == '') this.world.joinWorldChannel(this.worldName);
      else {
        this.world.leaveWorldChannel(previousWorld);
        this.world.joinWorldChannel(this.worldName);
      }
      if (this.world.gpsActive)
        this.world.setGPStoUser(this.world.gpsTarget.nick);
    }
    else if (this.canvas && this.canvas.getContext('2d')) {
      this.world = new World(
        this.tiles,
        this.locationInVirtualWorld,
        this.orientationInVirtualWorld,
        this.locationOfClients,
        this.canvas,
        this.canvas.getContext('2d')!,
        this
      );
      this.world.justChangedWorld = true;
    } else alert('Something went wrong setting the world!');
    debug(
      'THESE ARE THE LOCATIONS OF THE OTHER CLIENTS: ',
      this.locationOfClients
    );

    if (this.world) {
      if (previousWorld == '') this.world.joinWorldChannel(this.worldName);
      else {
        this.world.leaveWorldChannel(previousWorld);
        this.world.joinWorldChannel(this.worldName);
      }
      if (this.world.gpsActive)
        this.world.setGPStoUser(this.world.gpsTarget.nick);
    }

    for (const [user, info] of this.world!.locationClients) {
      console.log(user); console.log(info);
    }

  }

  /**
   * Get an update from another user that was broadcasted by the server giving an update on a users new position and orientation.
   * @param data
   */
  onWorldUpdate(data: protocol.JsonData | undefined): void {
    if (Array.isArray(data)) {
      if (typeof data[0] != 'string')
        throw new Error(
          'Reconnect attempt event was fired without a valid attempt number.'
        );
      if (typeof data[1] != 'string')
        throw new Error(
          'Reconnect attempt event was fired without a valid attempt number.'
        );

      const infoArray = JSON.parse(data[1]);

      const locationClients = new Map;
      for (let i = 0; i < infoArray.length; i++) {
        const location = infoArray[i].location;
        const orientation = infoArray[i].orientation;
        const spriteNumber = infoArray[i].spriteNumber;
        const animationProgress = infoArray[i].animationProgress;
        const nick = infoArray[i].nick;
        const world: string = infoArray[i].world;
        locationClients.set(infoArray[i].fingerprint, { nick, location, orientation, spriteNumber, animationProgress, world });
        this.locationOfClients.set(infoArray[i].fingerprint, { nick, location, orientation, spriteNumber, world });
        if (this.world!.gpsActive && nick == this.world!.gpsTarget.nick && location !== this.world!.gpsTarget.location && world == this.worldName)
          this.world!.setGPStoUser(nick);
      }
      this.world!.justChangedWorld = false;

      if (this.world) this.world.setLocationClients(locationClients);

      debug(
        'THESE ARE THE LOCATIONS OF THE OTHER CLIENTS: ',
        this.locationOfClients
      );
    }
  }

  /**
   * Checks if the given value is a matrix of strings.
   */
  isStringMatrix(value: any): value is string[][] {
    if (value instanceof Array) {
      value.forEach(function (element1) {
        if (element1 instanceof Array) {
          element1.forEach((element2) => {
            if (typeof element2 !== 'string') {
              return false;
            }
          });
        } else {
          return false;
        }
      });
      return true;
    }
    return false;
  }

  /**
   * Checks if the given array is an array of numbers.
   */
  isNumberArray(value: any): value is number[] {
    if (value instanceof Array) {
      value.forEach(function (item) {
        if (typeof item !== 'number') {
          return false;
        }
      });
      return true;
    }
    return false;
  }

  isCorrectClientLocationsArray(
    value: any
  ): value is [string, string, number[], number][] {
    if (value instanceof Array) {
      value.forEach(function (element1) {
        if (element1 instanceof Array) {
          if (typeof element1[0] !== 'string') {
            return false;
          }
          if (typeof element1[1] !== 'string') {
            return false;
          }
          if (element1[2] instanceof Array) {
            if (typeof element1[2][0] !== 'number') {
              return false;
            }
            if (typeof element1[2][1] !== 'number') {
              return false;
            }
          } else {
            return false;
          }
          if (typeof element1[3] !== 'number') {
            return false;
          }
        } else {
          return false;
        }
      });
      return true;
    }
    return false;
  }

  /**
   * 'Unlock' or verify the client, he is now able to send commands.
   */
  onUnlock(): void {
    this.verified = true;
    debug('verified: %o', this.verified);
    if (this.verified == true) {
      this.eventHandler.emit('serverMessage', {
        message: 'Connected to ' + this.server_url + '!',
      });
    }
  }

  /**
   * prints how many reconnect attempts this client has made
   *
   * @param attemptNumber
   */
  onReconnectAttempt(attemptNumber: number): void {
    if (typeof attemptNumber != 'number')
      throw new Error(
        'Reconnect attempt event was fired without a valid attempt number.'
      );
    debug(`Reconnect attempt ${attemptNumber}`);
    if (attemptNumber % 3 == 0) {
      this.eventHandler.emit('error', { message: 'Reconnecting.' });
    } else if (attemptNumber % 3 == 1) {
      this.eventHandler.emit('error', { message: 'Reconnecting..' });
    } else {
      this.eventHandler.emit('error', { message: 'Reconnecting...' });
    }
  }

  /**
   * Print a message on a force disconnect.
   * @param reason reason for being disconnected
   */
  onforceDisconnect(data: protocol.JsonData | undefined): void {
    if (typeof data != 'string') data = 'no reason given.';
    this.eventHandler.emit('forceDisconnect', {
      message: 'Kicked from server:' + data,
    });
  }

  /**
   * Send the public key hash to the server.
   * @param data
   */
  onAskPublicKey(data: protocol.JsonData | undefined): void {
    if (typeof data != 'string') return;
    // this.send({
    //   command: 'message',
    //   id: this.getCommandId(),
    //   msg: {
    //     message: this.public_key,
    //     from: this.getPublicKeyHash(),
    //     to: data,
    //   },
    // });
  }

  /**
   * When a 'newUser' event is triggered from the server, the client add the user its directory.
   * TODO add to world?
   * @param data
   */
  onNewUser(data: protocol.JsonData | undefined) {
    if (Array.isArray(data)) {
      if (typeof data[0] !== 'string')
        throw new Error('first argument has to be a string');
      if (typeof data[1] !== 'string')
        throw new Error('second argument has to be a string');
      const nick = data[0];
      const fingerprint = data[1];
      if (!this.directory.has(fingerprint)) {
        this.directory.set(fingerprint, nick);
      }
      if (!this.colorDirectory.has(nick)) {
        this.colorDirectory.set(nick, this.colorList[Math.floor(Math.random() * this.colorList.length)]);
      }
      if (this.verified)
        this.eventHandler.emit('serverMessage', {
          message: `${nick} has joined the server`,
          to: 'MAIN CHANNEL'
        });
      this.send({
        command: 'user-info',
        userId: data[1],
        id: this.getCommandId(),
      });
    }
    this.eventHandler.emit('updateDirectory', {});
  }

  /**
   * When a 'removeUser' event is triggered from the server, the client removes the user from its directory
   * and from its users in the virtual world.
   * TODO remove from world?
   * @param data
   */
  onRemoveUser(data: protocol.JsonData | undefined) {
    if (Array.isArray(data)) {
      if (typeof data[0] !== 'string')
        throw new Error('first argument has to be a string');
      if (typeof data[1] !== 'string')
        throw new Error('second argument has to be a string');

      const nick = data[0];
      const fingerprint = data[1];
      // if (!this.cli) {
      //   const location = this.locationOfClients.get(fingerprint)!.location;
      // }

      if (this.directory.has(fingerprint)) this.directory.delete(fingerprint);
      if (this.colorDirectory.has(nick)) this.directory.delete(nick);
      if (this.verified)
        this.eventHandler.emit('serverMessage', {
          message: `${nick} has left the server`,
        });
      if (this.locationOfClients.has(fingerprint)) {
        this.locationOfClients.delete(fingerprint); // remove from locations in world.
      }
      if (this.world?.gpsTarget.nick == data[0])
        this.world.deactivateGPStoUser();
    }
  }

  /**
   * Emit a message from the server.
   * @param serverMessage
   */
  onServerMessage(serverMessage: unknown): void {
    this.eventHandler.emit('serverMessage', { message: serverMessage });
  }

  /**
   * Should be called whenever the user wants to updates something on his state.
   * First, the permission of the server needs to be asked. If the permission is granted, the server has changed its
   * datastructures and has broadcasted the changes to all other connected clients.
   * @param futureUserPos
   * @param newOrientation
   */
  public updateUserInWorld(futureUserPos: number[], newOrientation: number): void {
    this.send({
      id: this.getCommandId(),
      command: 'update-user-in-world',
      location: futureUserPos,
      orientation: newOrientation,
      spriteNumber: this.spriteNumber,
    });
  }

  /**
   * 
   * @param data 
   */
  public updateUserSpriteInWorld(spritenumber: number): void {
    this.send({
      id: this.getCommandId(),
      command: 'update-user-in-world',
      location: this.locationInVirtualWorld,
      orientation: this.orientationInVirtualWorld,
      spriteNumber: spritenumber,
    })
  }

  changeWorld(xCoord: number, yCoord: number): void {
    let worldNameFromCoords = '';
    for (const [key, value] of this.doorsMap) {
      if (value[0] == yCoord && value[1] == xCoord) {
        worldNameFromCoords = key;
        break;
      }
    }

    this.id = this.socket.id;

    if (worldNameFromCoords !== '') {
      SocketWrapper.sendRaw(this.socket, {
        id: this.getCommandId(),
        command: 'change-world',
        fromWorld: this.worldName,
        toWorld: worldNameFromCoords
      });
    }
  }

  /**
   * Our chat functions.
   */

  /**
   * Send a command to the server.
   *
   * If the user is not verified, he can't send any commands.
   * If the users wants to send a command and they are not verified yet then
   * the commands will be executed when unlock is called
   *
   * @param data
   */
  send(data: protocol.C2SCommand): void {
    debug('Emitting command=%o, args=%o', data);
    if (this.verified) {
      SocketWrapper.sendRaw(this.socket, data); // we could add a callback for acknowledgement signalling
    } else {
      debug('verified: ' + this.verified);
      SocketWrapper.OnSocket(
        this.socket,
        'data',
        (unlockData: protocol.S2CCommand) => {
          if (unlockData.command == 'event' && unlockData.event == 'unlock')
            SocketWrapper.sendRaw(this.socket, data);
        }
      );
    }
  }

  /**
   * Returns the given channel's password.
   * @param {String} channelName
   */
  getChannelPassword(channelName: string): string | undefined {
    return this.channels.get(channelName);
  }

  /**
   * Sets the given channel's password to the given password
   * @param channelname
   * @param password
   */
  setPassword(channelname: string, password: string): void {
    if (this.channels.has(channelname)) {
      this.channels.set(channelname, password);
    }
  }

  /**
   * Return a new, unique command id.
   * Eventually we will want to calculate some hash over the sent message instead.
   */
  getCommandId(): number {
    return ++this.numberSentCommands;
  }

  /**
   * Get the fingerprint of the user's private key, used in from and to fields in commands.
   */
  getPublicKeyHash(): string {
    return this.fingerPrint;
  }

  /**
   * changes the nickname of a user in the local directory
   *
   * @param fingerprint the fingerprint whomst nickname you want to change
   * @param newNickname the nickname
   */

  changeNickInDirectory(fingerprint: string, newNickname: string): void {
    this.directory.set(fingerprint, newNickname);
  }

  /**
   * Add a filter of given type to the client.
   * @param type      The type of the filter
   * @param args      The arguments needed to create a filter
   */
  addFilter(type: string, args: string[]): void {
    try {
      if (args[1] == 'incoming') {
        this.filtersIncoming.push(new Filter(type, args, args[2]));
      } else if (args[1] == 'outgoing') {
        this.filters.push(new Filter(type, args, args[2]));
      }

      debug(`Added filter of type ${type} to the client`);
    } catch (e) {
      debug(`Couldn't find filter of type "${type}"`);
    }
  }
  /**
   * Remove the top filter from the client, if it has one.
   * @param args      The arguments that decide wich type of filter will be popped
   */
  removeFilter(args: string): Filter | undefined {
    let filter;
    if (args == 'incoming') {
      filter = this.filtersIncoming.pop();
    } else {
      filter = this.filters.pop();
    }

    if (typeof filter === 'object')
      debug(`Removed filter of type ${filter.type}`);
    else
      debug('Attempted to remove filter from client, but the client has none.');
    return filter;
  }

  loadBotPlugin(
    url: string,
    argv: {
      botType: string;
      botNick: string;
      botOwner: string;
      channelName: string | null;
    },
    clientOwner: Client
  ) {
    const botclient = new Client(url, argv.botNick);
    const bot = new BotClient(
      url,
      argv.botType,
      argv.botNick,
      argv.botOwner,
      clientOwner,
      argv.channelName,
      botclient
    );
    this.activeBots.set(argv.botNick, bot); // + "-" + argv.botType
  }
}

/**
 * Module exports.
 */
export default Client;