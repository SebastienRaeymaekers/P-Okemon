import ChatServer from '../../server';
import ServerCommand from './serverCommand';
import * as protocol from '../../protocol';

/**
 * Return the online members of the channel, or the server if no channel is specified.
 */
export default class SendPublicKey extends ServerCommand {

    /**
     * @param {ChatServer} chatServer
     */
    constructor(chatServer: ChatServer) {
        super(chatServer, 'user-info');
    }

    /**
     * TODO replace by user-info
     * @param {Object} socket
     * @param {Object} data
     */
    execute(socketid: string, data: protocol.C2SCommand): void {
        if (data.command !== 'user-info') return;
        this.chatServer.askPublicKey(data.userId, socketid, data.id);

    }
}