import ChatServer from '../../server';
import ServerCommand from './serverCommand';
import SocketWrapper from '../../socketwrapper';
import * as protocol from '../../protocol';

/**
 * Change whether a channel allows external messages.
 */
export default class ChannelAllowExternal extends ServerCommand {

    /**
     * @param {ChatServer} chatServer
     */
    constructor(chatServer: ChatServer) {
        super(chatServer, 'channel-allow-external');
    }

    /**
     * @param {Object} socket
     * @param {Object} data
     */
    execute(socketid: string, data: protocol.C2SCommand): void {
        if (data.command != 'channel-allow-external') return; // TODO should not be possible

        // If there is no channel on this server with the given name, an error will occur
        if (!this.chatServer.channels.has(data.channelName)) {
            SocketWrapper.send(this.server, socketid, {
                command: 'error',
                errorCode: 404,
                errorMsg: `Channel '${data.channelName}' doesn't exists!`
            });
        }
        else {
            (this.chatServer.channels.get(data.channelName)!).allowExternal(socketid, data.allowExternal);
        }
    }
}