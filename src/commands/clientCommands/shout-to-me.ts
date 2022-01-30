/**
 * Module dependencies.
 */
import * as chalk from 'chalk';
import ChatClient from '../../client';
import ClientCommand from './clientCommand';

/**
 * Shout-to-me class.
 * 
 * Format: /shout-to-me <Message>
 */
class ShoutToMe extends ClientCommand {

    colorList: string[];           // List of all colors in which a message can be sent by this command.

    /**
     * Creates a new ShoutToMe command.
     * 
     * @param client 
     */
    constructor(client: ChatClient) {
        super('shout-to-me', ['text'], client);
        this.colorList = ['black', 'red', 'green', 'yellow',
            'blue', 'magenta', 'cyan', 'white'];
    }

    /**
    * Paint the given text and send them only to the sender.
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
        this.client.filters.forEach(
            (filter) => text = filter.filter(text)
        );

        text = `[${this.client.nick}] ` + text;

        this.client.send({
            command: 'message',
            id: this.client.getCommandId(),
            msg: {
                message: text,
                to: this.client.getPublicKeyHash(),
                from: this.client.getPublicKeyHash()
            }
        });
    }

}

/**
 * Module exports.
 */
export default ShoutToMe;