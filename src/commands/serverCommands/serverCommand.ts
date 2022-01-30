/**
 * Module dependencies.
 */
import { SWServer } from '../../socketwrapper';
import ChatServer from '../../server';
import * as protocol from '../../protocol';

export default abstract class ServerCommand {
    chatServer: ChatServer;
    name: string;
    server: SWServer;

    /**
     * @param {ChatServer} chatServer
     */
    constructor(chatServer: ChatServer, name: string) {
        this.chatServer = chatServer;
        this.name = name;
        this.server = chatServer.server;
    }

    abstract execute(socketid: string, args: protocol.C2SCommand): void;
}