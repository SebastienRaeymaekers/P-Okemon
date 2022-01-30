/**
* Creates a chatbot with the functionality as described in this file.
*/
// export function load(url: string, argv:{rotationbot:unknown,rotationnick:string, rotationowner:string,rotationnumber?:number}, client: Client) {
//     const rotation = argv.rotationbot ? new RotationChatBot(url, "rotationbot", argv.rotationnick, argv.rotationowner, argv.rotationnumber, client) : null;
// }

/**
* Answers the given message. The answer consists of the original message where every letter 
* is replaced by the letter that is {number} times after it in the alphabet.
*/
export function answer(text: string , number = 13): string {
	const message = text;
	let newMessage = '';
	let character;
	let newCharacter;

	for (let i = 0; i < message.length; i++) {
		character = message[i];
		newCharacter = transformCharacter(character, number % 26);
		newMessage += newCharacter;
	}

	return newMessage;
}

/**
* Transforms 'character' to the character that is 'number' places after it in the alphabet.
* Characters that aren't in the alphabet don't change. (For example: ? stays the same)
*/
function transformCharacter(character: string, number: number): string {
	const asciiCode = character.charCodeAt(0);
	let newAsciiCode;

	// transforms all uppercase letters
	if ((asciiCode > 64) && (asciiCode < 91)) {
		newAsciiCode = asciiCode + number;
		if (newAsciiCode > 90) {
			newAsciiCode -= 26;
		}
		return String.fromCharCode(newAsciiCode);
	}

	// transforms all lowercase letters
	if ((asciiCode > 96) && (asciiCode < 123)) {
		newAsciiCode = asciiCode + number;
		if (newAsciiCode > 122) {
			newAsciiCode -= 26;
		}
		return String.fromCharCode(newAsciiCode);
	}

	return character;
}

export function getTimeOut(): boolean {
	return (false);
}

/**
* Returns a message that the bot will say when it doesn't receive a message during some time period.
*/
export function timeoutmessage(): string {
	return ('Are you still there?');
}