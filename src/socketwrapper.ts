// Socket wrapper

/**
 * Module dependencies.
 */
import * as io from 'socket.io';
import * as ioClient from 'socket.io-client';
import * as https from 'https';
import * as protocol from './protocol';
import { Server } from 'socket.io';

// TODO: replace any's
class SocketWrapper {
    /**
     * Create a new server
     * @param {Number} port
     * @param {Object} options
     * @returns {Object}
     */
    static createServer(server: https.Server, options?: io.ServerOptions): io.Server {
        // start socket.io server, will throw EADDRINUSE when port is already in use...
        return new Server(server, options) as SWServer;
    }

    /**
     * Create a new socket
     * @param {String} server_url
     * @returns {Object}
     */
    static createSocket(
        server_url: string,
        options: {
            secure: boolean;
            rejectUnauthorized: boolean;
            ca?: string;
            query: string;
        }
    ): any {
        return ioClient.io(server_url, { secure: options.secure, rejectUnauthorized: options.rejectUnauthorized }) as any;
    }

    /**
     * Send a command to a target
     * @param {Object} server
     * @param {String} target
     * @param {Object} message
     * @param {String} type
     */
    static send(
        server: SWServer,
        target: string,
        data:
            | protocol.C2SCommand
            | protocol.S2CCommand
            | protocol.p2pCommand
            | protocol.p2pClientCommand
    ): void {
        server.to(target).emit('data', data);
    }

    /**
     * Send a raw command
     * @param {Object} socket
     * @param {String} command
     * @param {Object} args
     */
    static sendRaw(
        socket: any | SWSocketServer | SWServer,
        data:
            | protocol.C2SCommand
            | protocol.S2CCommand
            | protocol.p2pCommand
            | protocol.p2pClientCommand
    ): void {
        socket.emit('data', data);
    }

    /**
     * Execute a command on a server.
     * @param {Object} server
     * @param {String} command
     * @param {Function} func
     */
    static OnServer(
        server: SWServer | https.Server,
        command: string,
        func: (...args: any[]) => void
    ): void {
        server.on(command, func);
    }

    /**
     * Execute a command on the given socket.
     * @param {Object} socket
     * @param {String} command
     * @param {Function} func
     */
    static OnSocket(
        socket: any | SWSocketServer,
        command: string,
        func: (...args: any[]) => void
    ): void {
        socket.on(command, func);
    }

    /**
     * Disconnect from the given socket
     * @param socket
     * @param allowed
     */
    static disconnect(socket: SWSocketServer | any, allowed: boolean): void {
        socket.disconnect(allowed);
    }

    static disconnectFromServer(server: SWServer, socketId: string, allowed?: boolean): void {
        server.sockets.sockets.get(socketId)!.disconnect(allowed)
    }

    static turnOffListeners(socket: any): void {
        socket.off('data');
        socket.off('disconnect');
        socket.off('connect');
    }

    static connectToNext(url: string, options?: io.ServerOptions): any {
        return ioClient.io(url, options);
    }

    static getRingList(socket: any): void {
        socket.emit('get-ring-list');
    }

    static updateP2PClients(socket: io.Socket | io.Server, data: protocol.p2pClientCommand): void {
        socket.emit('data', data);
    }

    static messageP2PClients(socket: io.Socket | io.Server, args: unknown): void {
        socket.emit('client-ring-update', args);
    }

}

// export type SWSocketClient = SocketIOClient.Socket;
export type SWSocketServer = io.Socket;

export type SWServer = io.Server;

export type SWServerOptions = io.ServerOptions;

/**
 * Module exports.
 */
export default SocketWrapper;