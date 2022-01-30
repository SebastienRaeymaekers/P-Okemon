/**
 * Module dependencies.
 */
import ChatClient from '../../client';
// import { Command } from 'yargs';
import ClientCommand from './clientCommand';

/**
 * printPublicKeys class. 
 * 
 * Format: /print-directory
 */
class printPublicKeys extends ClientCommand {

    /**
     * Creates a new ShoutToAll command.
     * 
     * @param client 
     */
    constructor(client: ChatClient) {
        super('print-public-keys', [], client);
    }

    /**
     * Paint the given text and send them to everyone connected to the server.
     * 
     * @param args    Extra arguments given with this command.  
     */
    execute(): void {
        // this.client.eventHandler.emit('helpCommand',null);

        this.client.eventHandler.emit('message', '-----------------Your contacts-----------------');

        this.client.eventHandler.emit('message', this.client.publicKeys);
        this.client.eventHandler.emit('message', '-----------------------------------------------');
    }
}

/**
 * Module exports.
 */
export default printPublicKeys;