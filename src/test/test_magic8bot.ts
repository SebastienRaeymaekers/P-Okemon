import * as magic8 from './../plugins/bots/magic8bot/magic8bot';

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
    'Outlook not so good.',
    'Very doubtful.'
]

function checkIfCorrectAnswer(sendMessage: string) {
    const answer = magic8.answer(sendMessage);
    return responses.indexOf(answer) != -1;
}

console.log('==========MAGIC8BOT TEST==========');

if (checkIfCorrectAnswer('question?')) console.log('test_magic8bot : Test 1 passed!');
if (!checkIfCorrectAnswer('statement.')) console.log('test_magic8bot : Test 2 passed!');

console.log('==========END MAGIC8BOT TEST==========')