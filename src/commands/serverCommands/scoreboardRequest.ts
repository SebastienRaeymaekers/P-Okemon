import ChatServer from '../../server';
import ServerCommand from './serverCommand';
import * as protocol from '../../protocol';

/**
 * Get the chathistory of a given channel
 */
export default class ScoreboardRequest extends ServerCommand {

    /**
     * @param {ChatServer} chatServer
     */
    constructor(chatServer: ChatServer) {
        super(chatServer, 'scoreboard-request');
    }

    /**
     * @param {Object} socket
     * @param {Object} data
     */
    execute(socketid: string, data: protocol.C2SCommand): void {
        this.chatServer.sendScoreboard(socketid, data);
        // if (data.command != 'update-scoreboard') return; // TODO should not be possible
    }
}