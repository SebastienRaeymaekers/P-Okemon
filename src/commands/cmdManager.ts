import browserInterface from '../app/browser_interface';
import CLI from '../interface/cli';
import ClientCommand from './clientCommands/clientCommand';

/**
 * cmdManager class.
 */
class CmdManager {
    commandMap: Map<string, ClientCommand> // maps a string to an object that represents a command.
    cli: CLI | browserInterface;

    constructor(cli: CLI | browserInterface) {
        this.cli = cli;
        this.commandMap = new Map<string, ClientCommand>();
    }

    /**   const serverName;
    const Ip;
    const Port;

    constructor(serverName: String, Ip: String, Port: Number) {
        this.serverName = serverName;
        this.Ip= Ip;
        this.Port = Port; 
    }  
     * Return the set of possible commands.
     */
    getCommands(): Map<string, ClientCommand> {
        return this.commandMap;
    }

    /**
     * Return the list of possible commands.
     */
    getCommandsAsList(): string[] {
        return Array.from(this.commandMap.keys());
    }

    /**
     * Add a command to the command map.
     * @param {*} command Command that needs to be added to the map of commands
     */
    addCommand(command: ClientCommand): void {
        this.commandMap.set(command.name, command);
    }

    /**
     * Add a command to the command map.
     * @param {*} command Command that needs to be removed to the map of commands
     */
    removeCommand(command: ClientCommand): void {
        this.commandMap.delete(command.name);
    }

    /**
     * Execute a command.
     * @param {*} command The name of the command that needs to be executed
     * @param {*} args The arguments of the given command
     */
    execute(cli: CLI | browserInterface, commandName: string, args: string[]): void {
        if (commandName.startsWith('/')) commandName = commandName.substring(1);
        const cmd = this.commandMap.get(commandName);
        if (!cmd) {
            cli.printAlert('Unknown Command!');
        } else {
            cmd.execute(args);
            this.cli.printCommandEntered('> ' + commandName + ' ' + args.join(' '))
        }
    }

    /**
     * Take as input an array of args (in this case the words of a sentence) 
     * and returns the full sentence.
     * @param {*} textArgs  An array consisting of strings 
     *                      that represent the words in the user message
     */
    createTextString(textArgs: string[]): string {
        let result = '';
        for (let index = 0; index < textArgs.length; index++) {
            // If it's the last word in the sentence, don't add a space at the end.
            if (index == textArgs.length - 1) {
                result += textArgs[index];
            } else {
                result += textArgs[index] + ' ';
            }
        }
        return result;
    }

    /**
     * Returns all possible commands the user can execute and the associated arguments.
     */
    getCommandsAndArguments(): Map<string, string[]> {
        const commandsAndArguments: Map<string, string[]> = new Map();
        const commandsAsList: string[] = this.getCommandsAsList();
        for (let i = 0; i < commandsAsList.length; i++) {
            commandsAndArguments.set('/' + commandsAsList[i], this.getCommands().get(commandsAsList[i])!.argumentsPattern);
        }
        return commandsAndArguments
    }
}

/**
 * Module exports.
 */
export default CmdManager;