/**
 * Module dependencies.
 */
import ClientCommand from './clientCommand';
import ChatClient from '../../client';

/**
 * Displays the user's filter stack, in the order of filtering.
 * 
 * Format: /get-my-filters
 */
class getMyFilters extends ClientCommand {

    /**
     * Creates the command.
     * 
     * @param client 
     */
    constructor(client: ChatClient) {
        super('get-my-filters', [], client);
    }

    /**
     * Execute the command. The cli will output "Your filters:" followed by the user's filters.
     * If the user has no filters, it will output "You have no filters.".
     * 
     * @param args 
     */
    execute(): void {
        let filters = 'Your filters (outgoing):';
        this.client.filters.forEach(
            (filter) => {
                filters += '\n' + filter.type;
            }
        );
        filters += '\n' + 'Your filters (incoming):'
        this.client.filtersIncoming.forEach(
            (filter) => {
                filters += '\n' + filter.type;
            }
        );

        if (filters == 'Your filters:') this.client.eventHandler.emit('message', 'You have no filters.');
        else this.client.eventHandler.emit('message', filters);
    }

}

export default getMyFilters;