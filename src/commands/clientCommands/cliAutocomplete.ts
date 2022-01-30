/**
 * Module dependencies.
 */
import ChatClient from '../../client';
import ClientCommand from './clientCommand';

/**
 * CLI_autocomplete class.
 * 
 * Format: /CLI-autocomplete <language>
 */
class cliAutocomplete extends ClientCommand {

    /**
     * Creates a new cliAutocomplete command.
     * 
     * @param client  
     */
    constructor(client: ChatClient) {
        super('cli-autocomplete', ['language'], client);
    }

    /**
    * Build a new autocomplete tree in a new language.
    * @param {*} args 
    */
    execute(args: string[]): void {
        this.client.eventHandler.emit('autocomplete', args[0]);
    }
}

/**
 * Module exports.
 */
export default cliAutocomplete;