/**
 * Module dependencies.
 */
import ClientCommand from './clientCommand';
import ChatClient from '../../client';

/**
 * When the startEliza command is executed, a new Eliza bot is created that answers all 
 * 'shout-to-all' messages that are send by the user that executed this command.
 * 
 * Format: /start-eliza <nick> <channel>
 */
class startEliza extends ClientCommand {

    /**
     * Creates a new command to create an Eliza bot.
     * 
     * @param client 
     */
    constructor(client: ChatClient) {
        super('start-eliza', ['elizanick', 'channelName'], client);
    }

    /**
     * Execute this command. A new Eliza bot will be created that responds to the 'shout-to-all'
     * messages that the user (who made this command) will send.
     * 
     * @param args    Extra arguments given with this command. 
     */
    execute(args: string[]): void {
        let channelName = null;
        if (this.client.channels.has(args[1])) {
            channelName = args[1];
        }
        this.client.loadBotPlugin(this.client.server_url, { botType: 'elizabot', botNick: args[0], botOwner: this.client.nick, channelName: channelName }, this.client);

    }

}

/**
 * Module exports.
 */
export default startEliza;