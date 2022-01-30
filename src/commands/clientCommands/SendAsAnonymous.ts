/**
 * Module dependencies.
 */
import * as chalk from 'chalk';
import ChatClient from '../../client';
// import { Command } from 'yargs';
import ClientCommand from './clientCommand';
import * as crypto from 'crypto';

/**
 * SendAsAnonymous class. 
 * 
 * Format: /send-as-anonymous <Message> <nick>
 */
class SendAsAnonymous extends ClientCommand {

    colorList: string[];           // List of all colors in which a message can be sent by this command.

    /**
     * Creates a new ShoutToAll command.
     * 
     * @param client 
     */
    constructor(client: ChatClient) {
        super('send-as-anonymous', ['text', 'fingerprint'], client);
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
            text = chalk.keyword(args[0])(args.slice(1, args.length - 1).join(' '));
        } else {
            text = args.slice(0, args.length - 1).join(' ');
        }
        // apply filters
        this.client.filters.forEach(
            (filter) => text = filter.filter(text)
        );

        // search for the public key of the nick given in the directory
        // let fingerPrintGivenNick: string | undefined = this.client.directory.get(args[1])

        // if(publicKeyOfGivenNick != undefined){
        // encrypt text with private key
        /*
        const sign = crypto.createSign('SHA256');
        sign.update(text);
        sign.end();
        const signature = sign.sign(this.client.private_key);
        */
        const buffer = Buffer.from('encryptedMessage: ' + text, 'utf8');
        const encryptedText = crypto.privateEncrypt(this.client.private_key, buffer);

        // let fingerprint = '';
        // for (const [key, value] of this.client.directory.entries()) {
        //     if (value === args[args.length - 1])
        //         fingerprint = key;
        // }

        this.client.send({
            command: 'message',
            id: this.client.getCommandId(),
            msg: {
                message: encryptedText.toString('base64'),
                to: args[args.length-1]
            }
        });

    }
}

/**
 * Module exports.
 */
export default SendAsAnonymous;