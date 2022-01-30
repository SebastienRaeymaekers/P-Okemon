import ChatServer from '../../server';
import ServerCommand from './serverCommand';
import SocketWrapper from '../../socketwrapper';

/**
 * Return the channel's properties
 */
export default class ChannelInfo extends ServerCommand {

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
            errorMsg: 'Channel info is not implemented yet!'
        });
    }
}