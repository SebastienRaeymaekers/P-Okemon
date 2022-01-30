import ChatServer from '../../server';
import ServerCommand from './serverCommand';
import SocketWrapper from '../../socketwrapper';

/**
 * Return the members of the channel, or the server if no channel is specified.
 */
export default class Members extends ServerCommand {

    /**
     * @param {ChatServer} chatServer
     */
    constructor(chatServer: ChatServer) {
        super(chatServer, 'members');
    }

    /**
     * @param {Object} socket
     * @param {Object} data
     */
    execute(socketid: string): void {
        SocketWrapper.send(this.server, socketid, {
            command: 'error',
            errorCode: 501,
            errorMsg: 'Members is not implemented yet!'
        });
    }
}