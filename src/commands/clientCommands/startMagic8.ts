/**
 * Module dependencies.
 */
import ChatClient from '../../client';
import ClientCommand from './clientCommand';

/**
 * When the startMagic8 command is executed, a new magic8 bot is created that answers
 * 'shout-to-all' messages that are send by the user that executed this command.
 * 
 * Format: /start-magic8 <nick> <channel>
 */
class startMagic8 extends ClientCommand {

    /**
     * Creates a new command to create a magic8 bot. 
     * 
     * @param client 
     */
    constructor(client: ChatClient) {
        super('start-magic8', ['magic8nick', 'channelName'], client);
    }

    /**
     * Execute this command. A new magic8 bot will be created that responds to the 'shout-to-all'
     * messages that the user (who made this command) will send.
     * 
     * @param args    Extra arguments given with this command. 
     */
    execute(args: string[]) {
        let channelName = null;
        if (this.client.channels.has(args[1])) {
            channelName = args[1];
        }
        this.client.loadBotPlugin(this.client.server_url, { botType: 'magic8bot', botNick: args[0], botOwner: this.client.nick, channelName: channelName }, this.client);
    }

}

/**
 * Module exports.
 */
export default startMagic8;