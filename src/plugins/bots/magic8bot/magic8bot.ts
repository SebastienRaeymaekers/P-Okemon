/**
* Creates a chatbot with the functionality as described in this file.
*/
// export function load(url: string, argv: {magic8bot:unknown,magic8botnick:string, magic8botowner:string,}, client: ChatClient) {
//     const magic8bot = argv.magic8bot ? new BotClient(url, "magic8bot", argv.magic8botnick, argv.magic8botowner, client) : null;
// }

/**
* Responds to questions with a random response.
*/
export function answer(newMessage: string): string {
    if (!/\?$/.test(newMessage)) return 'Try asking a question.';
    else return pickResponse();
}

/**
 * Picks a random response
 */
function pickResponse(): string {
    return responses[Math.floor(Math.random() * responses.length)];
}

/**
 * Required by the ChatBot class using this algorithm
 */
export function timeoutmessage() {
    return 'Are you still there?';
}

export function getTimeOut(): boolean {
    return (true);
}

const responses = [
    'It is certain.',
    'It is decidedly so.',
    'Without a doubt.',
    'You may rely on it.',
    'As I see it, yes.',
    'Most likely.',
    'Outlook good.',
    'Yes.',
    'Signs point to yes.',
    'Reply hazy, try again.',
    'Ask again later.',
    'Better not tell you now.',
    'Cannot predict now.',
    'Concentrate and ask again.',
    "Don't count on it.",
    'My reply is no.',
    'My sources say no.',
    'Ooutlook not so good.',
    'Very doubtful.'
]