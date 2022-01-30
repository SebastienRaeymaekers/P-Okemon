import * as rotation from './../plugins/bots/rotationbot/rotationbot';

function checkIfCorrectRotation(sendMessage: string, expectedAnswer: string, rotationNumber: number) {
    const givenAnswer = rotation.answer(sendMessage, rotationNumber);
    assert(expectedAnswer == givenAnswer);
}

function assert(cond: boolean, ...args: unknown[]) {
    if (!cond) {
        console.error(...args);
        process.exit(1);
    }
}

console.log('==========ROTATIONBOT TEST==========')

checkIfCorrectRotation('abcdefghijklmnopqrstuvwxyz;.?!', 'nopqrstuvwxyzabcdefghijklm;.?!', 13);
console.log('test_rotationbot : Test 1 passed!');
checkIfCorrectRotation('ABCDEFGHIJKLMNOPQRSTUVWXYZ;.?!', 'LMNOPQRSTUVWXYZABCDEFGHIJK;.?!', 11);
console.log('test_rotationbot : Test 2 passed!');
checkIfCorrectRotation('Hello!', 'Qnuux!', 9);
console.log('test_rotationbot : Test 3 passed!');
checkIfCorrectRotation('!!!!', '!!!!', 7);
console.log('test_rotationbot : Test 4 passed!');
checkIfCorrectRotation('test', 'test', 0);
console.log('test_rotationbot : Test 5 passed!');
console.log('test_rotationbot : All tests passed!');

console.log('==========END ROTATIONBOT TEST==========')