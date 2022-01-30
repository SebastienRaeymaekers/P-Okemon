/**
 * Module dependencies.
 */
import * as chalk from 'chalk';
import ChatClient from '../../client';
// import { Command } from 'yargs';
import ClientCommand from './clientCommand';
import * as crypto from 'crypto';

/**
 * SendToAnonymous class. 
 * 
 * Format: /send-to-anonymous <Message> <nick>
 */
class SendToAnonymous extends ClientCommand {

    colorList: string[];           // List of all colors in which a message can be sent by this command.

    /**
     * Creates a new ShoutToAll command.
     * 
     * @param client 
     */
    constructor(client: ChatClient) {
        super('send-to-anonymous', ['text', 'fingerprint'], client);
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
        this.client.filters.forEach(
            (filter) => text = filter.filter(text)
        );

        // search for the public key of the nick given in the directory
        // let fingerprint = '';
        // for (const [key, value] of this.client.directory.entries()) {
        //     if (value === args[args.length - 1])
        //         fingerprint = key;
        // }
        let publicKey: string | undefined = '';
        if (this.client.publicKeys.has(args[args.length - 1])) { publicKey = this.client.publicKeys.get(args[args.length - 1]); }

        const buffer = Buffer.from('message4U: ' + text, 'utf8');
        const encryptedText = crypto.publicEncrypt(publicKey!, buffer).toString('base64');

        this.client.send({
            command: 'message',
            id: this.client.getCommandId(),
            msg: {
                message: encryptedText,
                from: this.client.getPublicKeyHash()
            }
        });
    }
}

/**
 * Module exports.
 */
export default SendToAnonymous;