/**
 * Module dependencies.
 */
import ClientCommand from './clientCommand';
import ChatClient from '../../client';

/**
 * Removes the top filter from the user's filter stack, and prints it's type.
 * 
 * Format: /remove-filter <direction>
 */
class removeFilter extends ClientCommand {

    /**
     * Creates the command.
     * 
     * @param client 
     */
    constructor(client: ChatClient) {
        super('remove-filter', ['direction'], client);
    }

    /**
     * Execute the command. The cli will output which filter has been removed.
     * If the user has no filters it will output "You have no filters active."
     * 
     * @param args 
     */
    execute(args: string[]): void {
        const filter = this.client.removeFilter(args[0]);
        if (typeof filter === 'object') this.client.eventHandler.emit('message',`The filter of type "${filter.type}" was removed.`);
        else this.client.eventHandler.emit('message','You have no filters active.');
    }

}

export default removeFilter;