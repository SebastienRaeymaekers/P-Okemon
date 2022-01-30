/**
 * Module dependencies.
 */
import * as readline from 'readline';
import * as chalk from 'chalk';
import CmdManager from '../commands/cmdManager';
import AutoComplete from './autoComplete';
import * as commands from '../commands/clientCommands/allCommands';
import ChatClient from '../client';
import ClientCommand from '../commands/clientCommands/clientCommand';
import * as protocol from '../protocol';

/**
 * CLI class.
 */
class CLI {
	chatClient: ChatClient;
	cmdManager: CmdManager;
	autoComplete: AutoComplete;
	defaultCmd: string;
	cmdList: string[];
	rl: readline.Interface;
	timesTabPressed: number;
	autocompletedWords: string[];

	/**
	* Constructor for the command line interface.
	* @param {*} client The client that uses this CLI
	*/
	constructor(client: ChatClient) {
		this.chatClient = client;
		this.defaultCmd = 'shout-to-all';
		this.cmdManager = new CmdManager(this);
		this.timesTabPressed = 0;
		this.autocompletedWords = [];

		this.chatClient.eventHandler.on('message', (msg: protocol.MessageArgs) => this.printMessage(msg.message));
		this.chatClient.eventHandler.on('error', (err: protocol.MessageArgs) => this.printAlert(err.message));
		this.chatClient.eventHandler.on('serverMessage', (serverMessage: protocol.MessageArgs) => this.printServerMessage(serverMessage.message));
		this.chatClient.eventHandler.on('forceDisconnect', (forceDisconnect: string) => this.printAlert(forceDisconnect));
		this.chatClient.eventHandler.on('autocomplete', (lang: string) => this.onChangeAutocompleteLanguage(lang));
		this.chatClient.eventHandler.on('helpCommand', () => this.onHelpCommand());
		this.chatClient.eventHandler.on('addCommand', (command: ClientCommand) => this.onAddCommand(command));
		// process.stdin.on('keypress', (key: readline.Key, data: readline.Key) => this.onKeyPress(key, data));

		this.instanciateAllCommands();
		this.cmdList = this.cmdManager.getCommandsAsList();
		this.autoComplete = new AutoComplete(/* this,*/ this.cmdList);

		this.rl = readline.createInterface(
			{
				input: process.stdin,
				output: process.stdout,
				prompt: '[' + this.chatClient.nick + '] ',
				tabSize: 1
			});

		this.declareEvents();
		this.rl.prompt(true);
	}

	onAddCommand(command: ClientCommand) {
		this.cmdManager.addCommand(command)
	}

	/**
	 * 
	 */
	onHelpCommand(): void {
		const commandsAndArgumens = this.cmdManager.getCommandsAndArguments();
		this.chatClient.helpCommands = commandsAndArgumens
	}

	/**
	 * 
	 * @param lang 
	 */
	onChangeAutocompleteLanguage(lang: string): void {
		this.autoComplete.changeAutocompleteLanguage(lang);
	}

	/**
	* Declare all the events the CLI reacts upon.
	*/
	declareEvents(): void {
		// event on keypres 'Tab':		autocomplete
		process.stdin.on('keypress', (key: readline.Key, data: readline.Key) => this.onTab(key, data));
		// event on keypress 'Enter': 	execute input
		this.rl.on('line', (input) => {
			this.autoComplete.updateWordsScore(input);
			this.clearRows(this.calculateRows());
			this.processInput(input);
			this.rl.prompt(true);
			this.timesTabPressed = 0;
		});
		// event on keypress 'Ctrl+C': 	close the CLI
		this.rl.on('close', () => {
			readline.moveCursor(process.stdout, 0, 1);
			this.printAlert('WARNING: The CLI is closed!');
			this.rl.close();
		});
		this.rl.on('keypress', (key: readline.Key) => {
			// event on keypres 'Ctr+L': 	clear the terminal
			if (key.ctrl && key.name === 'l') {
				this.rl.write('\u001B[2J\u001B[0;0f');
			}
		});
	}

	onTab(key: readline.Key, data: readline.Key): void {
		// Check if current keypress is a tab
		if (data.name === 'tab') {
			this.setInput(this.rl.line.replace('\t', '')); // remove tab from the input

			const words = this.rl.line.split(' ');
			const lastWord = words[words.length - 1];

			let autocompletedWord = '';
			if (this.timesTabPressed != 0 && this.timesTabPressed < this.autocompletedWords.length) { // go to next suggestion from the autocompleter
				autocompletedWord = '/' + this.autocompletedWords[this.timesTabPressed];
				this.setInput(autocompletedWord + ' {' + this.cmdManager.getCommands().get(autocompletedWord.slice(1))!.argumentsPattern.join('} {') + '}');
			}
			else { // make new autocompleted suggestions
				if (lastWord.startsWith('/')) {
					this.autocompletedWords = this.autoComplete.autoComplete(lastWord);
					// autocompletedWord = this.autoComplete.autoComplete(lastWord)[0][0];
					autocompletedWord = '/' + this.autocompletedWords[0];
					this.setInput(autocompletedWord + ' {' + this.cmdManager.getCommands().get(autocompletedWord.slice(1))!.argumentsPattern.join('} {') + '}');
				}
			}
			this.timesTabPressed += 1;
		}
		else this.timesTabPressed = 0;
	}

	/**
	 * sets the input to a given string
	 * 
	 * @param {string} newInput new input.   
	 */
	setInput(input: string): void {
		this.clearInput();
		this.rl.prompt(true);
		this.rl.write(input);
	}

	/**
	 * Clears the whole input line
	 */
	clearInput() {
		readline.cursorTo(process.stdout, 0);
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore -> necessary measure
		this.rl.clearLine(process.stdout, 0);
		this.clearRows(this.calculateRows());
	}

	/**
	 * Process the input in the command line.
	 * @param {*} input User input from the readline prompt.
	 */
	processInput(input: string): void {
		input = input.replace(/\t/g, ' ');

		let cmd;
		let arrayOfArgs;

		if (input[0] !== '/') {	// default command
			cmd = '/' + this.defaultCmd;
			arrayOfArgs = input.split(' ');
		} else { 				// non-default command
			const splitInput = input.split(' ');
			cmd = splitInput[0];
			arrayOfArgs = splitInput.slice(1);
		}

		this.cmdManager.execute(this, cmd, arrayOfArgs);
	}

	/**
	* Clear the current line and prints messages comming from the server.
	* @param {*} string The message to be printed
	*/
	printMessage(string: string): void {
		this.printOnCLI(string);
	}

	/**
	* Clear the current line and prints command entered by the user.
	* @param {*} string The message to be printed
	*/
	printCommandEntered(string: string): void {
		this.printOnCLI(chalk.yellow(string));
	}

	/**
	* Clear the current line and prints messages comming from the server.
	* @param {*} string The message to be printed
	*/
	printAlert(string: string): void {
		this.printOnCLI(chalk.red(string));
	}

	/**
	* Clear the current line and prints messages comming from the server.
	* @param {*} string The message to be printed
	*/
	printServerMessage(string: string): void {
		this.printOnCLI(chalk.blue(string));
	}

	/**
	 * Appropriate way to log messages in the CLI: Clear the current prompt
	 * with the users input, print message and restart the prompt.
	 * @param msg 
	 */
	printOnCLI(msg: string): void {
		// delete all rows except for the one with the message
		this.clearRows(this.calculateRows() - 1);
		// print the message and new prompt
		console.log(msg);
		this.rl.prompt(true);
	}

	/**
	 * Calculates the amount of rows the current line takes in based on the
	 * width of the terminal window.
	 */
	calculateRows(): number {
		const lineWidth = this.rl.prompt.length + this.rl.line.length;
		const terminalWidth = process.stdout.columns;
		const rows = Math.ceil(lineWidth / terminalWidth)
		return rows;
	}

	/**
	 * Clear the given amount of rows above the current input line.
	 * @param amount 
	 */
	clearRows(amount: number): void {
		// clear the current line
		readline.cursorTo(process.stdout, 0);
		readline.clearLine(process.stdout, 0);
		// clear the lines above
		readline.moveCursor(process.stdout, 0, -amount);
		readline.clearLine(process.stdout, 0);
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
			new (value.default as any)(this.chatClient);
		}
	}

}

/**
 * Module exports.
 */
export default CLI;