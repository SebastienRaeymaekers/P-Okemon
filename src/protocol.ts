import { EventEmitter } from 'events';
import { ReadLine } from 'readline';
import { SWServer } from './socketwrapper';

export interface ChatClient {
    server_url: string;
    nick: string;
    eventHandler: EventEmitter;
    // eslint-disable-next-line no-empty-pattern
    send: (name: string, { }) => void;
    getChannelPassword: (args: string) => string | undefined;
}

export interface CLI {
    chatClient: ChatClient;
    defaultCmd: string;
    cmdList: string[];
    rl: ReadLine;
    printMessage: (string: string) => void;
    printAlert: (string: string) => void;
}

export interface CmdManager {
    cli: CLI;
    // eslint-disable-next-line @typescript-eslint/ban-types
    getCommands: Function;
    getCommandsAsList: () => string[];
    addCommand: (command: Command) => void;
    removeCommand: (command: Command) => void;
    execute: (cli: CLI, commandName: string, args: string[]) => void;
}

export interface AutoComplete {
    cli: CLI;
    buildCommandTree: (cmdList: string[]) => void;
    buildLanguageTree: (lang: string) => void;
}

// export type Command = {name: string, command: {name: string, execute: (args: string[]) => void}};
export interface Command {
    name: string;
    argumentsPattern: string[];
    client: ChatClient;
    execute: (args: string[]) => void;
}
export type DefaultAnswer = {
    [id: string]: { weight: number; responses: string[] };
};
export type BotOption = {
    key: string;
    options: {
        description: string;
        type: string;
        default: string | number | boolean | undefined;
    };
};
export type BotExample = { command: string; description: string };

// for msgs
export type ClientOnServer = {
    nick: string;
    socketID: string;
    timestamp: Date;
    location: number[];
    orientation: number;
    spriteNumber: number;
    world: string;
    animationProgress: number
};

/*
The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL
NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED",  "MAY", and
"OPTIONAL" in this document are to be interpreted as described in
RFC 2119.
*/

type Id = string;
type CommandId = number;

export type MessageArgs = {
    message: string;
    /** user hash*/
    from?: Id; // voor berichten van client naar server weet de server al wat onze hash is, dus is dit niet echt nodig
    /** target hash of user/channel/null (shout to all)*/
    to?: Id;
    metadata?: {
        // Object to hold extra data that isn't fully regulated and isn't required to have a basic interpreation
        // of the msg
        color?: string;
        /*
            Timestamps
            In UTC.
            Kies ISO formaat.
            const ts_string = (new Date()).toISOString()'
            const ts = new Date(ts_string);
            Merk de Z op op het einde van de string...
            Deze staat voor zero offset van UTC.
            Uitgesproken als Zulu in het ICAO fonetisch alfabet...
        */
        timestamp?: string;
        signature?: string;
    } & Record<string, JsonData>; // other data, possibly added by plugins.
    // Encryption plugins might want to add a field like `encryptedMetadata` to store encrypted versions of the old metadata
};

export type JsonData =
    | string
    | number
    | boolean
    | null
    | JsonDataObject
    | JsonData[];
export interface JsonDataObject {
    [property: string]: JsonData;
}

export type ChannelProperties = {
    /** the public key of this channel? */
    publicKey?: string;
    /** Whether history is saved or not */
    saveHistory: boolean;
    /** Whether people not in the channel MAY sent msg to this channel */
    messageOutside: boolean;
};

export type UserProperties = {
    /** the public key of this user */
    publicKey: string;
    /** Whether the user is online */
    isConnected: boolean;
};

/*
    CLIENT TO SERVER COMMANDS START HERE
*/

export type MessageCommand = {
    // The message to send
    msg: MessageArgs;

    // Send a message `msg`
    //
    // MUST fail when a channel doesn't exist or a user is not online
    // SHOULD fail if a user is not allowed to send a msg to this channel
    command: 'message';
};

export type ChannelCommand =
    | ChannelJoinCommand
    | ChannelLeaveCommand
    | ChannelRequestCommand
    | ChannelHistoryCommand
    | ChannelInfoCommand
    | ChannelDeleteCommand
    | ChannelCreateCommand
    | ChannelListCommand
    | ChannelListInfoCommand
    | ChannelAllowExternal; // Added by us

export type ChannelJoinCommand = {
    // The channel id
    channelName: Id;

    // Join channel `channelId`
    //
    // MUST fail when a channel doesn't exist.
    // MAY fail if a user is already in a channel
    command: 'channel-join';
};

export type ChannelLeaveCommand = {
    // The channel id
    channelName: Id;

    // Leave channel `channelId`
    //
    // MUST fail when a channel doesn't exist.
    // MAY fail when a user is not in the channel.
    command: 'channel-leave';
};

export type ChannelHistoryCommand = {
    // The channel id
    channelName: Id;

    // Get the old messages of this channel
    //
    // MUST fail when a channel does not exist
    // otherwise the success data MUST be of type MessageArgs[] (The server MAY do so without the to field)
    //
    // the History could be very long, might need some system to split up
    command: 'channel-history';
};

export type ChannelInfoCommand = {
    // The channel id
    channelName: Id;

    // Get info about a channel
    //
    // MUST fail when a channel does not exist
    // otherwise the success data MUST be of type ChannelProperties
    // could potentially be used to get the public key/other info of a user instead of user-info
    command: 'channel-info';
};

export type ChannelDeleteCommand = {
    // The channel id
    channelName: Id;
    // Delete a channel
    //
    // MUST fail if the channel does not exist
    // MUST fail if the user does not have the right to do so
    command: 'channel-delete';
};

export type ChannelCreateCommand = {
    // Create a channel with the given properties
    //
    // MUST fail if a channel already exists
    command: 'channel-create';
    channelName: Id;
    properties: ChannelProperties;
};

export type ChannelRequestCommand = {
    // Request to make a channel with the given properties
    //
    // MUST fail if a channel already exists
    command: 'channel-request';
    channelName: Id;
    timestamp: Date,
    from_client: string,
    from_server: string
};

export type ChannelAllowExternal = {
    // Allows an external client to send messages to the chanel ADDED by us
    command: 'channel-allow-external';
    channelName: Id;
    allowExternal: boolean;
};

export type UserCommand = {
    // The id of the user
    userId: Id;

    // Get info about a user
    //
    // MUST fail when a user has never logged in
    // MAY fail when a user isn't logged in
    // otherwise the success data MUST be of type UserProperties
    command: 'user-info';
};

export type MemberCommand = {
    // If defined: channel members of id
    // otherwise members of the server (/StA)
    channelId?: Id;

    // Get all members the server knows about
    //
    // MUST fail when a channel does not exist
    // otherwise the success data MUST be of type Id[]
    command: 'members';
};

export type OnlineMemberCommand = {
    // If defined: channel members of id
    // otherwise members of the server (/StA)
    channelId?: Id;

    // Get all members that are online
    //
    // MUST fail when a channel does not exist
    // otherwise the success data MUST be of type Id[]
    command: 'online-members';
};

export type ChannelListCommand = {
    // Get a list of channels
    //
    // otherwise the success data MUST be of type Id[]
    command: 'channel-list';
};

export type ChannelListInfoCommand = {
    // Get a list of channels and their properties
    // short for getting channel-list and doing a channel-info for each of them
    //
    // otherwise the success data MUST be of type [Id, ChannelProperties][]
    command: 'channel-list-info';
};

export type LoginCommand = {
    // Login
    //
    // MAY fail if a Key is in use
    // otherwise the success data MUST be of type string for the client to sign
    command: 'login'; // server should respond with (data:string) to sign
    key: string;
    nick: string; // TODO check how this is now supposed to work, should be removed later on
    world: string;
    timestamp: string; // TODO added by us
};

export type VerifyCommand = {
    // Verify
    //
    // MUST fail if it isn't signed with the right key
    command: 'verify'; // how does the user know if this was succesful
    verifiabledata: string;
};

export type RequestDisconnectCommand = {
    // Request to disconnect TODO added by us
    command: 'request-disconnect';
    from: string;
};

export type UpdateUserInWorldCommand = {
    command: 'update-user-in-world';
    location: number[];
    orientation: number;
    spriteNumber: number;
};

export type UpdateUserInWorldSuccessCommand = {
    command: 'update-user-success';
    data: string;
};

export type ScoreboardRequest = {
    command: 'scoreboard-request';
    game: string;
    result: { nick: string, score: number };
}

export type ChangeWorld = {
    command: 'change-world';
    fromWorld: string;
    toWorld: string;
}

// P2P 

export type sendJoinRequest = {
    command: 'join-request';
    newUrl: string;
    newPublicKey: string;
};

export type forwardP2PCommand = {
    command: 'forward-command';
    signature: string;
    beginUrl: string;
    socketID: string;
    cmdData: C2SCommand;
};

export type onPeerCommand = {
    command: 'command';
    socketid: string;
    data: C2SCommand;
};

export type sendRingUpdate = {
    command: 'update-new-ring';
    ring: string;
    newbie: string;
    newbieConn: string;
    newbieKey: string;
    final: boolean;
};

export type sendClientRemoval = {
    command: 'remove-client';
    nick: string,
    fingerprint: string,
    final: string;
};

export type sendRingToClient = {
    command: 'send-ring';
    ring: string;
};

export type sendAddressbookToClient = {
    command: 'send-book'
    book: string;
}

export type sendPeerDeletion = {
    command: 'delete-node-ring';
    urlToDelete: string;
    urlToReplace: string;
};

export type onPeerDisconnect = {
    command: 'disconnect';
    socket: SWServer;
    reason: unknown;
};

export type onRingRequest = {
    command: 'ring-request';
    target: string;
};

export type onPeerClientDisconnect = {
    command: 'disconnect';
    reason: unknown;
};

export type onNewClient = {
    command: 'new-client';
    beginUrl: string;
    socketid: string;
    cmdData: C2SCommand;
}

// /////// P2P CLIENT /////////

export type onP2PClientDisconnect = {
    command: 'disconnect';
};

export type sendRingRequest = {
    command: 'ring-request';
};

export type onRingUpdate = {
    command: 'client-ring-update';
    ring: string;
};

export type sendRingClient = {
    command: 'send-ring';
    ring: string;
};

// The server MUST always respond to any request with either a `success` command or an `error` command
export type C2SCommand = {
    // Each command SHOULD have an id which is "unique" for a "long enough" time. (I suggest just using an incrementing number)
    // Unique for this user only
    // Used to identify the source command when the server returns results or errors
    id: CommandId;
    // timestamp: string //TODO added by us
} & (
        | MessageCommand
        | ChannelCommand
        | UserCommand
        | MemberCommand
        | OnlineMemberCommand
        | ChannelListCommand
        | ChannelListInfoCommand
        | LoginCommand
        | VerifyCommand
        | RequestDisconnectCommand // TODO Added by us
        | UpdateUserInWorldCommand
        | UpdateUserInWorldSuccessCommand
        | ScoreboardRequest
        | ChangeWorld
    );

// P2P Command

export type p2pCommand =
    | sendJoinRequest
    | forwardP2PCommand
    | sendRingUpdate
    | sendClientRemoval
    | sendRingToClient
    | sendAddressbookToClient
    | onNewClient
    | sendPeerDeletion
    | onPeerCommand
    | onPeerDisconnect
    | onRingRequest
    | onPeerClientDisconnect
    | onRingUpdate;

export type p2pClientCommand =
    | onP2PClientDisconnect
    | sendRingRequest
    | onRingUpdate;

/*
        SERVER TO CLIENT COMMANDS START HERE
*/

export type IncomingMessage = {
    command: 'message';
    msg: MessageArgs;
};

export type SuccessMessage = {
    // command with "id" was succesful
    command: 'success';
    id: CommandId;
    data?: JsonData;
    to?: string;
};

export type ErrorMessage = {
    // command with "id" if that command failed, or without id for a general issue. Should be avoided at all cost
    command: 'error';
    id?: CommandId;
    // idea?
    // http status code
    // 400 Bad Request
    // 401 Unauthorized
    // 404 for channel/user not found
    // 409 Conflict
    // 429 Too Many Requests
    // 500 internal server error
    // 501 Not Implemented
    // 503 Service Unavailable
    errorCode: number;
    errorMsg?: string;
};

export type EventCommand = {
    command: 'event';
    id: CommandId;
    event: string;
    data?: JsonData;
};

export type ScoreboardAnswer = {
    command: 'scoreboard-answer'
    data: { nick: string, score: number }[];
}

export type S2CCommand = (
    | EventCommand
    | IncomingMessage
    | SuccessMessage
    | ErrorMessage
    | ScoreboardAnswer
) & {
    timestamp?: string;
};