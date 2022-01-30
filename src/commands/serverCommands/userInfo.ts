import ChatServer from '../../server';
import ServerCommand from './serverCommand';
import * as protocol from '../../protocol';

/**
 * Return the info of the user.
 */
export default class Members extends ServerCommand {

    /**
     * @param {ChatServer} chatServer
     */
    constructor(chatServer: ChatServer) {
        super(chatServer, 'user-info');
    }

    /**
     * @param {Object} socket
     * @param {Object} data
     */
    execute(socketid: string, data: protocol.C2SCommand): void {
        if (data.command !== 'user-info') return;
        // if (data.userId.length == 64) {// length of a fingerprint
        this.chatServer.askPublicKey(data.userId, socketid, data.id);
        // } else {
        //     const key = data.userId.split(' ');
        //     this.chatServer.sendPublicKey(key[0], key[key.length - 1], data.id);
        // }
    }
}