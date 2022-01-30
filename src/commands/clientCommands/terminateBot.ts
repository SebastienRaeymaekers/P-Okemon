/**
 * Module dependencies.
 */
import ClientCommand from './clientCommand';
import ChatClient from '../../client';

/**
 * When the terminateBot command is executed, The given bot will be killed
 * 
 * Format: /terminate-bot <botName>
 */
class terminateBot extends ClientCommand {

    /**
     * Creates a new command to add a filter.
     * 
     * @param client 
     */
    constructor(client: ChatClient) {
        super('terminate-bot', ['botName'], client);
    }

    /**
     * Execute this command. Given bot will be killed.
     * 
     * @param args    Extra arguments given with this command. 
     */
    execute(args: string[]): void {

        if (this.client.activeBots.has(args[0])) {
            const botToTerminate = this.client.activeBots.get(args[0]);
            if (botToTerminate) {
                botToTerminate.killBotclient();
                this.client.eventHandler.emit('message', 'bot with nick: ' + args[0] + ' has been killed');
            } else {
                this.client.eventHandler.emit('message', 'This bot does not exist!');
            }
        } else {
            this.client.eventHandler.emit('message', "You can't kill this bot (you probably don't own it)");
        }
    }

}

export default terminateBot;