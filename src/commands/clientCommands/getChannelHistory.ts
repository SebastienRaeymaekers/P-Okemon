/**
 * Module dependencies.
 */
import ClientCommand from './clientCommand';
import ChatClient from '../../client';

/**
 * GetChannelHistory class.
 * 
 * Format: /get-channel-history <channelName>
 */
class GetChannelHistory extends ClientCommand{

    /**
     * Creates a new GetChannelHistory command.
     * 
     * @param client  
     */
    constructor(client: ChatClient) {
        super('get-channel-history', ['channel_name'], client);
    }

    /**
    * Prints the chat history of the given channel.
    * 
    * @param args    Extra arguments given with this command.  
    */
    execute(args: string[]): void {
        this.client.send({
            command: 'channel-history',
            id: this.client.getCommandId(),
            channelName: args[0]
        });
    }

}

/**
 * Module exports.
 */
export default GetChannelHistory;