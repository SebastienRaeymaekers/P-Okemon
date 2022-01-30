/**
 * Module dependencies.
 */
import ChatClient from '../../client';
import ClientCommand from './clientCommand';

/**
 * updateUser class. 
 * 
 * Format: /update-user
 */
class UpdateUser extends ClientCommand {

    /**
     * Creates a new updateUser command.
     * 
     * @param client 
     */
    constructor(client: ChatClient) {
        super('update-user', ['location', 'orientation'], client);
    }

    /** 
     * 
     * @param args    Extra arguments given with this command.  
     */
    execute(args: string[]): void {
        this.client.updateUserInWorld([parseInt(args[0][1]), parseInt(args[0][3])], parseInt(args[1]));
    }
}

/**
 * Module exports.
 */
export default UpdateUser;