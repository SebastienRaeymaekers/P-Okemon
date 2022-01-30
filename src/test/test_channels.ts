import ChatServer from './../server';
import ChatClient from './../client';

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

function msg_received_default() {
    assert(false, 'No messages expected at this point!');
}

const msg_received: (clientId: number, msg: unknown) => void = msg_received_default;

(async () => {

    console.log('==========CHANNELS TEST==========')
    // clients kunnen connecteren via https
    const server = new ChatServer(3000);
    const user1 = new ChatClient('https://localhost:3000', 'nick_user1');
    user1.onMessage = msg => msg_received(1, msg);
    const user2 = new ChatClient('https://localhost:3000', 'nick_user2');
    user2.onMessage = msg => msg_received(2, msg);

    sleep(3000);

    // CLIENTS CREATING CHANNELS
    async function createChannelsTest() {
        return new Promise<void>(resolve => {
            setTimeout(() => {
                user2.send({
                    command: 'channel-create',
                    id: user2.getCommandId(),
                    channelName: '#gameTalk',
                    properties: {
                        saveHistory: true,
                        messageOutside: false
                    }
                });
                user1.send({
                    command: 'channel-create',
                    id: 0, // TODO id
                    channelName: '#gameTalk',
                    properties: {
                        saveHistory: true,
                        messageOutside: false
                    }
                });
                user1.send({
                    command: 'channel-create',
                    id: 0, // TODO id
                    channelName: '##TVShowsEspeciallySurvivorAndBigBrother',
                    properties: {
                        saveHistory: true,
                        messageOutside: false
                    }
                });
                setTimeout(() => {
                    console.log('STARTING CREATE TESTS')
                    assert(server.channels.size == 1, 'Server should only have 1 Channel');
                    assert(user2.channels.size == 1, 'User2 should only have 1 Channel');
                    assert(user1.channels.size == 0, 'User1 should not have a Channel');
                    console.log('TEST CREATE SUCCEEDED')
                    resolve();
                }, 2000)
            }, 500);
        })
    }

    // CLIENTS JOINING CHANNELS
    async function joinChannelsTest() {
        return new Promise<void>(resolve => {
            setTimeout(() => {
                user2.send({
                    command: 'channel-join',
                    id: 0, // TODO id
                    channelName: '#Sport'
                });
                user1.send({
                    command: 'channel-join',
                    id: 0, // TODO id
                    channelName: '#gameTalk'
                });
                user1.send({
                    command: 'channel-join',
                    id: 0, // TODO id
                    channelName: '#Sport'
                });
                setTimeout(() => {
                    console.log('STARTING JOIN TESTS')
                    assert(server.channels.size == 1, 'Channel gameTalk was not added to the Server');
                    assert(user2.channels.has('#gameTalk'), 'Channel gameTalk was not added to the client');
                    assert(user2.channels.size == 1, 'Channel gameTalk was added a second time to the server');
                    assert(user1.channels.has('#gameTalk'), 'Channel gameTalk was added to user1 even tho it should not exist');
                    assert(user1.channels.size == 1, 'Channel TVShowsEspeciallySurvivorAndBigBrother was added to the server even though its name is to long');
                    console.log('TEST JOIN SUCCEEDED')
                    resolve();
                }, 2000)
            }, 500);
        })
    }

    // CLIENTS LEAVING CHANNELS
    async function leaveChannelsTest() {
        return new Promise<void>(resolve => {
            setTimeout(() => {
                user1.send({
                    command: 'channel-leave',
                    id: 0, // TODO id
                    channelName: '#gameTalk'
                });
                user1.send({
                    command: 'channel-leave',
                    id: 0, // TODO id
                    channelName: '#gameTalk'
                });
                user1.send({
                    command: 'channel-leave',
                    id: 0, // TODO id
                    channelName: '#gameTalk'
                });// Already left this channel
                user2.send({
                    command: 'channel-leave',
                    id: 0, // TODO id
                    channelName: '#gameTalk'
                });
                setTimeout(() => {
                    console.log('STARTING LEAVE TESTS')
                    assert(user1.channels.size == 0, 'User1 should not be in any channel');
                    assert(user2.channels.size == 0), 'User2 should not be in any channel';
                    console.log('LEAVE TEST SUCCEEDED')
                    resolve();
                }, 2000)
            }, 500);
        })

    }

    await createChannelsTest();
    await joinChannelsTest();
    await leaveChannelsTest();
    sleep(10000)

    console.log('Test passed!');
    user1.socket.close();
    user2.socket.close();
    server.server.close();
    console.log('==========END CHANNELS TEST==========')
    process.exit(0);
})();