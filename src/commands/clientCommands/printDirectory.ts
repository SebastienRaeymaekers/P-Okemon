/**
 * Module dependencies.
 */
import ChatClient from '../../client';
// import { Command } from 'yargs';
import ClientCommand from './clientCommand';

/**
 * PrintDirectory class. 
 * 
 * Format: /print-directory
 */
class PrintDirectory extends ClientCommand {

    /**
     * Creates a new ShoutToAll command.
     * 
     * @param client 
     */
    constructor(client: ChatClient) {
        super('print-directory', [], client);
    }

    /**
     * Paint the given text and send them to everyone connected to the server.
     * 
     * @param args    Extra arguments given with this command.  
     */
    execute(): void {
        // this.client.eventHandler.emit('helpCommand',null);

        this.client.eventHandler.emit('serverMessage', { message: '-------------Your contacts-------------' });
        let contacts = '';
        for (const [key, value] of this.client.directory) {
            contacts += 'nick: ' + value + ' fingerprint: ' + key + '\n';
        }
        this.client.eventHandler.emit('serverMessage', { message: contacts });
        this.client.eventHandler.emit('serverMessage', { message: '---------------------------------------' });
    }
}

/**
 * Module exports.
 */
export default PrintDirectory;