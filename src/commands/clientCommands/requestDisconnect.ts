/**
 * Module dependencies.
 */
import ChatClient from '../../client';
import ClientCommand from './clientCommand';

/**
 * requestDisconnect class.
 * 
 * Format: /disconnect
 */
class requestDisconnect extends ClientCommand {

    /**
     * Creates a new requestDisconnect command.
     * 
     * @param client 
     */
    constructor(client: ChatClient) {
        super('disconnect', [], client);
    }

    /**
     * Sends a disconnect command to the server
     * @param args no parameters needed
     */
    execute(): void {
        if (this.client.verified) {
            this.client.send({
                command: 'request-disconnect',
                id: this.client.getCommandId(),
                from: this.client.getPublicKeyHash()
            });
        }

    }

}

/**
 * Module exports.
 */
export default requestDisconnect;