/**
 * Module dependencies.
 */
import ChatClient from '../../client';
import ClientCommand from './clientCommand';
import * as debugModule from 'debug';
const debug = debugModule('chat:createChannel');

/**
 * CreateChannel class.
 * 
 * Format: /create-channel <channelName>
 */
class CreateChannel extends ClientCommand {

    /**
     * Creates a new CreateChannel command.
     * 
     * @param client  
     */
    constructor(client: ChatClient) {
        super('create-channel', ['channel_name'], client);
    }

    /**
    * Creates a new channel with the given name.
    * 
    * @param args    Extra arguments given with this command.  
    */
    execute(args: string[]): void {
            this.client.send({
                command: 'channel-create',
                id: this.client.getCommandId(),
                channelName: args[0],
                properties: {
                    saveHistory: true, // TODO not used yet by us
                    messageOutside: false, // TODO also not used yet
                    publicKey: Math.random().toString(36).slice(2)
                }
            });
            debug('in send channel-create');
    }

}

/**
 * Module exports.
 */
export default CreateChannel;