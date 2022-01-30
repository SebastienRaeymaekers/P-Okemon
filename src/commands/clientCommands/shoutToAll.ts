/**
 * Module dependencies.
 */
import * as chalk from 'chalk';
import ChatClient from '../../client';
// import { Command } from 'yargs';
import ClientCommand from './clientCommand';

/**
 * Shout-to-all class. 
 * 
 * Format: /shout-to-all <Message>
 */
class ShoutToAll extends ClientCommand {

    colorList: string[];           // List of all colors in which a message can be sent by this command.

    /**
     * Creates a new ShoutToAll command.
     * 
     * @param client 
     */
    constructor(client: ChatClient) {
        super('shout-to-all', ['text'], client);
        this.colorList = ['black', 'red', 'green', 'yellow',
            'blue', 'magenta', 'cyan', 'white'];
    }

    /**
     * Paint the given text and send them to everyone connected to the server.
     * 
     * @param args    Extra arguments given with this command.  
     */
    execute(args: string[]): void {
        let text: string;
        if (this.colorList.includes(args[0])) {
            // if a color is in the arguments, use this color.
            text = chalk.keyword(args[0])(args.slice(1).join(' '));
        } else {
            text = args.join(' ');
        }
        // apply filters
        // this.client.filters.forEach(
        //     (filter) => text = filter.filter(text)
        // );

        this.client.filters.forEach(
            (filter) => {
                if (filter.channelName == null) {
                    text = filter.filter(text)
                }
            }
        );

        text = `[${this.client.nick}] ` + text;

        this.client.send({
            command: 'message',
            id: this.client.getCommandId(),
            msg: {
                message: text,
                from: this.client.getPublicKeyHash(),
                to: 'all'
            }
        });

        this.client.world?.playSoundEffect('woop1');
    }
}

/**
 * Module exports.
 */
export default ShoutToAll;