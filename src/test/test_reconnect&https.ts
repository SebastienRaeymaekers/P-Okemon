import ChatServer from '../server';
import ChatClient from '../client';
import Bag from './bag';

function assert(cond: boolean, ...args: unknown[]): void {
    if (!cond) {
        console.error(...args);
        process.exit(1);
    }
}

function msg_received_default() {
    assert(false, 'No messages expected at this point!');
}

let msg_received: (clientId: number, msg: unknown) => void = msg_received_default;

function expect_messages(timeout: number, msgs: unknown[]) {
    const msgsBag = new Bag(msgs.map(msg => JSON.stringify(msg)));
    let timeoutId: NodeJS.Timeout | null = null;
    function createTimeout() {
        timeoutId = setTimeout((() => assert(false, 'expect_messages: timeout while waiting for messages [' + [...msgsBag].join(', ') + ']')), timeout);
    }
    createTimeout();
    return new Promise<void>(resolve => {
        msg_received = (client, msgBody) => {
            const msg = { client, msg: msgBody };
            const msgText = JSON.stringify(msg);
            if (timeoutId === null)
                throw new Error();
            clearTimeout(timeoutId);
            assert(msgsBag.has(msgText), 'Received unexpected message ', msg);

            msgsBag.delete(msgText);
            if (msgsBag.size == 0) {
                msg_received = msg_received_default;
                resolve();
            } else {
                createTimeout();
            }
        };
    });
}

(async () => {

    function checkReasons(reason: unknown) {
        assert(reason == 'nickname already in use.')
        console.log('connect on same nick test: succesfull')
    }

    console.log('==========RECONNECT & HTTPS TEST==========')

    // clients kunnen connecteren via https
    const server = new ChatServer(3000);
    const client1 = new ChatClient('https://localhost:3000', 'nick1');
    client1.send({ // shout to all
        command: 'message',
        id: client1.getCommandId(),
        msg: {
            message: 'Hello world!',
            from: client1.nick // TODO hash?
        }
    });
    client1.send({ // shout to me
        command: 'message',
        id: client1.getCommandId(),
        msg: {
            message: 'Hello other client!',
            from: client1.nick, // TODO hash?
            to: client1.nick // TODO hash?
        }
    });
    client1.onMessage = msg => msg_received(1, msg);
    const client2 = new ChatClient('https://localhost:3000', 'nick2');
    client2.send({ // shout to all
        command: 'message',
        id: client2.getCommandId(),
        msg: {
            message: 'Hello world!',
            from: client2.nick // TODO hash?
        }
    });
    client2.send({ // shout to me
        command: 'message',
        id: client2.getCommandId(),
        msg: {
            message: 'Hello other client!',
            from: client2.nick, // TODO hash?
            to: client2.nick // TODO hash?
        }
    });
    client2.onMessage = msg => msg_received(2, msg);

    // clients met dezelfde nick maar een verschillende key kunnen dit niet (terwijl de originele client er nog is)
    const client3 = new ChatClient('https://localhost:3000', 'nick2');
    client3.send({ // shout to all
        command: 'message',
        id: client3.getCommandId(),
        msg: {
            message: 'Hello world!',
            from: client3.nick // TODO hash?
        }
    });
    client3.send({ // shout to me
        command: 'message',
        id: client3.getCommandId(),
        msg: {
            message: 'Hello other client!',
            from: client3.nick, // TODO hash?
            to: client3.nick // TODO hash?
        }
    });
    client3.onforceDisconnect = reason => checkReasons(reason);

    // een client kan een standaard key meegeven om te connecten
    const client4 = new ChatClient('https://localhost:3000', 'world1', 'nick3', true);
    client4.send({ // shout to all
        command: 'message',
        id: client4.getCommandId(),
        msg: {
            message: 'Hello world!',
            from: client4.nick // TODO hash?
        }
    });
    client4.send({ // shout to me
        command: 'message',
        id: client4.getCommandId(),
        msg: {
            message: 'Hello other client!',
            from: client4.nick, // TODO hash?
            to: client4.nick // TODO hash?
        }
    });
    setTimeout(() => client4.socket.close(), 2000)

    // een client kan een niet reconnecten binnen 5 minuten met dezelfde nick en verschillende key
    const client5 = new ChatClient('https://localhost:3000', 'world1', 'nick3');
    client5.send({ // shout to all
        command: 'message',
        id: client5.getCommandId(),
        msg: {
            message: 'Hello world!',
            from: client5.nick // TODO hash?
        }
    });
    client5.send({ // shout to me
        command: 'message',
        id: client5.getCommandId(),
        msg: {
            message: 'Hello other client!',
            from: client5.nick, // TODO hash?
            to: client5.nick // TODO hash?
        }
    });
    client5.onforceDisconnect = reason => checkReasons(reason);

    // maar wel als die dezelfde key heeft.
    const client6 = new ChatClient('https://localhost:3000', 'world1', 'nick3', true);
    client6.send({ // shout to all
        command: 'message',
        id: client6.getCommandId(),
        msg: {
            message: 'Hello world!',
            from: client6.nick // TODO hash?
        }
    });
    client6.send({ // shout to me
        command: 'message',
        id: client6.getCommandId(),
        msg: {
            message: 'Hello other client!',
            from: client6.nick, // TODO hash?
            to: client6.nick // TODO hash?
        }
    });

    // twee clients kunnen vanuit verschillende plekken connecteren (zolang de nick en private key juist zijn)
    const client7 = new ChatClient('https://localhost:3000', 'world1', 'nick3', true);
    client7.send({ // shout to all
        command: 'message',
        id: client7.getCommandId(),
        msg: {
            message: 'Hello world!',
            from: client7.nick // TODO hash?
        }
    });
    client7.send({ // shout to me
        command: 'message',
        id: client7.getCommandId(),
        msg: {
            message: 'Hello other client!',
            from: client7.nick, // TODO hash?
            to: client7.nick // TODO hash?
        }
    });

    console.log('different connection scenarios test: succesfull')

    await expect_messages(1000, [
        { client: 1, msg: { nick: 'nick1', text: 'Hello world!' } },
        { client: 2, msg: { nick: 'nick1', text: 'Hello world!' } },
        { client: 1, msg: { nick: 'nick2', text: 'Hello world!' } },
        { client: 2, msg: { nick: 'nick2', text: 'Hello world!' } },
        { client: 2, msg: { nick: 'nick3', text: 'Hello world!' } },
        { client: 1, msg: { nick: 'nick3', text: 'Hello world!' } },
        { client: 2, msg: { nick: 'nick3', text: 'Hello world!' } },
        { client: 1, msg: { nick: 'nick3', text: 'Hello world!' } },
        { client: 2, msg: { nick: 'nick3', text: 'Hello world!' } },
        { client: 1, msg: { nick: 'nick3', text: 'Hello world!' } },

        // RECONNECT TEST - verschillende clients
        { client: 1, msg: { nick: 'nick1', text: 'Hello other client!' } },
        { client: 2, msg: { nick: 'nick2', text: 'Hello other client!' } }

    ]);

    console.log('hello world messages test: succesfull')

    client1.send({ // shout to all
        command: 'message',
        id: client1.getCommandId(),
        msg: {
            message: 'This is a test message',
            from: client1.nick // TODO hash?
        }
    });
    await expect_messages(1000, [
        { client: 1, msg: { nick: 'nick1', text: 'This is a test message' } },
        { client: 2, msg: { nick: 'nick1', text: 'This is a test message' } }
    ]);

    client2.send({ // shout to all
        command: 'message',
        id: client2.getCommandId(),
        msg: {
            message: 'This is another test message',
            from: client2.nick // TODO hash?
        }
    });
    await expect_messages(1000, [
        { client: 1, msg: { nick: 'nick2', text: 'This is another test message' } },
        { client: 2, msg: { nick: 'nick2', text: 'This is another test message' } }
    ]);

    console.log('send messages test: succesfull')

    console.log('Test passed!');
    console.log('==========END RECONNECT & HTTPS TEST==========')
    client1.socket.close();
    client2.socket.close();
    server.server.close();
    process.exit(0);
})();

/**
 * Module exports.
 */
export default assert;