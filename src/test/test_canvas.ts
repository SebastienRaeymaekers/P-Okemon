import Client from '../client';
import ChatServer from '../server';
import assert from './test_reconnect&https';

// TODO make canvas without document OR somehow import index.html
const canvas = document.createElement('canvas');

const server = new ChatServer(3000);
const client1 = new Client('https://localhost:3000/', 'world1', 'client1', false, canvas);

// client1.world?.setUser([2, 2], 1);

const client2 = new Client('https://localhost:3000/', 'world1', 'client2', false, canvas);

assert(client1.locationInVirtualWorld == [2, 2]);

server.server.close;
client1.socket.socket.close();
client2.socket.socket.close();