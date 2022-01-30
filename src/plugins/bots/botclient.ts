/**
 * Module dependencies.
 */
import ChatClient from '../../client';
import * as debugModule from 'debug';
import * as crypto from 'crypto';
const debug = debugModule('chat:chatbot');
import * as eliza from './elizabot/elizabot';
import * as magic8bot from './magic8bot/magic8bot';
import * as rotationbot from './rotationbot/rotationbot';

/**
 * Class of chatbots.
 */
class BotClient {

    answer_algorithm;         // Name of the file that contains the answer algorithm of this bot.
    is_sleeping: boolean;     // Boolean that specifies the state of this chatbot.
    timer!: NodeJS.Timeout;   // Timer handle, to start a conversation.
    user: string | null;      // The nickname of the person this bot responds to (if null, responds to everyone).
    pluginName: string        // The name of the plugin that this chatbot will use.
    ownerClient: ChatClient;
    channelName: string | null;
    chatclient: ChatClient;

    /**
     * Create a new chatbot.
     * 
     * @param {String} server_url       Url of the server.
     * @param {string} pluginName       Name of the plugin.
     * @param {String} user             Owner of this bot.
     * @param {String} nick             Nick of this bot. 
     */
    constructor(server_url: string, pluginName: string, nick: string, user: string, client: ChatClient, channelName: string | null, chatclient: ChatClient) {
        // super(server_url, nick);
        this.ownerClient = client;
        this.user = user;
        this.channelName = channelName;
        this.pluginName = pluginName;
        this.chatclient = chatclient;
        switch (pluginName) {
            default:
                this.answer_algorithm = eliza;
                break;
            case 'magic8bot':
                this.answer_algorithm = magic8bot;
                break;
            case 'rotationbot':
                this.answer_algorithm = rotationbot;
                break;
        }
        this.is_sleeping = false;

        if (this.channelName != null) {
            this.chatclient.send({
                command: 'channel-join',
                id: this.chatclient.getCommandId(),
                channelName: this.channelName
            });
        }

        debug(`Converted client to new ChatBot "${nick}" @ ${server_url}`);
    }

    /**
     * This is called when we receive a message from the server.
     *
     * @param {Object} msg    The received message.
     */
    onMessage(msg: { nick?: string, text: string, channel_name: string | null }): void {

        clearTimeout(this.timer);
        if (this.user == null && msg.nick != this.ownerClient.nick || msg.nick == this.user) // this.user == null && msg.nick != this.ownerClient.nick || msg.nick == this.user)
            if (this.channelName != null && msg.channel_name != null && (this.channelName == msg.channel_name)) {
                const message = this.chatclient.nick + ':' + this.answer_algorithm.answer(msg.text);

                // encryptes message
                debug(this.channelName);
                const password = this.ownerClient.getChannelPassword(this.channelName);
                const key = crypto.createHash('sha256').update(String(password)).digest('base64').substr(0, 32);

                const iv = crypto.randomBytes(16);
                const cipher = crypto.createCipheriv('aes-256-ctr', key, iv);
                let encrypted = cipher.update(message);
                encrypted = Buffer.concat([encrypted, cipher.final()]);
                const encryptedMsg = iv.toString('hex') + ':' + encrypted.toString('hex');

                // encrypt message

                this.chatclient.send({
                    command: 'message',
                    id: this.chatclient.getCommandId(),
                    msg: {
                        message: encryptedMsg,
                        from: this.chatclient.getPublicKeyHash(),
                        to: this.channelName
                    }
                });
            } else if (this.channelName == null && msg.channel_name == null) {
                this.chatclient.send({
                    command: 'message',
                    id: this.chatclient.getCommandId(),
                    msg: {
                        message: this.answer_algorithm.answer(msg.text),
                        from: this.chatclient.getPublicKeyHash(),
                        to: 'all'
                    }
                });
            }

        if (this.answer_algorithm.getTimeOut()) {
            this.timer = setTimeout(() => {
                // this.chatclient.send('/shout-to-all', { nick: this.chatclient.nick, text: this.answer_algorithm.timeoutmessage()
                if (this.channelName != null) {

                    const message = this.chatclient.nick + ':' + this.answer_algorithm.timeoutmessage()
                    // enryptes message
                    const password = this.ownerClient.getChannelPassword(this.channelName);
                    const key = crypto.createHash('sha256').update(String(password)).digest('base64').substr(0, 32);

                    const iv = crypto.randomBytes(16);
                    const cipher = crypto.createCipheriv('aes-256-ctr', key, iv);
                    let encrypted = cipher.update(message);
                    encrypted = Buffer.concat([encrypted, cipher.final()]);
                    const encryptedMsg = iv.toString('hex') + ':' + encrypted.toString('hex');

                    this.chatclient.send({
                        command: 'message',
                        id: this.chatclient.getCommandId(),
                        msg: {
                            message: encryptedMsg,
                            from: this.chatclient.getPublicKeyHash(),
                            to: this.channelName
                        }
                    });
                } else {
                    this.chatclient.send({
                        command: 'message',
                        id: this.chatclient.getCommandId(),
                        msg: {
                            message: this.answer_algorithm.timeoutmessage(),
                            from: this.chatclient.getPublicKeyHash(),
                        }
                    });
                }

            }, 60000); // time amount can be replace with random intervals e.g. Math.random() * 5000
        }
    }

    /**
     * kill the bot
     */
    killBotclient(): void {
        this.ownerClient.activeBots.delete(this.chatclient.nick); // + "-" + this.pluginName
        this.chatclient.socket.close();
    }

}

/**
 * Module exports.
 */
export default BotClient;