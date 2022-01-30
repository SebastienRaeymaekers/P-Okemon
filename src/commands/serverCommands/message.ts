import ChatServer from '../../server';
import ServerCommand from './serverCommand';
import * as protocol from '../../protocol';

/**
 * A command that gets executed when the server recieves a message.
 */
export default class Message extends ServerCommand {

    /**
     * @param server 
     */
    constructor(server: ChatServer) {
        super(server, 'message');
    }

    /**
     * Calls the appropriate function in ChatServer
     * @param socket 
     * @param data 
     */
    execute(socketid: string, data: protocol.C2SCommand) {
        this.chatServer.onMessageClient(socketid, data);

    }

}

/**
 * Sends a message on a given server.
 */
// class SendMessage extends ServerCommand {

//     /**
//      * @param {ChatServer} chatServer
//      */
//     constructor(chatServer: ChatServer) {
//         super(chatServer, "send-message");
//     }

//     /**
//      * @param {Object} socket
//      * @param {Object} data
//      */
//     execute(socket: SWSocketServer, data: protocol.C2SCommand): void {
//         if (data.command != "channel-join") return; //TODO should not be possible

//         //If there is no channel on this server with the given name, an error will occur
//         if (!this.chatServer.channels.has(data.channelName)) { 
//             SocketWrapper.sendError(this.server, socket.id, {
//                 command: "error",
//                 errorCode: 404,
//                 errorMsg: `Channel '${data.channelName}' doesn't exists!`
//             });
//         }
//         else {
//             (this.chatServer.channels.get(data.channelName)!).send(socket.id, data);
//         }
//     }
// }