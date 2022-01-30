/**
 * Module dependencies.
 */
import ChatClient from '../../client';

abstract class ClientCommand {

    name: string;                  // The name that the user needs to give to execute this command.
    argumentsPattern: string[];    // List of arguments that the user can give for this command. (Shown with /help in CLI)
    client: ChatClient;            // The client the command is attached to.

    /**
     * Creates a new command.
     * 
     * @param name 
     * @param argumentsPattern 
     * @param client 
     * @param execute 
     */
    constructor(name: string, argumentsPattern: string[], client: ChatClient) {
        this.name = name;
        this.argumentsPattern = argumentsPattern;
        this.client = client;
        this.client.eventHandler.emit('addCommand', this)

    }

    abstract execute(args: string[]): void;

}

/**
 * Module exports.
 */
export default ClientCommand;