import ChatServer from '../../server';
import ServerCommand from './serverCommand';
import * as protocol from '../../protocol';

/**
 * A command that gets executed when a client send an update of its state in the world.
 */
export default class UpdateUserInWorld extends ServerCommand {
  /**
   * @param server
   */
  constructor(server: ChatServer) {
    super(server, 'update-user-in-world');
  }

  /**
   * Calls the appropriate function in ChatServer
   * @param socket
   * @param data
   */
  execute(socketid: string, data: protocol.C2SCommand): void {
    if (data.command != 'update-user-in-world')
      throw new Error(
        'This can only be called with the update-orientation command.'
      );

    // update data gotten from client on the server
    for (const [, clientData] of this.chatServer.verifiedConnectedClients) {
      clientData.forEach((entry) => {
        if (entry.socketID == socketid) {
          if (entry.spriteNumber != data.spriteNumber) {
            entry.spriteNumber = data.spriteNumber;
          }
          else {
            const xdiffrence = data.location[0] - entry.location[0];
            const ydiffrence = data.location[1] - entry.location[1];
            // ensures that a time problem doesn't lock the moving direction
            if (xdiffrence > 1 || xdiffrence < -1 || ydiffrence > 1 || ydiffrence < -1) {
              entry.location = data.location
              entry.orientation = data.orientation
            }
            if (entry.animationProgress == 0) {
              // rotation
              if (entry.location[0] == data.location[0] && entry.location[1] == data.location[1]) {
                entry.orientation = data.orientation;
              } else {
                // movement
                entry.orientation = data.orientation;
                entry.animationProgress += 5;
              }
            }
          }
        }

      });
    }
  }

}