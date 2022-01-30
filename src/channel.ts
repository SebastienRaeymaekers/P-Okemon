/**
 * Module dependencies.
 */
import SocketWrapper from './socketwrapper';

import * as debugModule from 'debug';
import ChatServer from './server';
import * as protocol from './protocol';
const debug = debugModule('chat:channel');

/**
 * Channel class
 */
class Channel {

	public_key_hash: string | unknown;
	name: string;
	chatServer: ChatServer;
	users: string[] = [] // a list of all user's socket ids
	admin: string;
	timeout: NodeJS.Timeout | undefined;
	password: string;
	history: protocol.C2SCommand[] = []; // TODO maybe just the msg part?
	allowExternalMessages = false;
	historyLength = 10;

	/**
	 * @param {String} name
	 * @param {ChatServer} chatServer
	 * @param {String} socketId
	 * @param {String} password,
	 * @param {String} publickeyHash
	 */
	constructor(name: string, chatServer: ChatServer, socketId: string, commandId: number, password: string, publickeyHash?: string) {
		this.name = name;
		this.chatServer = chatServer;
		this.admin = socketId;
		this.password = password;
		//		this.password = Math.random().toString(36).slice(2);
		debug(`Created channel ${this.name} with password ${this.password}`);
		this.addUser(socketId, commandId); // add the creator of this channel to the members by default
		this.public_key_hash = publickeyHash;

		SocketWrapper.send(this.chatServer.server, socketId, {
			command: 'success',
			id: commandId,
			data: `Created a new channel: ${this.name}!`,
			to: this.name
		});
		SocketWrapper.sendRaw(this.chatServer.server, {
			command: 'event',
			id: commandId,
			event: 'addAllChannels',
			data: name
		});
	}

	/**
	 * Allows external messages in the channel, if executed by admin.
	 * @param {String} socketId
	 * @param {Boolean} boolean
	 */
	allowExternal(socketId: string, boolean: boolean): void {
		if (socketId === this.admin) { // Only the admin can change the fact that external messages are allowed or not
			this.allowExternalMessages = boolean;
			debug(`Changed allow external messages to ${boolean}`);
		}
		else {
			SocketWrapper.send(this.chatServer.server, socketId, {
				command: 'error',
				errorCode: 400,
				errorMsg: 'Only the admin can change the allow external messages field'
			});
		}
	}

	/**
	 * Add a user to the channel.
	 * @param {String} socketId
	 * @param {String} fingerprint
	 */
	addUser(socketId: string, commandId: number): void {
		if (this.users.includes(socketId)) {				// If the user is already in the channel
			SocketWrapper.send(this.chatServer.server, socketId, {
				command: 'error',
				errorCode: 400,
				errorMsg: `You're already in ${this.name}`
			});
		}
		else {	// Add the user
			// this.chatServer.server.sockets.connected.get(socketId).join(this.name);
			this.users.push(socketId);
			if (this.timeout !== undefined)
				clearTimeout(this.timeout);  // If a member joins an empty channel, stop the termination cooldown

			let namePassword: string;
			if (typeof this.password == 'string') namePassword = [this.name, this.password].join(':');
			else namePassword = this.name;
			SocketWrapper.send(this.chatServer.server, socketId, {
				command: 'event',
				id: commandId,
				event: 'addChannel',
				data: namePassword
			});
			SocketWrapper.send(this.chatServer.server, socketId, {
				command: 'success',
				id: commandId,
				data: `You've joined the channel: ${this.name}!`,
				to: this.name
			});
			debug(`Added ${socketId} to ${this.name}`);
		}
	}

	/**
	 * Remove a user from the channel.
	 * @param {String} socketId
	 */
	removeUser(socketId: string, commandId: number): void {
		if (!this.users.includes(socketId)) { 				// If you aren't in the channel
			SocketWrapper.send(this.chatServer.server, socketId, {
				command: 'error',
				errorCode: 401,
				errorMsg: `You aren't in ${this.name}`
			});
		}
		else {
			// this.chatServer.server.sockets.connected[socketId].leave(this.name);

			debug(`Old users: ${this.users}`);
			const userIndex = this.users.indexOf(socketId);
			this.users.splice(userIndex, 1);
			debug(`Deleted ${socketId} from ${this.name}`);
			debug(`New users: ${this.users}`);

			SocketWrapper.send(this.chatServer.server, socketId, {
				command: 'event',
				id: commandId,
				event: 'delChannel',
				data: this.name
			});
			SocketWrapper.send(this.chatServer.server, socketId, {
				command: 'success',
				id: commandId,
				data: `You've left the channel: ${this.name}!`
			});

			if (this.users.length === 0) { 			// Delete this channel after 1min if there are no users left
				this.timeout = setTimeout(() => {
					if (this.users.length === 0) {
						this.chatServer.channels.delete(this.name); // TODO delete channel in users?
						debug(`Channel ${this.name} deleted due to lack of users`);
						SocketWrapper.sendRaw(this.chatServer.server, {
							command: 'event',
							id: commandId,
							event: 'delAllChannel',
							data: this.name
						});
					}
				}, 10000);
			}
		}
	}

	/**
	 * Send a message on the channel.
	 * @param {String} socketId
	 * @param {Object} textMessage
	 */
	send(socketId: string, data: protocol.C2SCommand): void {
		if (data.command != 'message') throw new Error(`Command to handle is ${data.command} but should be "message"`);

		if (!this.users.includes(socketId) && !this.allowExternalMessages) { 				// If you aren't in the channel
			SocketWrapper.send(this.chatServer.server, socketId, {
				command: 'error',
				errorCode: 401,
				errorMsg: `You aren't in ${this.name}`
			});
		}
		else {
			let message: protocol.C2SCommand = {
				command: 'message',
				id: data.id,
				msg: {
					message: data.msg.message,
					from: data.msg.from,
					to: data.msg.to
				}
			};
			if (typeof data.msg.metadata != 'undefined') {
				if (typeof data.msg.metadata.timestamp == 'string') {
					message = {
						command: 'message',
						id: data.id,
						msg: {
							message: data.msg.message,
							from: data.msg.from,
							to: data.msg.to,
							metadata: {
								timestamp: data.msg.metadata.timestamp
							}
						}
					};
				}
			}
			this.addMessageToHistory(message); // The message is added to the channel history
			this.users.forEach(user => {
				SocketWrapper.send(this.chatServer.server, user, message); // The message is send over this channel
			});
		}
	}

	/**
	 * Return the channel's password.
	 * @param {String} socketId
	 * @returns {String|null}
	 */
	getPassword(socketId: string): string | null | unknown { // Get the password used in the encryption for this channel
		if (!this.users.includes(socketId) && !this.allowExternalMessages) {
			return this.password;
		} else {
			return null;
		}
	}

	/**
	 * Add a message to the channel's history, and remove old messages if there are too many.
	 * @param {Object} message
	 */
	addMessageToHistory(message: protocol.C2SCommand): void { // Add a message to the history
		this.history.push(message);

		if (this.history.length > this.historyLength) { // The last x messages will be kept in the history
			this.history.shift();
		}
	}

	/**
	 * Send the client the channel history.
	 * @param {String} socketId
	 */
	printChannelHistory(socketId: string): void { // Send the history to the client that asked
		if (!this.users.includes(socketId)) { 				// If you aren't in the channel
			SocketWrapper.send(this.chatServer.server, socketId, {
				command: 'error',
				errorCode: 401,
				errorMsg: `You aren't in ${this.name}`
			});
		}
		else {
			for (let i = 0; i < this.history.length; i++) { // Send the messages one by one
				SocketWrapper.send(this.chatServer.server, socketId, this.history[i]); // TODO these are the original messages, not sure this is the way to go here
			}
			SocketWrapper.sendRaw(this.chatServer.server, {
				command: 'success',
				id: 0, // TODO socketId?  
				data: `send history of channel ${socketId}`
			});
		}
	}
}

/**
 * Module exports.
 */
export default Channel;