import ChatServer from '../../server';
import ServerCommand from './serverCommand';
import SocketWrapper from '../../socketwrapper';

/**
 * Return the online members of the channel, or the server if no channel is specified.
 */
export default class Members extends ServerCommand {

    /**
     * @param {ChatServer} chatServer
     */
    constructor(chatServer: ChatServer) {
        super(chatServer, 'online-members');
    }

    /**
     * @param {Object} socket
     * @param {Object} data
     */
    execute(socketid: string): void {
        SocketWrapper.send(this.server, socketid, {
            command: 'error',
            errorCode: 501,
            errorMsg: 'Online members is not implemented yet!'
        });
    }
}