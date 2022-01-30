import ChatServer from '../../server';
import ServerCommand from './serverCommand';
import SocketWrapper from '../../socketwrapper';
import * as protocol from '../../protocol';

/**
 * Join an existing channel using the channel name.
 */
export default class ChannelJoin extends ServerCommand {

    /**
     * @param {ChatServer} chatServer
     */
    constructor(chatServer: ChatServer) {
        super(chatServer, 'channel-join');
    }

    /**
     * @param {Object} socket
     * @param {Object} data
     */
    execute(socketid: string, data: protocol.C2SCommand): void {
        if (data.command != 'channel-join') return; // TODO should not be possible

        if (!this.chatServer.channels.has(data.channelName)) { // If there is no channel on this server with the given name, an error will occur
            SocketWrapper.send(this.server, socketid, {
                command: 'error',
                errorCode: 404,
                errorMsg: `Channel #${data.channelName} doesn't exists!`
            });
        }
        else {
            (this.chatServer.channels.get(data.channelName)!).addUser(socketid, data.id);
        }
    }
}