/**
 * Module dependencies.
 */
import ClientCommand from './clientCommand';
import ChatClient from '../../client';

/**
 * pluginCommand class.
 * This is an example class and it shows how external features can create a .js file to specify their commands.
 */
class PluginCommand extends ClientCommand {

    /**
     * It is important to specify a name for you command. This way the cli recognizes your command 
     * and the cmdManager can call the execute function defined by this class. Also define the arguments the command can take.
     * 
     * @param client 
     */
    constructor(client: ChatClient) {
        super('plugin-command', ['argument 1', 'argument 2'], client);
    }

    /**
     * This function has the same functionality as shout-to-all as an example.
     * @param {*} args Arguments for the function defined by the user of this class.
    */
    execute(): void {
        // this.client.send({
        //     command: "plugin-command",
        //     id: 0, //TODO id
        //     data: args.join(" ")
        // });
    }
}

/**
 * Module exports.
 */
export default PluginCommand;