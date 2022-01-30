import ChatServer from '../../server';
import ServerCommand from './serverCommand';
import * as protocol from '../../protocol';
import SocketWrapper from '../../socketwrapper';
import * as debugModule from 'debug';
const debug = debugModule('chat:server');

/**
 * A command that gets executed when a client wants get authenticated.
 */
export default class ChangeWorld extends ServerCommand {

    /**
     * @param server 
     */
    constructor(server: ChatServer) {
        super(server, 'change-world');
    }

    /**
     * Calls the appropriate function in ChatServer
     * @param socket 
     * @param data 
     */
    execute(socketid: string, data: protocol.C2SCommand): void {
        if (data.command != 'change-world') throw new Error('This can only be called with the change-world command.');
        debug('data.toWorld =%o', data.toWorld);
        debug('data.toWorld times =%o', this.chatServer.worlds.get(data.toWorld)!.tiles);

        const toPos = this.chatServer.worlds.get(data.toWorld)!.entryMap.get(data.fromWorld)!;
        const toPosOnGrid = [toPos[0], (this.chatServer.worlds.get(data.toWorld)!.tiles.length-1) - toPos[1]];

        const listOfClientsWithLocations: Map<string, { nick: string, location: number[], orientation: number, spriteNumber: number, world: string }> = new Map();
        for (const [user, info] of this.chatServer.verifiedConnectedClients) {
            for (const client of info){
                if (client.socketID == socketid){
                    client.location = [toPosOnGrid[0], toPosOnGrid[1]];
                    client.world = data.toWorld;
                }
                listOfClientsWithLocations.set(user, { nick: client.nick, location: client.location, orientation: client.orientation, spriteNumber: client.spriteNumber, world: client.world })
            }
        }
        debug('JSON', JSON.stringify(Array.from(listOfClientsWithLocations)));
        // send world of this server, startlocation and all positions of clients in this virtual world to the client
        SocketWrapper.send(this.server, socketid, { command: 'event', id: data.id, event: 'getWorld', data: [this.chatServer.worlds.get(data.toWorld)!.tiles, 
                                                                                                            [toPosOnGrid[0], toPosOnGrid[1]],
                                                                                                            JSON.stringify(Array.from(listOfClientsWithLocations)),
                                                                                                            JSON.stringify(Array.from(this.chatServer.worlds.get(data.toWorld)!.doorsMap))] });

    }

}