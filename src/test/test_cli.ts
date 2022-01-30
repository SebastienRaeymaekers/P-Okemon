import { strict as assert } from 'assert';
import CLI from '../interface/cli.js';
import ChatClient from './../client.js';
import ClientCommand from '../commands/clientCommands/clientCommand';

// initiate the scores.
let score = 0;
let totalScore = 0;

// initiate a new testing environment.
const address = 'https://localhost:3000';
const nick = 'testClient';
const testClient = new ChatClient(address, 'world1', nick, true);
const cli = new CLI(testClient);

class exampleCommand extends ClientCommand {

	constructor(client: ChatClient) {
		super('example-command', ['nick', 'text'], client);
		this.client.eventHandler.emit('addCommand', this)
	}

	execute() {
		// this.client.send({
		// 	command: "example-command",
		// 	id: 0, //TODO id
		// 	args: args.join(" ")
		// });
	}
}

function clientTest() {
	totalScore += 10;
	assert.equal(testClient.nick, nick);
	assert.equal(testClient.server_url, address);
	score += 10;
}

function cmdManagerAddCommandsTest() {
	totalScore += 20;

	const cmdList: string[] = cli.cmdManager.getCommandsAsList();
	for (const [, value] of Object.entries(cli.cmdManager.getCommands())) {
		assert(cmdList.includes((value as any).name));
	}

	score += 10;

	const originalList: string[] = cli.cmdManager.getCommandsAsList();
	const newCmd = new exampleCommand(testClient);
	assert(!originalList.includes(newCmd.name));

	cli.cmdManager.addCommand(newCmd);
	const testList: string[] = cli.cmdManager.getCommandsAsList();
	assert(testList.includes(newCmd.name));

	score += 10;

}

function autocompleteCommandsTest() {

	totalScore += 5;
	const completeCmd: string = cli.autoComplete.autoComplete('/shou')[0]!;
	assert.equal(completeCmd, 'shout-to-all');
	score += 5;

}

function autocompleteLanguagesTest() {

	totalScore += 5;
	const completeWord: string = cli.autoComplete.autoComplete('cont')[0]!;
	assert.equal(completeWord, 'contact');
	score += 5;

}

function fuzzymatchingTest() {

	totalScore += 10;
	let completeCmd: string = cli.autoComplete.autoComplete('/shoot')[0]!;
	assert.equal(completeCmd, 'show-url');
	score += 5;

	completeCmd = cli.autoComplete.autoComplete('/qelp')[0]!;
	assert.equal(completeCmd, 'help');
	score += 5;

}

function tabToNextAutocompleteSuggestion() {

	totalScore += 10;
	let completeCmd: string = cli.autoComplete.autoComplete('/shou')[0]!;
	assert.equal(completeCmd, 'shout-to-all');
	score += 5;

	// simulating tab pressed again by autocompleting same prefix but taking the next element 
	completeCmd = cli.autoComplete.autoComplete('/shou')[1]!;
	assert.equal(completeCmd, 'shout-to-me');

	score += 5;

}

function shoutToAllCommandTest() {

	totalScore += 15;

	// check if client received the initial shout-to-all message.

	score += 5;

	cli.cmdManager.execute(cli, 'shout-to-all', ['test']);
	// check if client received the shout-to-all message.

	score += 10;

}

function helpCommandTest() {

	totalScore += 10;

	cli.cmdManager.execute(cli, 'help', []);
	// check if help command is executed.

	score += 10;

}

function cli_autocompleteTest() {

	totalScore += 10;
	cli.cmdManager.execute(cli, 'cli-autocomplete', ['french']);
	assert.equal(cli.autoComplete.autoCompleteLanguage, 'french');
	score += 10;

}

// execute all the tests.
clientTest();
cmdManagerAddCommandsTest();
autocompleteCommandsTest();
autocompleteLanguagesTest();
fuzzymatchingTest();
tabToNextAutocompleteSuggestion();
shoutToAllCommandTest();
helpCommandTest();
cli_autocompleteTest();

// print the score and exit
console.log('==========CLI TEST==========')
console.log('SCORE: ' + score + '/' + totalScore);
console.log('==========END CLI TEST==========')
process.exit();