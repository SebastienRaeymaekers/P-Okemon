import ChatServer from '../../server';
import ServerCommand from './serverCommand';
import SocketWrapper from '../../socketwrapper';

/**
 * Create a new channel with a nonexisting name.
 */
export default class ChannelDelete extends ServerCommand {

    /**
     * @param {ChatServer} chatServer
     */
    constructor(chatServer: ChatServer) {
        super(chatServer, 'channel-delete');
    }

    /**
     * @param {Object} socket
     * @param {Object} data
     */
    execute(socketid: string): void {
        SocketWrapper.send(this.server, socketid, {
            command: 'error',
            errorCode: 501,
            errorMsg: 'Channel deletion is not implemented yet!'
        });
    }
}