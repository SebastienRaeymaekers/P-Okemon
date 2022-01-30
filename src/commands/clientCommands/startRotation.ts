/**
 * Module dependencies.
 */
import ClientCommand from './clientCommand';
import ChatClient from '../../client';

/**
 * When the startRotation command is executed, a new rotationbot is created that answers
 * 'shout-to-all' messages that are send by the user that executed this command.
 * 
 * Format: /start-rotation <nick> <number> <channel>
 */
class startRotation extends ClientCommand {

    /**
     * Creates a new command to create a rotationbot. 
     * 
     * @param client 
     */
    constructor(client: ChatClient) {
        super('start-rotation', ['rotationnick', 'channelName'], client);
    }

    /**
     * Execute this command. A new rotationbot will be created that responds to the 'shout-to-all'
     * messages that the user (who made this command) will send.
     * 
     * @param args    Extra arguments given with this command. 
     */
    execute(args: string[]) {
        let channelName = null;
        if (this.client.channels.has(args[1])) {
            channelName = args[1];
        }
        this.client.loadBotPlugin(this.client.server_url, { botType: 'rotationbot', botNick: args[0], botOwner: this.client.nick, channelName: channelName }, this.client);
        // rotation.load(this.client.server_url, 
        //     {rotationbot: true, rotationnick: args[0], rotationowner: this.client.nick, rotationnumber: parseInt(args[1])}, this.client);
    }

}

/**
 * Module exports.
 */
export default startRotation;