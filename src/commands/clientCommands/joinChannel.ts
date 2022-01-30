/**
 * Module dependencies.
 */
import ClientCommand from './clientCommand';
import ChatClient from '../../client';

/**
 * JoinChannel class.
 * 
 * Format: /join-channel <channelName>
 */
class JoinChannel extends ClientCommand{

    /**
     * Creates a new JoinChannel command.
     * 
     * @param client 
     */
    constructor(client: ChatClient) {
        super('join-channel', ['channel_name'], client);
    }

    /**
    * Joins the given channel.
    * 
    * @param args    Extra arguments given with this command.  
    */
    execute(args: string[]): void {
        this.client.send({
            command: 'channel-join',
            id: this.client.getCommandId(),
            channelName: args[0]
        });
        this.client.world?.playSoundEffect('woop2');
    }

}

/**
 * Module exports.
 */
export default JoinChannel;