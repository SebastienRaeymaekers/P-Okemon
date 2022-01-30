import ChatServer from '../../server';
import ServerCommand from './serverCommand';
import * as protocol from '../../protocol';

/**
 * A command that gets executed when a client requests to disconnect from the server.
 */
export default class DisconnectClient extends ServerCommand {

    /**
     * @param server 
     */
    constructor(server: ChatServer) {
        super(server, 'request-disconnect');
    }

    /**
     * @param socket 
     * @param data 
     */
    execute(socketid: string, data: protocol.C2SCommand) {
        if (data.command != 'request-disconnect') return; // TODO should not be possible
        this.chatServer.onClientDisconnectRequest(socketid, data.from, data.id);
    }

}