/**
 * Filter the given message by rotating every letter 13 places in the alphabet.
 * @param args 		The first element of args contains the arguments for the filter
 * 					The second element contains the message that needs to be filtered
 */
export function filter(args: Array<string>): string {
	let number;
	if (args[0] != null) {
		number = Number(args[0]);
	} else {
		number = 13;
	}
	let newMessage = '';
	let character;
	let newCharacter;
	let decode = false;
	if (args[2] == 'incoming') {
		decode = true;
	}

	for (let i = 0; i < args[1].length; i++) {
		character = args[1][i];
		newCharacter = transformCharacter(character, number % 26, decode);
		newMessage += newCharacter;
	}

	return newMessage;
}

/**
* Transforms 'character' to the character that is 'number' places after it in the alphabet.
* Characters that aren't in the alphabet don't change. (For example: ? stays the same)
*/
function transformCharacter(character: string, number: number, decode: boolean): string {
	const asciiCode = character.charCodeAt(0);
	let newAsciiCode;

	if (decode) {
		number = number * -1
	}

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