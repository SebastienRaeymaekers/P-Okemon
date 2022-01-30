/**
 * Module dependencies.
 */
import ClientCommand from './clientCommand';
import ChatClient from '../../client';
import * as fs from 'fs';

/**
 * Displays all filters from the bin/filterconfig.json file that are active.
 * 
 * Format: /get-all-filters
 */
class getAllFilters extends ClientCommand {

    /**
     * Creates the command.
     * 
     * @param client 
     */
    constructor(client: ChatClient) {
        super('get-all-filters', [], client);
    }

    /**
     * Execute the command. The cli will output "Available filters:" followed by the active filters.
     * If there are no active filters it will output "There are no available filters."
     * 
     * @param args 
     */
    execute(): void {
        let activeFilters = 'Available filters:';
        const config: { [type: string]: { active: boolean } } = JSON.parse(fs.readFileSync('../bin/filterconfig.json').toString()); // load in config file
        for (const [filtername, filterconfig] of Object.entries(config)) { // loop through entries
            if (filterconfig.active) {
                activeFilters += '\n' + filtername; // add filter name to the activeFilters string
            }
        }
        if (activeFilters == 'Available filters:') this.client.eventHandler.emit('message', 'There are no available filters.'); //
        else this.client.eventHandler.emit('message', activeFilters);
    }

}

export default getAllFilters;