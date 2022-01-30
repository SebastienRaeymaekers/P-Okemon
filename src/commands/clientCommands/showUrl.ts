import ClientCommand from './clientCommand';
import ChatClient from '../../client';

class ShowUrl extends ClientCommand {

    constructor(client: ChatClient) {
        super('show-url', [], client);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    execute(args: string[]): void {
        this.client.eventHandler.emit('serverMessage', { message: 'This client is connected to: ' + this.client.server_url });
    }

}

/**
 * Module exports.
 */
export default ShowUrl;