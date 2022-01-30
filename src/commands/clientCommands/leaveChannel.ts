/**
 * Module dependencies.
 */
import ClientCommand from './clientCommand';
import ChatClient from '../../client';

/**
 * LeaveChannel class.
 * 
 * Format: /join-channel <channelName>
 */
class LeaveChannel extends ClientCommand{

    /**
     * Creates a new LeaveChannel command.
     * 
     * @param client 
     */
    constructor(client: ChatClient) {
        super('leave-channel', ['channel_name'], client);
    }

    /**
    * Leaves the given channel.
    * 
    * @param args    Extra arguments given with this command.  
    */
    execute(args: string[]): void {
        this.client.send({
            command: 'channel-leave',
            id: this.client.getCommandId(),
            channelName: args[0]
        });
        this.client.world?.playSoundEffect('woop3');
    }

}

/**
 * Module exports.
 */
export default LeaveChannel;