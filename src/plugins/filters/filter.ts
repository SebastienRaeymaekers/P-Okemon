import * as debugModule from 'debug';
const debug = debugModule('chat:filter');
import * as redaction from './redaction/redaction';
import * as rotationbot from './rotation/rotation';

/**
 * A class of filters that provides a function to filter a message according on the filter's type.
 */
class Filter {
    algorithm: { filter: Function };
    type: string;
    args: string[];
    channelName: string | null;

    /**
     * Create a filter of the specified type.
     * 
     * @param type      the filter's type.
     * @param args      the arguments of the type
     */
    constructor(type: string, args: string[], channelName: string | null = null) {
        this.type = type;
        this.args = args;
        this.channelName = channelName;
        switch (type) {
            default:
                this.algorithm = redaction;
                break;
            case 'rotationbot':
                this.algorithm = rotationbot;
                break;
        }
        debug(`Constructed filter of type ${type}.`)
    }

    /**
     * Filters the message according to the filter's algorithm found in ./<this.type>/<this.type>
     * 
     * @param msg 
     */
    filter(msg: string): string {
        const args: Array<string> = [this.args[0], msg, this.args[1]]; // The first element are the arguments for the filter, the second is the message that needs to be filtered
        const newMsg = this.algorithm.filter(args);
        debug(`Applying filter of type ${this.type} to message.`);
        return newMsg;
    }
}

export default Filter;