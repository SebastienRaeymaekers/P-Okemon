/**
 * Module dependencies.
 */
import ChatClient from '../../client';
import ClientCommand from './clientCommand';

/**
 * CreateChannel class.
 * 
 * Format: /get-all-channels 
 */
class GetAllChannels extends ClientCommand {

    /**
     * Creates a new GetAllChannels command.
     * 
     * @param client  
     */
    constructor(client: ChatClient) {
        super('get-all-channels', [], client);
    }

    /**
    * Prints all the channels that are made.
    * 
    * @param args    Extra arguments given with this command.  
    */
    execute(): void {
        this.client.send({
            command: 'channel-list',
            id: this.client.getCommandId(),
        });
    }

}

/**
 * Module exports.
 */
export default GetAllChannels;