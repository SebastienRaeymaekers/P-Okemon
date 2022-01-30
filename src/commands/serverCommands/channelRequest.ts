import ServerCommand from './serverCommand';
import SocketWrapper from '../../socketwrapper';
import * as protocol from '../../protocol';
import ChatServer from '../../server';
import * as debugModule from 'debug';
const debug = debugModule('chat:channelRequest');

/**
 * Request to make a new channel with a nonexisting name.
 */
export default class ChannelRequest extends ServerCommand {

    /**
     * @param {ChatServer} chatServer
     */
    constructor(chatServer: ChatServer) {
        super(chatServer, 'channel-request');
    }

    /**
     * @param {Object} socket
     * @param {Object} data
     */
    execute(socketid: string, data: protocol.C2SCommand): void {
        if (data.command != 'channel-request') return; // TODO should not be possible

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
        debug('after all checks in channel-request');

        // if someone else is trying to make channel, check timestamps, else set channel-request lock on given name by adding name to requestedChannels list.
        if (this.chatServer.requestedChannels.has(data.channelName)) {
            debug('in if because simultaneous same name channel creation');

            // TODO: check if correct type
            // if timestamp of current request is younger, replace previous requested channel with same name, with this one
            if (data.timestamp < this.chatServer.requestedChannels.get(data.channelName)!.timestamp) {
                this.chatServer.requestedChannels.delete(data.channelName)
                this.chatServer.requestedChannels.set(data.channelName, { fingerprint: data.from_server, timestamp: data.timestamp })
            }

            // if channel-request comes from this server, check if channel can be made by comparing the timestamps

            if (data.timestamp < this.chatServer.requestedChannels.get(data.channelName)!.timestamp) {
                SocketWrapper.send(
                    this.server,
                    this.chatServer.verifiedConnectedClients.get(data.from_client)![0].socketID, // TODO: fix how to find correct client
                    {
                        command: 'channel-create',
                        id: 0, // TODO: fix command id 
                        channelName: data.channelName,
                        properties: {
                            saveHistory: true, // TODO not used yet by us
                            messageOutside: false, // TODO also not used yet
                            publicKey: Math.random().toString(36).slice(2)
                        }
                    });
            }
        }
    }
}