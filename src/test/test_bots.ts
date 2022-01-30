import ChatServer from './../server';
import ChatClient from './../client';
import Bag from './bag';
import * as protocol from './../protocol'

function assert(cond: boolean, ...args: unknown[]) {
    if (!cond) {
        console.error(...args);
        process.exit(1);
    }
}

function msgReceivedDefault() {
    assert(false, 'No messages expected at this point!');
}

let msgReceived: (clientId: number, msg: unknown) => void = msgReceivedDefault;

function expectedMessage(timeout: number, msgs: { client: number, msg: protocol.MessageCommand }[]) {

    const msgsBag = new Bag(msgs.map((msg) => JSON.stringify(msg)));
    // msgs.forEach((msg) => console.log(JSON.stringify(msg)));
    let timeoutId: NodeJS.Timeout | null = null;
    function createTimeout() {
        timeoutId = setTimeout((() => assert(false, `expectedMessage: timeout while waiting for messages [${[...msgsBag].join(', ')}]`)), timeout);
    }
    createTimeout();
    return new Promise<void>((resolve) => {
        msgReceived = (client, msgBody) => {
            const msg = { client, msg: msgBody };
            const msgText = JSON.stringify(msg);
            if (timeoutId === null) { throw new Error(); }
            clearTimeout(timeoutId);
            assert(msgsBag.has(msgText), 'Received unexpected message ', msg);

            msgsBag.delete(msgText);
            if (msgsBag.size === 0) {
                msgReceived = msgReceivedDefault;
                resolve();
            } else {
                createTimeout();
            }
        };
    });
}

/**
 * Structure for the messages:
 * 
 * {
 *  message: text,
 * from: client hash,
 * to: channel or nick or something
 * }
 * 
 */

async function elizaPluginTest() {
    console.log(
        '====================ELIZA TEST===================='
    );

    // test setup
    new ChatServer(3000);
    const client1 = new ChatClient('https://localhost:3000/', 'client1');
    client1.onMessage = (msg) => {
        if (msg.command != 'message') throw new Error('Invalid data type.');
        msgReceived(1, msg);

        const mystr = msg.msg.message;

        const mystrArray = mystr.split(' ');

        if (mystrArray[0] == '-----BEGIN' && mystrArray[1] == 'RSA' && mystrArray[2] == 'PUBLIC') {
            client1.publicKeys.set(msg.msg.from!, mystr);
            return;
        }

        // decrypt channel encryption
        if (typeof msg.msg.from != 'undefined' && /^#/.test(msg.msg.from)) { // bericht van een channel TODO: fix dit
            let mystr = client1.decryptChannelMessage(msg.msg.message, msg.msg.from);
            const nickStr = mystr.split(':'); // Separate nickname and message
            const nick = nickStr[0];
            mystr = nickStr[1];
            mystr = client1.filterMessage(mystr, msg.msg.from);
            client1.botOnMessage(msg.msg.message, nick, msg.msg.from);
        }

        // normal message: with from and to Direct Message
        if (typeof msg.msg.from !== 'undefined' && typeof msg.msg.to !== 'undefined') {
            msg.msg.message = client1.filterMessage(msg.msg.message, undefined)
            client1.botOnMessage(msg.msg.message, client1.directory.get(msg.msg.from!), null)
            client1.eventHandler.emit('message', '[' + client1.directory.get(msg.msg.from!) + '] ' + msg.msg.message);
        }

    }
    // possiblity to add another client
    // const client2 = new ChatClient('https://localhost:3000/', 'client2');
    // client2.onMessage = (msg) => msgReceived(2, msg);

    client1.loadBotPlugin(client1.server_url, { botType: 'elizabot', botNick: 'eliza', botOwner: client1.nick, channelName: null }, client1);
    const eliza = client1.activeBots.get('eliza')

    if (eliza == undefined)
        return;

    /**
     * 
     * This is the form to use for the tests
     * 
     * await expectedMessage(1000, [
     *      { client: 1, msg: { message: "", from: "", to: ""} },
     * ]);
     */
    await expectedMessage(1000, [

        {
            client: 1, msg: {
                command: 'message',
                msg: {
                    message: client1.public_key,
                    from: client1.getPublicKeyHash(),
                    to: client1.getPublicKeyHash()
                }
            }
        },
    ]);

    console.log('checking if the bot responds to maybe...');

    // sending a message to see if the bot responds
    client1.send({
        command: 'message',
        id: client1.getCommandId(),
        msg: {
            message: 'maybe',
            from: client1.getPublicKeyHash(),
            to: 'all'
        }
    });

    await expectedMessage(1000, [

        {
            client: 1, msg: {
                command: 'message',
                msg: {
                    message: client1.public_key,
                    from: client1.getPublicKeyHash(),
                    to: client1.getPublicKeyHash()
                }
            }
        },
        {
            client: 1, msg: {
                command: 'message',
                msg: {
                    message: 'maybe',
                    from: client1.getPublicKeyHash(),
                    to: 'all'
                }
            }
        },
        {
            client: 1, msg: {
                command: 'message',
                msg: {
                    message: eliza.chatclient.public_key,
                    from: eliza?.chatclient.getPublicKeyHash(),
                    to: client1.getPublicKeyHash()
                }
            }
        },
        {
            client: 1, msg: {
                command: 'message',
                msg: {
                    message: "You  don't seem very certain.",
                    from: eliza?.chatclient.getPublicKeyHash(),
                    to: 'all'
                }
            }
        },
    ]);

    client1.socket.close();
    client1.activeBots.get('eliza')?.killBotclient();
}

(async () => {
    await elizaPluginTest();

    console.log('Bot Plugin Tests passed!');

    process.exit(0);
})();