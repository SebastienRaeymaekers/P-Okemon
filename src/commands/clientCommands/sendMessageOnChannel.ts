/**
 * Module dependencies.
 */
import * as crypto from 'crypto';
import ClientCommand from './clientCommand';
import ChatClient from '../../client';

/**
 * SendMessageOnChannel class.
 * 
 * Format: /send-message-on-channel <channelName> <message>
 */
class SendMessageOnChannel extends ClientCommand {

    /**
     * Creates a new SendMessageOnChannel command.
     * 
     * @param client 
     */
    constructor(client: ChatClient) {
        super('send-message-on-channel', ['channel_name', 'text'], client);
    }

    /**
    * Paints the given text and send them to all members of the given channel.
    * 
    * @param args    Extra arguments given with this command.  
    */
    execute(args: string[]): void {
        const toSendTo = args[0];
        let message = args[1];
        if (!message) {
            this.client.eventHandler.emit('error', 'Wrong parameters!');
        } else {
            for (let i = 2; i < args.length; i++) {
                message += ' ' + args[i];
            }
            // apply filters
            this.client.filters.forEach(
                (filter) => {
                    if (filter.channelName == args[0] || filter.channelName == null) {
                        message = filter.filter(message)
                    }
                }
            );

            message = `${this.client.nick}:` + message;

            // encrypt message
            const password = this.client.getChannelPassword(args[0]);
            const key = crypto.createHash('sha256').update(String(password)).digest('base64').substr(0, 32);

            const iv = crypto.randomBytes(16);
            const cipher = crypto.createCipheriv('aes-256-ctr', key, iv);
            let encrypted = cipher.update(message);
            encrypted = Buffer.concat([encrypted, cipher.final()]);
            const encryptedMsg = iv.toString('hex') + ':' + encrypted.toString('hex');

            // sends message
            this.client.send({
                command: 'message',
                id: this.client.getCommandId(),
                msg: {
                    message: encryptedMsg,
                    from: this.client.getPublicKeyHash(),
                    to: toSendTo
                }
            });
        }
    }

}

/**
 * Module exports.
 */
export default SendMessageOnChannel;