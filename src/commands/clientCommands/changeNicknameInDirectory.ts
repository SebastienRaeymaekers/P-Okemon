/**
 * Module dependencies.
 */
import ChatClient from '../../client';
import ClientCommand from './clientCommand';

/**
 * changeNicknameInDirectory class. 
 * 
 * Format: /print-directory
 */
class changeNicknameInDirectory extends ClientCommand{

    /**
     * Creates a new ShoutToAll command.
     * 
     * @param client 
     */
    constructor(client: ChatClient) {
        super('change-nickname-in-directory', ['fingerprint', 'new nick'], client);
    }

    /**
     * changes the nickname of a user 
     * 
     * @param args    Extra arguments given with this command.  
     */
    execute(args: string[]): void {
        this.client.changeNickInDirectory(args[0], args[1]);
    }
}

/**
 * Module exports.
 */
export default changeNicknameInDirectory;