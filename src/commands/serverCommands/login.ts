import ChatServer from '../../server';
import ServerCommand from './serverCommand';
import * as protocol from '../../protocol';

/**
 * A command that gets executed when a client wants get authenticated.
 */
export default class Authenticate extends ServerCommand {

    /**
     * @param server 
     */
    constructor(server: ChatServer) {
        super(server, 'login');
    }

    /**
     * Calls the appropriate function in ChatServer
     * @param socket 
     * @param data 
     */
    execute(socketid: string, data: protocol.C2SCommand): void {
        if (data.command != 'login') throw new Error('This can only be called with the login command.');
        this.chatServer.clientAuthenticate(socketid, data);
    }

}