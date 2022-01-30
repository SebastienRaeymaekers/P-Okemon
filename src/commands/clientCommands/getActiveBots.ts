/**
 * Module dependencies.
 */
import ClientCommand from './clientCommand';
import ChatClient from '../../client';

/**
 * Displays the user's active bots.
 * 
 * Format: /get-my-Bots
 */
class getMyBots extends ClientCommand {

    /**
     * Creates the command.
     * 
     * @param client 
     */
    constructor(client: ChatClient) {
        super('get-my-bots', [], client);
    }

    /**
     * Execute the command. The cli will output "Your Bots:" followed by the user's Bots.
     * If the user has no Bots, it will output "You have no Bots.".
     * 
     * @param args 
     */
    execute(): void {
        let Bots = 'Your bots:';
        this.client.activeBots.forEach(
            (bot) => {
                Bots += '\n' + bot.chatclient.nick;
            }
        );

        if (Bots == 'Your Bots:') this.client.eventHandler.emit('message', 'You have no Bots.');
        else this.client.eventHandler.emit('message', Bots);
    }

}

export default getMyBots;