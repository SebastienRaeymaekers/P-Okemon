import ChatServer from './../server.js';
import ChatClient from './../client.js';
import Bag from './bag.js';
import * as crypto from 'crypto';
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
    msgs.forEach((msg) => console.log(JSON.stringify(msg)));
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

function sleep(milliseconds: number) { // Source: https://stackoverflow.com/questions/16873323/javascript-sleep-wait-before-continuing/16873849
    const start = new Date().getTime();
    for (let i = 0; i < 1e7; i++) {
        if ((new Date().getTime() - start) > milliseconds) {
            break;
        }
    }
}

// CLIENTS SENDING DIRECT MESSAGES
async function sendDirectMsgsTest() {
    // check if correct clients can connect via https and be present in the datastructure 
    const client1_1 = new ChatClient('https://localhost:3000', 'client1_1'); // TODO: make sure different users have different public/private key pairs.
    const client1_2 = new ChatClient('https://localhost:3000', 'client1_2');
    const client2_1 = new ChatClient('https://localhost:3000', 'client2_1');
    const client3_1 = new ChatClient('https://localhost:3000', 'client3_1');

    client1_1.onMessage = (msg) => msgReceived(1, msg);
    client1_2.onMessage = (msg) => msgReceived(1, msg);
    client2_1.onMessage = (msg) => msgReceived(2, msg);

    client1_1.send({
        command: 'message',
        id: client1_1.getCommandId(),
        msg: {
            message: 'this is a direct msg',
            from: client1_1.fingerPrint,
            to: client2_1.fingerPrint
        }
    });

    client3_1.send({
        command: 'message',
        id: client1_1.getCommandId(),
        msg: {
            message: 'this is a direct msg',
            from: client3_1.fingerPrint,
            to: client1_1.fingerPrint
        }
    });

    await expectedMessage(1000, [
        {
            client: 2, msg: {
                command: 'message',
                msg: {
                    message: 'this is a direct msg',
                    from: client1_1.fingerPrint,
                    to: client2_1.fingerPrint
                }
            }
        },
        {
            client: 1, msg: {
                command: 'message',
                msg: {
                    message: 'this is a direct msg',
                    from: client3_1.fingerPrint,
                    to: client1_1.fingerPrint
                }
            }
        }
    ]);

    client1_1.socket.close();
    client1_2.socket.close();
    client2_1.socket.close();
    client3_1.socket.close();
    server.server.close();
}

// CLIENTS SENDING MESSAGES WITHOUT FROM
async function sendMsgsWithoutFromTest() {
    // check if correct clients can connect via https and be present in the datastructure 
    const client1_1 = new ChatClient('https://localhost:3000', 'client1_1'); // TODO: make sure different users have different public/private key pairs.
    const client1_2 = new ChatClient('https://localhost:3000', 'client1_2');
    const client2_1 = new ChatClient('https://localhost:3000', 'client2_1');
    const client3_1 = new ChatClient('https://localhost:3000', 'client3_1');

    client2_1.onMessage = (msg) => msgReceived(2, msg);

    const buffer = Buffer.from('encryptedMessage: ' + 'this is a msg without from', 'utf8');
    const encryptedText = crypto.privateEncrypt(client1_1.private_key, buffer);

    client1_1.send({
        command: 'message',
        id: client1_1.getCommandId(),
        msg: {
            message: encryptedText.toString('base64'),
            to: client2_1.fingerPrint
        }
    });

    await expectedMessage(1000, [
        {
            client: 2, msg: {
                command: 'message',
                msg: {
                    message: 'encryptedMessage: ' + 'this is a msg without from',
                    to: client2_1.fingerPrint
                }
            }
        },
    ]);

    client1_1.socket.close();
    client1_2.socket.close();
    client2_1.socket.close();
    client3_1.socket.close();
    server.server.close();
}

// // CLIENTS SENDING MESSAGES WITHOUT TO
// async function sendMsgsWithoutToTest() {
//     // check if correct clients can connect via https and be present in the datastructure 
//     const client1_1 = new ChatClient('https://localhost:3000', 'client1_1'); // TODO: make sure different users have different public/private key pairs.
//     const client1_2 = new ChatClient('https://localhost:3000', 'client1_2');
//     const client2_1 = new ChatClient('https://localhost:3000', 'client2_1');
//     const client3_1 = new ChatClient('https://localhost:3000', 'client3_1');

//     client2_1.onMessage = (msg) => msgReceived(2, msg);

//     let publicKey: string | undefined = '';
//     if (client1_1.publicKeys.has(client2_1.fingerPrint)) { publicKey = client1_1.publicKeys.get(client2_1.fingerPrint); }

//     const buffer = Buffer.from('message4U: ' + 'this is a msg without from', 'utf8');
//     const encryptedText = crypto.publicEncrypt(publicKey!, buffer).toString('base64');

//     client1_1.send({
//         command: 'message',
//         id: client1_1.getCommandId(),
//         msg: {
//             message: encryptedText,
//             from: client1_1.fingerPrint,
//         }
//     });

//     await expectedMessage(1000, [
//         {
//             client: 2, msg: {
//                 command: 'message',
//                 msg: {
//                     message: 'message4U: ' + 'this is a msg without from',
//                     to: client2_1.fingerPrint
//                 }
//             }
//         },
//     ]);

//     client1_1.socket.close();
//     client1_2.socket.close();
//     client2_1.socket.close();
//     client3_1.socket.close();
//     server.server.close();
// }

const server = new ChatServer(3000);
console.log('==========MSGS TEST==========')
sendDirectMsgsTest();
console.log('Test passed!');
sleep(4000);
sendMsgsWithoutFromTest();
console.log('Test passed!');
// sleep(4000);
// sendMsgsWithoutToTest();
// console.log('Test passed!');