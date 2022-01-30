import { usage } from 'yargs';
import ChatClient from './client';
import ChatServer from './server';
import * as fs from 'fs';
import { BotOption, BotExample } from './protocol';
import CLI from './interface/cli';
const config: { [key: string]: { active: boolean, options: BotOption[], examples: BotExample[], checks: Function[] } } = JSON.parse(fs.readFileSync('./bin/botconfig.json').toString());

// command line parsing:
const yargs = usage('Usage: $0 --server --client')
    .help('h')
    .alias('h', 'help')
    .example('$0 --server [--host=hostname]', 'start a chat server')
    .example('$0 --client --nick=me', 'start a chat client')
    .example('$0 --server [--host=hostname] --client --nick=me', 'start both a chaquickt server and a client')
    .epilog('(C) P&O CW 2020-2021')
    .option('key', {
        description: 'gives the option to use own keypair',
        type: 'boolean',
        default: false
    })
    .option('server', {
        description: 'start the server',
        type: 'boolean',
        default: false
    })
    .option('host', {
        description: 'host name or IP address of the server',
        type: 'string',
        default: 'localhost'
    })
    .option('client', {
        description: 'start the client',
        type: 'boolean',
        default: false
    })
    .option('cli', {
        description: 'start with CLI plugin',
        type: 'boolean',
        default: true
    }
    )
    .option('nick', {
        description: 'nick name',
        type: 'string'
    })
    .option('port', {
        description: 'TCP port number (use > 1023)',
        type: 'number',
        default: 3000
    })
    .option('p2p', {
        description: 'p2p server',
        type: 'boolean',
        default: false
    })
    .option('next', {
        description: 'url of the next server in ring to connect with (default itself)',
        type: 'string',
        alias: ['url', 'nexturl'],
        default: null
    })
    .check((argv,) => {
        if (argv.client ? !argv.nick : argv.nick) {
            throw new Error('--client and --nick need to be specified at the same time');
        } else {
            return true;
        }
    });

const argv = yargs.argv;
const port = argv.port;
const hostname = argv.host;
const url = `wss://${hostname}:${port}/`;

// //////////// SERVER //////////////
if (argv.server) {
    new ChatServer(port);
}

// //////////// CLIENT //////////////
let chatClient: ChatClient | null = null;
if (argv.client) {
    chatClient = new ChatClient(url, 'world2', argv.nick!, argv.key, undefined, undefined, true);
    if (argv.cli && chatClient != null) {
        argv.client ? new CLI(chatClient) : null;
    }
}

const plugins = [];

/**
 * Loads in all active chatbots from the botconfig.json configuration file. Adds their yargs options, examples and checks to the command line.
 */
for (const [botname, botconfig] of Object.entries(config)) {
    if (botconfig.active) {
        const options = botconfig.options;
        const examples = botconfig.examples;
        const checks = botconfig.checks;

        options.forEach((option: { key: any, options: any }) => yargs.option(option.key, option.options));
        examples.forEach((example) => yargs.example(example.command, example.description));
        checks.forEach((check: any) => yargs.check(check));

        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const plugin = require('./plugins/bots/' + botname + '/' + botname);
        plugins.push(plugin);
    }
}