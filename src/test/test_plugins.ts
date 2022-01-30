import ChatServer from './../server';
import ChatClient from './../client';
import CLI from '../interface/cli.js';

function assert(cond: boolean, ...args: unknown[]) {
    if (!cond) {
        console.error(...args);
        process.exit(1);
    }
}

function sleep(milliseconds: number) { // Source: https://stackoverflow.com/questions/16873323/javascript-sleep-wait-before-continuing/16873849
    const start = new Date().getTime();
    for (let i = 0; i < 1e7; i++) {
        if ((new Date().getTime() - start) > milliseconds) {
            break;
        }
    }
}

// function msg_received_default() {
//     assert(false, 'No messages expected at this point!');
// }

// const msg_received: (clientId: number, msg: unknown) => void = msg_received_default;

(async () => {

    console.log('==========FILTERS TEST==========')
    const server = new ChatServer(3000);
    const user2 = new ChatClient('https://localhost:3000', 'nick_user2');
    const cli2 = new CLI(user2);

    sleep(3000);

    // CLIENTS ADDING FILTERS
    async function createFiltersTest() {
        return new Promise<void>(resolve => {
            setTimeout(() => {

                user2.send({
                    command: 'channel-create',
                    id: user2.getCommandId(),
                    channelName: '#channelExists',
                    properties: {
                        saveHistory: true,
                        messageOutside: false
                    }
                });

                cli2.processInput('/add-filter rotation 2 outgoing #channelExists');
                cli2.processInput('/add-filter redaction notapllicable incoming #thisChannelCantExist'); // because the name is too long

                cli2.processInput('/add-filter redaction thisdoesntmatter outgoing');
                cli2.processInput('/add-filter rotation 2 incoming');
                setTimeout(() => {
                    console.log('STARTING CREATE TESTS')
                    assert(user2.filtersIncoming.length == 2, 'User2 should have 2 incoming filters');
                    assert(user2.filters.length == 2, 'User2 should have 2 outgoing filters');
                    console.log('TEST CREATE SUCCEEDED')
                    resolve();
                }, 2000)
            }, 500);
        })
    }

    // FILTERS FILTERING MESSAGES
    async function useFilterTest() {
        return new Promise<void>(resolve => {
            setTimeout(() => {
                setTimeout(() => {
                    console.log('STARTING USE FILTER TESTS')
                    console.log(user2.filters[0]);
                    assert(user2.filters[0].filter('Hello World') == 'Jgnnq Yqtnf', "The text 'Hello World' should have been filtered to 'Jgnnq Yqtnf'");
                    assert(user2.filtersIncoming[0].filter('Goodbye World') == '[Redacted]', "The text 'Goodbye World' should have been filtered to '[Redacted]'");
                    console.log('USE FILTER TEST SUCCEEDED')
                    resolve();
                }, 2000)
            }, 500);
        })
    }

    // CLIENTS REMOVING FILTERS
    async function removeFilterTest() {
        return new Promise<void>(resolve => {
            setTimeout(() => {
                cli2.processInput('/remove-filter outgoing');
                cli2.processInput('/remove-filter outgoing');

                cli2.processInput('/remove-filter incoming');
                setTimeout(() => {
                    console.log('REMOVE FILTER TESTS')

                    assert(user2.filters.length == 0), 'User2 should not have any outgoing filters';
                    assert(user2.filtersIncoming.length == 1), 'User2 should have one incoming filter';
                    console.log('REMOVE FILTER TEST SUCCEEDED')
                    resolve();
                }, 2000)
            }, 500);
        })

    }

    await createFiltersTest();
    await useFilterTest();
    await removeFilterTest();
    sleep(10000)

    console.log('Test passed!');
    user2.socket.close();
    server.server.close();
    console.log('==========END FILTER TEST==========')
    process.exit(0);
})();