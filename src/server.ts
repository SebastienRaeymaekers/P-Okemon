/**
 * Module dependencies.
 */
import * as debugModule from 'debug';
const debug = debugModule('chat:server');
import * as https from 'https';
import * as crypto from 'crypto';
import Channel from './channel';
import * as fs from 'fs';
import SocketWrapper from './socketwrapper';
import { SWServer, SWServerOptions, SWSocketServer } from './socketwrapper';
import * as allCommands from './commands/serverCommands/allCommands';
import * as protocol from './protocol';
import ServerCommand from './commands/serverCommands/serverCommand';
import { ClientOnServer } from './protocol';
import { fingerprint } from 'key-fingerprint';
import * as express from 'express';
import * as worlds from './app/world';

/**
 * ChatServer class.
 *
 * This will start a SocketWrapper server for the default namespace '/'.
 *
 */
class ChatServer {

    port: number;   // TCP port number [0, 65535], but should be > 1023 as those are reserved port numbers
    server: SWServer; // SocketWrapper server
    verifiedConnectedClients: Map<string, ClientOnServer[]>; // log table for all recently seen clients. The key is the user's fingerprint
    // connectedClients: Map<string, string>; // log table for all connected clients. The key is a socket id and the value is a client nick
    https: https.Server; // variable for the https server
    channels = new Map<string, Channel>(); // All channels
    commands = new Map<string, ServerCommand>(); // All Server commands
    requestedChannels = new Map<string, { fingerprint: string, timestamp: Date }>();
    // world: string[][] = [];     // 2D-array that holds string to represent the value of the world on each 'tile', e.g.:  
    worlds: Map<string, { tiles: string[][], doorsMap: Map<string, number[]>, entryMap: Map<string, number[]> }> = new Map();

    startLocation: number[] = [4, 5]; // The location where every connected clients avatar starts in the world.
    startOrientation = 3;  // The orientation every connected clients avatar with in the world.

    minigameScores = new Map<string, { nick: string, score: number }[]>(); // Map containing the highscores of all the minigames
    /**
     * 
     * Constructor for the server
     * 
     * @param {*} port port for the server
     * @param {*} options options for the server
     */
    constructor(port: number, options?: SWServerOptions) {

        this.port = port;

        const option = {
            cors: {
                origin: '*',
            }
        };

        debug(`Constructing server at port ${port} with options=%o`, option);

        const expressApp = express();
        expressApp.use(express.static('public'));
        // creates a server with a valid certificate and key
        this.https = https.createServer({
            key: fs.readFileSync('./bin/key.pem'),
            cert: fs.readFileSync('./bin/cert.pem')
        }, expressApp);
        // this.https = https.createServer(expressApp);

        // variable for the https server
        this.https.listen(this.port);

        // start SocketWrapper server, will throw EADDRINUSE when port is already in use...
        this.server = SocketWrapper.createServer(this.https, options);

        SocketWrapper.OnServer(this.https, 'listening', () => debug('Listening on %o', this.https.address()));
        SocketWrapper.OnServer(this.server, 'connect', (socket) => this.onConnect(socket));

        // this table saves all clients with their corresponding public key and last seen timestamp
        this.verifiedConnectedClients = new Map();

        // check each 10 sec for an absent client(inactive)
        setInterval(() => this.checkTable(), 10000);

        // Initialize server commands
        for (const [, command] of Object.entries(allCommands)) {
            const newCmd = new (command.default)(this);
            this.commands.set(newCmd.name, newCmd);
        }

        this.setUpScoreboards();

        // Construct worlds
        this.constructWorlds();
        // this.createChannels(this.world);
        this.sendUpate();
    }

    /**
     * Initialise the list of scoreboards with every type of minigame
     */
    setUpScoreboards() {
        const emptyBoard = [{ nick: '-', score: 0 }, { nick: '-', score: 0 },
        { nick: '-', score: 0 }, { nick: '-', score: 0 },
        { nick: '-', score: 0 }, { nick: '-', score: 0 },
        { nick: '-', score: 0 }, { nick: '-', score: 0 },
        { nick: '-', score: 0 }, { nick: '-', score: 0 }]
        const secondBoard = [{ nick: '-', score: 0 }, { nick: '-', score: 0 },
        { nick: '-', score: 0 }, { nick: '-', score: 0 },
        { nick: '-', score: 0 }, { nick: '-', score: 0 },
        { nick: '-', score: 0 }, { nick: '-', score: 0 },
        { nick: '-', score: 0 }, { nick: '-', score: 0 }]
        this.minigameScores.set('snake', emptyBoard);
        this.minigameScores.set('pong', secondBoard);
    }

    /**
     * Our standard event handlers for dealing with SocketWrapper
     * @param socket 
     */
    onConnect(socket: SWSocketServer): void {
        debug(`Got connection socket.id=${socket.id}`);
        // listener for data
        SocketWrapper.OnSocket(socket, 'data', (data: protocol.C2SCommand) => this.doCommand(socket.id, data));

        SocketWrapper.OnSocket(socket, 'disconnect', (reason) => this.onSocketDisconnect(socket.id, reason));
        SocketWrapper.OnSocket(socket, 'disconnecting', (reason) => this.onSocketDisconnecting(socket, reason));
    }

    /**
     * update the lastseen timestamp if a client disconnects
     * and deletes the client from the directory 
     */
    onSocketDisconnect(socketid: string, reason: unknown): void {
        debug(`Lost socket with id ${socketid}, reason: ${reason}`);
        this.removeSocketFromServer(socketid);
    }

    /**
     * Fired when the client is going to be disconnected (but hasn’t left its rooms yet).
     * @param socket 
     * @param reason 
     */
    onSocketDisconnecting(socket: SWSocketServer, reason: unknown): void {
        const rooms = Object.keys(socket.rooms);
        rooms.forEach(room => { if (room !== socket.id) { (this.channels.get(room)!).removeUser(socket.id, 0) } }); // TODO command id for remove user?
        debug(`Lost socket with id ${socket.id}, reason: ${reason}, rooms = %o`, rooms);
    }

    /**
     * This function handels all the commands given to the server by connected clients.
     * If the socket is not in the table with all users then he is not allowed to send commands.
     * 
     * @param socket socket who has issued the command
     * @param data the command
     */
    doCommand(socketid: string, data: protocol.C2SCommand): void {
        debug('Server received client command=%o', data.command);

        if (this.checkClientVerified(socketid) || data.command == 'login') {
            if (this.commands.has(data.command)) {
                this.commands.get(data.command)!.execute(socketid, data);
            }
            else if (data.command != 'verify') {
                SocketWrapper.send(this.server, socketid, {
                    command: 'error',
                    errorCode: 400,
                    errorMsg: 'The command does not exist'
                });
            }
        } else {
            debug('The client has no permission to send a command to this server');
        }
    }

    /**
     * Updates the orientation of the client who issued this command 
     * and sends an update to every other client connected to the server about the new orientation. 
     * @param socketid 
     * @param newOrientation 
     */
    // updateOrientationOfClient(socketid: string, newOrientation: number) {
    //     for (const [, clientData] of this.verifiedConnectedClients) {
    //         clientData.forEach(entry => {
    //             if (entry.socketID == socketid) {
    //                 entry.orientation = newOrientation;
    //             }
    //         });
    //     }
    //     // TODO: verstuur deze update van orientatie naar al de andere verbonden clients
    // }

    /**
     * Returns true if the client is verified
     * @param socket 
     * @param data 
     */
    checkClientVerified(socketid: string) {
        let verified = false;

        for (const [, clientData] of this.verifiedConnectedClients) {
            clientData.forEach(entry => {
                if (entry.socketID == socketid) verified = true;
            })
        }
        return verified;
    }

    updateScoreboard(newScore: number, nick: string, game: string) {
        const scoreboard = this.minigameScores.get(game)!;
        if (scoreboard.length < 10 || scoreboard[9].score < newScore) {
            if (scoreboard.length == 10) {
                scoreboard.pop();
            }
            scoreboard.push({ nick: nick, score: newScore });
            scoreboard.sort((entry1, entry2) => {
                if (entry1.score > entry2.score) {
                    return -1;
                }
                if (entry1.score < entry2.score) {
                    return 1;
                }
                return 0;
            });
        }
    }

    sendScoreboard(socketid: string, data: protocol.C2SCommand) {
        if (data.command != 'scoreboard-request') return; // shouldn't be possible
        this.updateScoreboard(data.result.score, data.result.nick, data.game)
        SocketWrapper.send(this.server, socketid, {
            command: 'scoreboard-answer',
            data: this.minigameScores.get(data.game)!
        });
    }

    /**
     * log the publicKeys of the clients in the table, if the nickname already exists it needs to verify it is the same client trying to reconnect
     * 
     * source: https://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid
     * String to confirm identity of client
     * 
     * @param socket 
     * @param args 
     */
    async clientAuthenticate(socketid: string, data: protocol.C2SCommand/* socket: io.Socket, args: { nick: string; publicKey: string; timestamp: string }*/): Promise<void> {
        if (data.command != 'login') return; // Should not be possible

        const ts = new Date(data.timestamp);
        const currentTime = new Date();

        if (currentTime.getTime() - ts.getTime() > 5 * 60 * 1000) {
            SocketWrapper.send(this.server, socketid, { command: 'error', errorCode: 401 });
            SocketWrapper.disconnectFromServer(this.server, socketid, true);
            debug(`disconnected client with same nick: ${data.nick}`);
        }

        const verifiableData = crypto.randomBytes(20).toString('hex');
        SocketWrapper.send(this.server, socketid, {
            command: 'success',
            id: data.id,
            data: verifiableData
        });

        debug('Sent verification command to client');

        const socket = this.server.sockets.sockets.get(socketid);
        SocketWrapper.OnSocket(socket!, 'data', async (newData: protocol.C2SCommand) => {  // check if the response is valid
            if (newData.command == 'verify') {
                debug('Recieved verification command from client');
                const signature = newData.verifiabledata;
                const isVerified = this.verifyConnection(verifiableData, data.key, signature);

                // disconnect when connection not accepted
                if (!isVerified) {
                    SocketWrapper.send(this.server, socketid, { command: 'event', id: newData.id, event: 'forceDisconnect' })
                    SocketWrapper.disconnectFromServer(this.server, socketid, true);
                    return;
                }

                const fingerPrint = fingerprint(data.key, 'sha256') // make new fingerprint
                const timeStamp = new Date();

                const randomSpriteNumber = Math.floor(Math.random() * 4) + 1

                const newUserData = { nick: data.nick, socketID: socketid, timestamp: timeStamp, location: [this.startLocation[0], this.startLocation[1]], orientation: this.startOrientation, spriteNumber: randomSpriteNumber, animationProgress: 0, world: data.world };

                // if fingerprint not yet in data-structure, add new entry
                if (!this.verifiedConnectedClients.has(fingerPrint)) {
                    this.verifiedConnectedClients.set(fingerPrint, [newUserData]);
                    debug(`Added new socket ${socketid} for nick ${data.nick} to new fingerprint ${fingerPrint} server data-structure`);
                }
                // if fingerprint already in data-structure, add new nick, socket and timestamp to list
                else {
                    const newList: ClientOnServer[] = this.verifiedConnectedClients.get(fingerPrint)!.concat([newUserData]);
                    this.verifiedConnectedClients.set(fingerPrint, newList);
                    debug(`Added new socket ${socketid} for nick ${data.nick} to existing fingerprint ${fingerPrint} server data-structure`);
                }

                // send to existing users on the server that there is a new user
                SocketWrapper.sendRaw(this.server, { command: 'event', id: data.id, event: 'newUser', data: [data.nick, fingerPrint] });
                // send existing connected clients info to new user
                for (const [fingerPrint, clientOnServer] of this.verifiedConnectedClients.entries()) {
                    SocketWrapper.send(this.server, socketid, { command: 'event', id: data.id, event: 'newUser', data: [clientOnServer[0].nick, fingerPrint] });
                }
                debug('Updated server connected clients and new users directory');

                for (const [namechannel,] of this.channels.entries()) {
                    SocketWrapper.send(this.server, socketid, { command: 'event', id: data.id, event: 'addAllChannels', data: namechannel });
                }

                // unlock the client (he is new and has a valid private key so he is allowed to send commands)
                SocketWrapper.send(this.server, socketid, { command: 'event', id: data.id, event: 'unlock' });
                debug('Unlock sent');

                // create list of all the locations of clients in the virtual world of this server
                // const listOfClientsWithLocations: [string, string, number[], number][] = [];
                // for (const [user, info] of this.verifiedConnectedClients) {
                //     listOfClientsWithLocations.push([user, info[0].nick, info[0].location, info[0].orientation]);
                // }
                const listOfClientsWithLocations: Map<string, { nick: string, location: number[], orientation: number, spriteNumber: number, world: string }> = new Map();
                for (const [user, info] of this.verifiedConnectedClients) {
                    // if (info[0].world == data.world) // TODO: check if no conflicts if same user from different socket in two worlds for example.
                    for (const client of info) {
                        listOfClientsWithLocations.set(user, { nick: client.nick, location: client.location, orientation: client.orientation, spriteNumber: client.spriteNumber, world: client.world })
                    }
                }
                debug('JSON', JSON.stringify(Array.from(listOfClientsWithLocations)));
                // send world of this server, startlocation and all positions of clients in this virtual world to the client
                SocketWrapper.send(this.server, socketid, {
                    command: 'event', id: data.id, event: 'getWorld', data: [this.worlds.get(data.world)!.tiles,
                    this.startLocation,
                    JSON.stringify(Array.from(listOfClientsWithLocations)),
                    JSON.stringify(Array.from(this.worlds.get(data.world)!.doorsMap))]
                });
                // send update to other clients TODO maybe send instead of sendRaw? TODO waarschijnlijk fout want andere clients krijgen oudere clients niet te zien
                // SocketWrapper.sendRaw(this.server, {
                //     command: 'event',
                //     id: data.id,
                //     event: 'worldUpdate',
                //     data: [fingerPrint, JSON.stringify({ nick: newUserData.nick, location: newUserData.location, orientation: newUserData.orientation, spriteNumber: newUserData.spriteNumber })]
                // });
            }
        });
    }

    /**
     * verifies the verifiable data using the public key and the signature.
     * 
     * source: https://www.sohamkamani.com/nodejs/rsa-encryption/
     * 
     * @param verifiableData
     * @param publicKey 
     * @param signature 
     */
    verifyConnection(verifiableData: string, publicKey: string, signature: string): boolean {
        let isVerified = false;
        try {
            isVerified = crypto.verify(
                'RSA-SHA256',
                Buffer.from(verifiableData),
                { key: publicKey },
                Buffer.from(signature, 'hex')
            );
        } catch {
            debug('publicKey is undefined!');
        }
        debug('key is verified: ' + isVerified);
        return isVerified
    }

    /**
     * check if a client/socket is disconnected for more than 5 minutes
     */
    checkTable(): void {
        const currentTime = new Date(); // unit: seconds
        debug('checking for long disconnected clients');

        for (const [fingerPrint, clientOnServer] of this.verifiedConnectedClients.entries()) {
            // check if last logged timestamp (connect or disconnect) was > 5 minutes and if the client is still connected
            for (const client in clientOnServer) {
                if (currentTime.getTime() - (new Date(clientOnServer[client].timestamp)).getTime() > 5 * 60 * 1000 && !this.isActive(clientOnServer[client].socketID)) {
                    this.verifiedConnectedClients.delete(fingerPrint);
                    debug(`deleted nick: ${fingerPrint}`);
                }
            }
        }
    }

    /** 
     * check if the client is still connected, verified or unverified. 
     * The moment a client connect to the server it is added to the connectedClients table (before the verification process is started).
     * If the client disconnects (force disconnected, ....), then the client is "inactive".
     * If the client is connected, (verified or unverified), then the client is "active".
     * 
     * @param socketIDToCheck socket
     */
    isActive(socketIDToCheck: string): boolean {
        for (const [, clientsOnServer] of this.verifiedConnectedClients.entries()) {
            for (const clientOnServer in clientsOnServer)
                if (clientsOnServer[clientOnServer].socketID == socketIDToCheck) {
                    return true;
                }
        }
        return false;
    }

    /**
     * 
     * @param socketid Handles messages sent by clients.
     * @param data 
     */
    onMessageClient(socketid: string, data: protocol.C2SCommand): void {
        if (data.command != 'message') throw new Error(`Command to handle is ${data.command} but should be "message"`);
        const date = new Date();
        const hour = date.getHours().toString();
        let min = date.getMinutes().toString();
        if (min.length === 1) min = '0' + min;
        const time = hour + ':' + min;
        if (data.msg.metadata == undefined) {
            data.msg.metadata = {};
        }
        data.msg.metadata.timestamp = time;
        if (data.msg.to !== undefined && /^#/.test(data.msg.to)) { // to channel
            if (!this.channels.has(data.msg.to)) {
                SocketWrapper.send(this.server, socketid, {
                    command: 'error',
                    errorCode: 404,
                    errorMsg: 'Channel not found!'
                })
            }
            else {
                this.channels.get(data.msg.to)!.send(socketid, data);
            }
        }

        else if (data.msg.to !== undefined && data.msg.to !== 'all') {
            // send msg to all active sockets of fingerprint of the given publicKey.
            const fingerPrint = data.msg.to!
            const entriesOfFingerPrint: ClientOnServer[] | undefined = this.verifiedConnectedClients.get(fingerPrint);
            if (entriesOfFingerPrint == undefined) // could still be possible if the receiving client got disconnected while the sending client sent.
                /* sendError msg*/ return

            // debug('server sent message');
            for (let i = 0; i < entriesOfFingerPrint.length; i++) {
                SocketWrapper.send(this.server, entriesOfFingerPrint[i].socketID, { command: 'message', msg: data.msg })
            }
            const sender = this.verifiedConnectedClients.get(data.msg.from!);
            if (sender == undefined) {
                return
            }
            if (data.msg.to !== data.msg.from) {
                for (let i = 0; i < sender.length; i++) {
                    SocketWrapper.send(this.server, sender[i].socketID, { command: 'message', msg: data.msg });
                }
            }
        }

        else {
            // send msg to all active sockets from all connected clients
            for (const [, ClientOnServer] of this.verifiedConnectedClients.entries()) {
                for (let i = 0; i < ClientOnServer.length; i++) {
                    // debug('server sent message');
                    SocketWrapper.send(this.server, ClientOnServer[i].socketID, {
                        command: 'message',
                        msg: data.msg,
                    })
                }
            }

        }
    }

    /**
     * disconnects a specific socket from the server on request of that socket
     *  
     * @param socket Socket to disconnect from this server
     * @param from Client hash
     * 
    */
    onClientDisconnectRequest(socketid: string, from: string, commandID: number): void {
        SocketWrapper.send(this.server, socketid, {
            command: 'event',
            id: commandID,
            event: 'forceDisconnect',
            data: 'used disconnect command'
        });
        this.removeSocketFromServer(socketid);
        SocketWrapper.disconnectFromServer(this.server, socketid, true);
        debug(`disconnected client with public key hash: ${from}`);
    }

    /**
     * searches through the datastructure for the disconnecting socket,
     * removes the entry from it and send to all other sockets to remove the
     * user from its directory if no entries for the fingerprint remain. 
     * @param socket 
     */
    removeSocketFromServer(socketid: string) {
        //  search to find socket to be remove
        debug('server: remove client from server');
        for (const [fingerprint, clientOnServerList] of this.verifiedConnectedClients.entries()) {
            for (let i = 0; i < clientOnServerList.length; i++) {
                if (clientOnServerList[i].socketID == socketid) {
                    // put client in list along with timestamp to for reconnection purposes.
                    // ...

                    const nick: string = clientOnServerList[i].nick;
                    // remove element from array
                    this.verifiedConnectedClients.get(fingerprint)!.splice(i, 1)
                    // if list is empty remove entry from this.verifiedconnectedclient and update directories of clients.
                    if (this.verifiedConnectedClients.get(fingerprint)!.length == 0) {
                        SocketWrapper.sendRaw(this.server, { command: 'event', id: 0, event: 'removeUser', data: [nick, fingerprint] });
                        this.verifiedConnectedClients.delete(fingerprint);
                    }
                }
            }
        }
    }

    /**
     * Returns whether or not the given string is a valid name for channels
     *
     * @param {String} channel_name
     */
    isValidChannelName(channel_name: string): boolean {
        return (3 < channel_name.length && channel_name.length < 16 &&
            /[abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#]/.test(channel_name) && channel_name.charAt(0) == '#');
    }

    /**
     * concept to get publickey
     */
    askPublicKey(fingerprint: string, socketID: string, commandID: number): void {
        if (!this.verifiedConnectedClients.has(fingerprint)) return;
        const ClientsOnServer = this.verifiedConnectedClients.get(fingerprint);
        const recieverSocketID: string = ClientsOnServer![0].socketID
        let tofingerprint = '';
        for (const [fingerprint, clientOnServerList] of this.verifiedConnectedClients.entries()) {
            for (let i = 0; i < clientOnServerList.length; i++) {
                if (clientOnServerList[i].socketID == socketID) {
                    tofingerprint = fingerprint;
                }
            }

        }
        SocketWrapper.send(this.server, recieverSocketID, {
            command: 'event',
            id: commandID,
            event: 'askPublicKey',
            data: tofingerprint
        });
    }

    sendPublicKey(publicKey: string, socketIDAsker: string, commandID: number) {

        SocketWrapper.send(this.server, socketIDAsker, {
            command: 'success',
            id: commandID,
            data: publicKey
        });
    }

    /**
     * Send the server's client directory to the client
     * @param socketID 
     */
    giveDirectory(): void {
        const directory: Map<string, string> = new Map;
        for (const [fingerPrint, ClientOnServer] of this.verifiedConnectedClients.entries()) {
            directory.set(fingerPrint, ClientOnServer[0].nick)
        }
        // send("setDirectory, to: socketID, this.verifiedConnectedClients)
    }

    /**
     * Construct world for the server.
     */
    constructWorlds(): void {
        // create world 
        const worldsMap: Map<string, { tiles: string[][], doorsMap: Map<string, number[]>, entryMap: Map<string, number[]> }> = new Map();
        // TODO make this not hard-coded.
        // Object.entries(worlds).forEach((world) => worldsMap.set(world, world));
        worldsMap.set('world1', worlds.world1);
        worldsMap.set('world2', worlds.world2);
        worldsMap.set('world3', worlds.world3);
        worldsMap.set('world4', worlds.world4);
        worldsMap.set('world5', worlds.world5);

        this.worlds = worldsMap;
    }

    sendUpate(): void {
        setInterval(() => {
            const locationClientsArray: any[] = [];
            for (const [fingerprint, clientData] of this.verifiedConnectedClients) {
                clientData.forEach((entry) => {
                    const orientation = entry.orientation;
                    const spriteNumber = entry.spriteNumber;
                    if (entry.animationProgress != 0) {
                        entry.animationProgress += 5
                        if (entry.animationProgress > 100) {
                            entry.animationProgress = 0;

                            // if (entry.orientation == 1) {
                            //     entry.location[1] -= 1
                            // } else if (entry.orientation == 2) {
                            //     entry.location[0] += 1
                            // } else if (entry.orientation == 3) {
                            //     entry.location[1] += 1
                            // } else if (entry.orientation == 4) {
                            //     entry.location[0] -= 1
                            // }
                            switch (entry.orientation) {  // 1 -> North, 2 -> East, 3 -> South, 4 -> West
                                case 1:
                                    entry.location[1] -= 1
                                    break;
                                case 2:
                                    entry.location[0] += 1
                                    break;
                                case 3:
                                    entry.location[1] += 1
                                    break;
                                case 4:
                                    entry.location[0] -= 1
                                    break;
                            }
                        }
                    }
                    const location = entry.location;
                    const animationProgress = entry.animationProgress;
                    const nick = entry.nick;
                    const world = entry.world;

                    locationClientsArray.push({ fingerprint, location, orientation, spriteNumber, animationProgress, nick, world });
                });
            }

            // console.log("____________in Server____________")
            // console.log(locationClientsArray);
            // console.log("____________out Server___________")

            // send msg to all active sockets from all connected clients to notify the update
            for (const [, ClientOnServer] of this.verifiedConnectedClients.entries()) {
                for (let i = 0; i < ClientOnServer.length; i++) {
                    // debug('server sent message');
                    SocketWrapper.send(this.server, ClientOnServer[i].socketID, {
                        command: 'event',
                        id: 9,
                        event: 'worldUpdate',
                        // data: [ClientOnServer[0].socketID, data]
                        data: ['bla', JSON.stringify(locationClientsArray)]
                    })
                }
            }
        }, 25);
    }
}

/**
 * Module exports.
 */
export default ChatServer;