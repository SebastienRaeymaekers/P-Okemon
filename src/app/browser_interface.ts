/**
 * Module dependencies.
 */
import Client from './../client';
import * as commands from '../commands/clientCommands/allCommands';
import * as protocol from './../protocol';
import CmdManager from '../commands/cmdManager';
import ClientCommand from '../commands/clientCommands/clientCommand';
import AutoComplete from '../interface/autoComplete';
import { messageToSend, refreshChannelList, refreshFriendlist } from './browserComponents/header';

/**
 * Browser Interface class.
 */
class browserInterface {

    messagesDiv = document.getElementById('chatBox') as HTMLElement;
    client: Client;
    cmdManager: CmdManager;
    defaultCmd: string;
    cmdList: string[];
    ignoreKeys: boolean;

    autoComplete: AutoComplete;
    lastAutocompletedWord: string;
    timesTabPressed: number;
    autocompletedWords: string[];

    constructor(client: Client) {
        this.client = client;
        this.defaultCmd = 'shout-to-all';
        this.cmdManager = new CmdManager(this);
        this.ignoreKeys = false;

        this.instanciateAllCommands();
        this.cmdList = this.cmdManager.getCommandsAsList();

        this.autoComplete = new AutoComplete(this.cmdList);
        this.lastAutocompletedWord = ''
        this.timesTabPressed = 0;
        this.autocompletedWords = [];

        this.client.eventHandler.on('message', (msg: protocol.MessageArgs) => this.printMessage(msg, this.client));
        this.client.eventHandler.on('error', (err: protocol.MessageArgs) => this.printAlert(err.message));
        this.client.eventHandler.on('serverMessage', (serverMessage: protocol.MessageArgs) => this.printServerMessage(serverMessage));
        this.client.eventHandler.on('forceDisconnect', (forceDisconnect: protocol.MessageArgs) => this.printAlert(forceDisconnect.message));
        // this.client.eventHandler.on('autocomplete', (lang: string) => this.onChangeAutocompleteLanguage(lang));
        this.client.eventHandler.on('helpCommand', () => this.printHelp());
        this.client.eventHandler.on('addCommand', (command: ClientCommand) => this.onAddCommand(command));
        this.client.eventHandler.on('updateDirectory', () => refreshFriendlist(this.client));
        this.client.eventHandler.on('updateChannels', () => refreshChannelList(this.client));
    }

    /**
     * Process the input in the command line.
     * @param {*} input User input from the readline prompt.
     */
    processInput(input: string): void {
        if (input[0] != '/') {
            input = messageToSend + input;
        }
        input = input.replace(/\t/g, ' ');
        const splitInput = input.split(' ');
        const cmd = splitInput[0];
        const arrayOfArgs = splitInput.slice(1);
        this.cmdManager.execute(this, cmd, arrayOfArgs);
    }

    /**
     * 
     * @param input 
     */
    autocompleteInput(input: string): string {
        input = input.replace(/\t/g, ' ');

        if (input != this.lastAutocompletedWord) this.timesTabPressed = 0; // reset time tab was pressed if different input to autocomplete.

        let toAutocompleteWord = '';
        if (this.timesTabPressed == 0) {
            const words = input.split(' ');
            toAutocompleteWord = words[words.length - 1];
        } else {
            // toAutocompleteWord = input; 
            // const words = input.split(' ');
            // toAutocompleteWord = words[words.length - 1];
        }

        // if(toAutocompleteWord != this.lastAutocompletedWord) this.timesTabPressed = 0; // reset time tab was pressed if different input to autocomplete.

        let autocompletedWord = '';
        // make new autocompleted suggestions
        if (this.timesTabPressed == 0) {
            this.autocompletedWords = this.autoComplete.autoComplete(toAutocompleteWord); // autocomplete word
            this.timesTabPressed += 1; // set tabcount
            if (toAutocompleteWord.startsWith('/')) { // if it's a command -> add arguments.
                autocompletedWord = '/' + this.autocompletedWords[0]
                    + ' {' + this.cmdManager.getCommands().get(this.autocompletedWords[0])!.argumentsPattern.join('} {') + '}';
            }
            else {
                autocompletedWord = input.split(' ').slice(0, -1).join(' ') + ' ' + this.autocompletedWords[0];
            }
            // go to next suggestion from the autocompleter
        } else {
            // end of suggestions reached -> take last autocompleted word in list.
            if (this.timesTabPressed >= this.autocompletedWords.length) {
                if (input.startsWith('/')) {
                    autocompletedWord = '/' + this.autocompletedWords[this.autocompletedWords.length - 1]
                        + ' {' + this.cmdManager.getCommands().get(this.autocompletedWords[this.autocompletedWords.length - 1])!.argumentsPattern.join('} {') + '}';
                } else {
                    autocompletedWord = this.autocompletedWords[this.autocompletedWords.length - 1]
                }
                // scroll through next suggestion.
            } else {
                if (input.startsWith('/')) {
                    autocompletedWord = '/' + this.autocompletedWords[this.timesTabPressed]
                        + ' {' + this.cmdManager.getCommands().get(this.autocompletedWords[this.timesTabPressed])!.argumentsPattern.join('} {') + '}';
                    this.timesTabPressed += 1; // increase tabcount
                } else {
                    autocompletedWord = input.split(' ').slice(0, -1).join(' ') + ' ' + this.autocompletedWords[this.timesTabPressed];
                }
            }
        }
        this.lastAutocompletedWord = autocompletedWord;
        return autocompletedWord;
    }

    showMessage(msg: string) {
        // TODO do not print public keys
        if (msg.length < 200) {
            const p = document.createElement('p');
            p.className = 'message'
            p.appendChild(document.createTextNode(msg));
            this.messagesDiv.appendChild(p);
        }

    }

    printMessage(msg: protocol.MessageArgs, client: Client) {
        if (msg.message.length < 200) {
            const p = document.createElement('p');
            // TODO dont pick random color, but color per client
            const color = this.client.colorDirectory.get(<string>msg.from);
            if (color !== undefined) {
                p.style.color = <string>this.client.colorDirectory.get(<string>msg.from);
            }
            p.className = 'message'
            p.appendChild(document.createTextNode(`${msg.message}`));

            if (msg.to == 'all') {
                // shout-to-all
                document.getElementById('chatBox')!.appendChild(p);
                const chatHistory = document.getElementById('chatBox');
                chatHistory!.scrollTop = chatHistory!.scrollHeight;
            }
            else if (msg.to!.charAt(0) == '#') {
                // send-on-channel
                document.getElementById(`messagesDiv${msg.to}`)!.appendChild(p);
                const chatHistory = document.getElementById(`messagesDiv${msg.to}`);
                chatHistory!.scrollTop = chatHistory!.scrollHeight;
            }
            else if (msg.to == client.nick) {
                // send-direct-message (you are the receiver)
                document.getElementById(`messagesDiv${msg.from}`)!.appendChild(p);
                const chatHistory = document.getElementById(`messagesDiv${msg.from}`);
                chatHistory!.scrollTop = chatHistory!.scrollHeight;
            }
            else if (msg.to !== client.nick) {
                // send-direct-message (you were the sender)
                document.getElementById(`messagesDiv${msg.to}`)!.appendChild(p);
                const chatHistory = document.getElementById(`messagesDiv${msg.to}`);
                chatHistory!.scrollTop = chatHistory!.scrollHeight;
            }
        }
    }

    printAlert(msg: string) {
        const p = document.createElement('p');
        // p.appendChild(document.createTextNode(`[Error] ${msg}`));
        p.className = 'message'
        p.style.color = 'red';
        this.messagesDiv.appendChild(p);
    }

    printServerMessage(data: protocol.MessageArgs) {
        const p = document.createElement('p');
        p.appendChild(document.createTextNode(`[Server] ${data.message}`));
        p.className = 'message'
        p.style.color = 'lightblue';
        if ((data.to == 'MAIN CHANNEL') || (data.to == undefined)) {
            this.messagesDiv.appendChild(p);
        }
        else {
            document.getElementById(`messagesDiv${data.to}`)!.appendChild(p);
        }
    }

    printHelp() {
        const commandsAndArguments = this.cmdManager.getCommandsAndArguments();
        this.client.helpCommands = commandsAndArguments;
    }

    onAddCommand(command: ClientCommand) {
        this.cmdManager.addCommand(command)
    }

    /**
    * Clear the current line and prints command entered by the user.
    * @param {*} string The message to be printed
    */
    printCommandEntered(string: string): void {
        console.log(string);
    }

    /**
    *  We imported all the classes that are exported in commands/allcommands 
    *  and collected them in the commands namespace.
    *  Commands has the following structure: [['shout-to-all',   {default: [class ShoutToAll]}],
    * 										  ['commandChannel', {default: [Object]}]          , ...] 
    *  This function instantiates each of these classes and also all the classes within nested classes
    *  and passes a new Command object to the addCommand method of the CmdManager.
    */
    instanciateAllCommands(): void {
        for (const [, value] of Object.entries(commands)) {
            const newCmd = new (value.default as any)(this.client);
            this.onAddCommand(newCmd);
        }
    }
}

/**
 * Module exports.
 */
export default browserInterface;