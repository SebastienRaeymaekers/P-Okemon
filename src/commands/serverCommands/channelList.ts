import ChatServer from '../../server';
import ServerCommand from './serverCommand';
import SocketWrapper from '../../socketwrapper';
import * as protocol from '../../protocol';

/**
 * Get a list of all the channels on a server
 */
export default class ChannelList extends ServerCommand {

    /**
     * @param {ChatServer} chatServer
     */
    constructor(chatServer: ChatServer) {
        super(chatServer, 'channel-list');
    }

    /**
     * @param {Object} socket
     * @param {Object} data
     */
    execute(socketid: string, data: protocol.C2SCommand): void {
        if (data.command != 'channel-list') return; // TODO should not be possible

        SocketWrapper.send(this.server, socketid, {
            command: 'event',
            id: data.id,
            event: 'clear-all-channels'
        });
        if (this.chatServer.channels.size == 0) {
            SocketWrapper.send(this.server, socketid, {
                command: 'success',
                id: data.id,
                data: 'There are currently no channels available.'
            });
        } else {

            let channelListPrintable = 'All currently available channels: ';    // to send with the success message (will be printed at client side)
            let channelList = ''                                        // to add to the client's channel list (won't be printed)
            for (const channelName of this.chatServer.channels.keys()) {
                channelListPrintable += `\n* ${channelName}`;
                channelList += `:${channelName}`;
            }

            SocketWrapper.send(this.server, socketid, {
                command: 'success',
                id: data.id,
                data: channelListPrintable
            });
            SocketWrapper.send(this.server, socketid, {
                command: 'event',
                event: 'addAllChannels',
                id: data.id,
                data: channelList
            });
        }
    }
}