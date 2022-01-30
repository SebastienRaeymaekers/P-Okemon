/**
 * Module dependencies.
 */
import * as chalk from 'chalk';
import ChatClient from '../../client';
// import { Command } from 'yargs';
import ClientCommand from './clientCommand';

/**
 * SendDirectMessage class. 
 * 
 * Format: /send-direct-message <Message> <nick>
 */
class SendDirectMessage extends ClientCommand {

    colorList: string[];           // List of all colors in which a message can be sent by this command.

    /**
     * Creates a new ShoutToAll command.
     * 
     * @param client 
     */
    constructor(client: ChatClient) {
        super('send-direct-message', ['fingerprint', 'text'], client);
        this.colorList = ['black', 'red', 'green', 'yellow',
            'blue', 'magenta', 'cyan', 'white'];
    }

    /**
     * Paint the given text and send them to everyone connected to the server.
     * 
     * @param args    Extra arguments given with this command.  
     */
    execute(args: string[]): void {
        console.log('argumenten zijn: ')
        console.log(args);
        const toClient: string = args[1]

        let text: string;
        if (this.colorList.includes(toClient)) {
            // if a color is in the arguments, use this color.
            text = chalk.keyword(toClient)(args.slice(2, args.length).join(' '));
        } else {
            text = args.slice(1, args.length).join(' ');
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
                from: this.client.getPublicKeyHash(),
                to: args[0]
            }
        });
    }
}

/**
 * Module exports.
 */
export default SendDirectMessage;