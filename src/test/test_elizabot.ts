import * as eliza from './../plugins/bots/elizabot/elizabot';

function assert(cond: boolean, ...args: unknown[]) {
    if (!cond) {
        console.error(...args);
        process.exit(1);
    }
}

const list1: string[] = ['What does that suggest to you?',
    'I see.',
    "I'm not sure I understand you fully.",
    'Can you elaborate?',
    'That is quite interesting.',
    'Please tell me more.',
    "Let's change focus a bit... Tell me about your family.",
    'Can you elaborate on that?'];

const list2: string[] = ['Hi again! How is going?',
    'How are you today? Any problems?'];

const list3: string[] = ['Do computers worry you?',
    'Why do you mention computers?',
    'Could you expand on how computers and * are related?',
    'What do you think machines have to do with your problem?',
    "Don't you think computers can help people?", 'What about machines worrys you?',
    'What do you think about machines?'];

const list4: string[] = ['What makes you bored?'];

const list5: string[] = list1;

const list6: string[] = ["That's good. What is making you happy?"];

const list7: string[] = ['What makes you bored?'];

const list8: string[] = ["I told you before, I don't understand languages that are not English."];

const list9: string[] = ["Do you really think I don't like your style?",
    'Perhaps eventually I will like your style.',
    'Do you really want me to like your style?'];

const list10: string[] = ["Please don't apologize.",
    'Apologies are not necessary.',
    'Apologies are not required.'];

function checkIfCorrectAnswerReturned(sendMessage: string, expectedAnswers: string[]) {
    const givenAnswer = eliza.answer(sendMessage);
    assert(expectedAnswers.includes(givenAnswer));
}

console.log('==========ELIZABOT TEST==========')

checkIfCorrectAnswerReturned('dfqsdfqdsfdsq', list1);
console.log('test_elizabot : Test 1 passed!');
checkIfCorrectAnswerReturned('Hi There!', list2);
console.log('test_elizabot : Test 2 passed!');
checkIfCorrectAnswerReturned('I like computers.', list3);
console.log('test_elizabot : Test 3 passed!');
checkIfCorrectAnswerReturned('I AM BORED', list4);
console.log('test_elizabot : Test 4 passed!');
checkIfCorrectAnswerReturned('Is that true?', list5);
console.log('test_elizabot : Test 5 passed!');
checkIfCorrectAnswerReturned('I think i am extremely happy for example', list6);
console.log('test_elizabot : Test 6 passed!');
checkIfCorrectAnswerReturned('Pfff I am SO bored.', list7);
console.log('test_elizabot : Test 7 passed!');
checkIfCorrectAnswerReturned('Is this another language?????', list8);
console.log('test_elizabot : Test 8 passed!');
checkIfCorrectAnswerReturned("Why don't you like my style?", list9);
console.log('test_elizabot : Test 9 passed!');
checkIfCorrectAnswerReturned('Sorry!', list10);
console.log('test_elizabot : Test 10 passed!');
console.log('test_elizabot : All tests passed!');

console.log('==========END ELIZABOT TEST==========')