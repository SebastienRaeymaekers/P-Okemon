/**
 * Module dependencies.
 */
import ClientCommand from './clientCommand';
import ChatClient from '../../client';
import * as fs from 'fs';

/**
 * When the addFilter command is executed, a new filter of the specified type is created 
 * and added to the user's filter stack.
 * 
 * Format: /add-filter <type> <command> <direction> <channelName>
 */
class addFilter extends ClientCommand {

    /**
     * Creates a new command to add a filter.
     * 
     * @param client 
     */
    constructor(client: ChatClient) {
        super('add-filter', ['type', 'command', 'direction', 'channelName' ], client);
    }
    
    /**
     * Execute this command. A new filter with type specified in the args will be added to
     * the user's filter stack.
     * 
     * @param args    Extra arguments given with this command. 
     */
    execute(args: string[]): void {
        const config: {[type: string]: {active: boolean}} = JSON.parse(fs.readFileSync('../bin/filterconfig.json').toString());
        for (const [filtername, filterconfig] of Object.entries(config)) { // Look for the entry in bin/filterconfig.json corresponding to the specified filter
            if (filtername == args[0]) {
                if (filterconfig.active) {
                    const newArgs = args.slice(1);
                    this.client.addFilter(args[0],newArgs); // Add the filter if it's active
                    this.client.eventHandler.emit('message',`Added filter of type "${args[0]}".`);
                    // this.client.cli.printOnCLI(`Added filter of type "${args[0]}".`);
                }
                else this.client.eventHandler.emit('message','The filter is not active. (hint: use /get-all-filters to see all active filters)'); // this.client.cli.printOnCLI
                return;
            }
        }
        this.client.eventHandler.emit('message','The filter does not seem to exist yet (hint: use /get-all-filter to see all active filters)');
    }
    
}

export default addFilter;