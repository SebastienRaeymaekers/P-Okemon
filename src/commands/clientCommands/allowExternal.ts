/**
 * Module dependencies.
 */
import ChatClient from '../../client';
import ClientCommand from './clientCommand';

/**
 * AllowExternal class.
 * 
 * Format: /allow-external <channelName> <allowed>
 */
class AllowExternal extends ClientCommand{

    /**
     * Creates a new AllowExternal command.
     * 
     * @param client
     */
    constructor(client: ChatClient) {
        super('allow-external', ['channel_name', 'allow_external'], client);
    }

    execute(args: string[]): void {
        this.client.send({
            command: 'channel-allow-external',
            id: this.client.getCommandId(),
            channelName: args[0],
            allowExternal: args[1] === 'true'
        });
    }
    
}

/**
 * Module exports.
 */
export default AllowExternal;