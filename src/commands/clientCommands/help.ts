/**
 * Module dependencies.
 */
import ClientCommand from './clientCommand';
import ChatClient from '../../client';

/**
 * Help class.
 * 
 * Format: /help
 */
class Help extends ClientCommand {

    /**
     * Creates a new Help command.
     * 
     * @param client  
     */
    constructor(client: ChatClient) {
        super('help', [], client);
    }

    /**
     * Paints the help menu.
     * 
     * @param cmdManager    The command manager.  
     */
    execute(): void {

        this.client.eventHandler.emit('helpCommand', null);
        const commandsAndArgumens = this.client.helpCommands;
        this.client.eventHandler.emit('serverMessage', { message: '---------------- help menu -----------------' });
        this.client.eventHandler.emit('serverMessage', { message: 'To type a command, write /command {argument}' });
        this.client.eventHandler.emit('serverMessage', { message: '--------------------------------------------' });
        let commandsAndArgumensString = '';
        for (const [key, value] of commandsAndArgumens) {
            commandsAndArgumensString += key + ' {' + value.join('} {') + '}\n';
            this.client.eventHandler.emit('serverMessage', { message: commandsAndArgumensString });
        }
        this.client.eventHandler.emit('serverMessage', { message: '------------------------------' });
        // this.client.eventHandler.emit('serverMessage', { message: commandsAndArgumensString});

    }
}

/**
 * Module exports.
 */
export default Help;