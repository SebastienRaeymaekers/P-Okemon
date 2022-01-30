import ChatServer from '../../server';
import ServerCommand from './serverCommand';
import SocketWrapper from '../../socketwrapper';
import * as protocol from '../../protocol';
import Channel from '../../channel';
import * as debugModule from 'debug';
const debug = debugModule('chat:channelCreate');

/**
 * Create a new channel with a nonexisting name.
 */
export default class ChannelCreate extends ServerCommand {

    /**
     * @param {ChatServer} chatServer
     */
    constructor(chatServer: ChatServer) {
        super(chatServer, 'channel-create');
    }

    /**
     * @param {Object} socket
     * @param {Object} data
     */
    execute(socketid: string, data: protocol.C2SCommand): void {
        if (data.command != 'channel-create') return; // TODO should not be possible
        debug('this server will create a new channel');
        
        // if there is already a channel on this server with the given name, an error will occur
        if (this.chatServer.channels.has(data.channelName)) {
            SocketWrapper.send(this.server, socketid, {
                command: 'error',
                errorCode: 400,
                errorMsg: `Channel ${data.channelName} already exists!`
            });
        }
        // if the name is not a valid channel name, an error will occur
        else if (!this.chatServer.isValidChannelName(data.channelName)) {
            SocketWrapper.send(this.server, socketid, {
                command: 'error',
                errorCode: 400,
                errorMsg: `Channel ${data.channelName} is not a valid name!`
            });
        }
        // make channel. 
        else{
            const password = (data.properties.publicKey == undefined) ? Math.random().toString(36).slice(2) : data.properties.publicKey;
            const channel = new Channel(data.channelName, this.chatServer, socketid, data.id, password);
            this.chatServer.channels.set(data.channelName, channel);
        }
    }
}