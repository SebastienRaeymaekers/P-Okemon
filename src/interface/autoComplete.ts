/**
 * Module dependencies.
 */
import DutchWords from './Languages/dutchWords';
import EnglishWords from './Languages/englishWords';
import * as levenshtein from 'fast-levenshtein';

/**
 * Autocomplete class.
 */
class AutoComplete {
    // cli: CLI | null;
    commandTrie: Trie = new Trie([]);
    languageTrie: Trie = new Trie([]);
    autoCompleteLanguage = 'english';
    scoresMap: Map<string, number> = new Map<string, number>();

    constructor(/* cli: CLI | null,*/ cmdList: string[]) {
        // this.cli = cli;
        this.buildCommandTree(cmdList);
        this.buildLanguageTree('english');
    }

    /**
    * Initiate an efficient search tree for commands.
    * @param {*} cmdList 
    */
    buildCommandTree(cmdList: string[]): void {
        this.commandTrie = new Trie(cmdList);
        for (const str of cmdList) this.scoresMap.set('/' + str, 0);
    }

    /**
    * Build an efficient search tree for a language 
    * @param {*} lang 
    */
    buildLanguageTree(lang: string): void {
        let words: string[];
        switch (lang) {
            case ('english'): {
                words = EnglishWords.words;
                console.log('language set to: %o', lang);
                break;
            }
            case ('nederlands'): {
                words = DutchWords.words;
                console.log('language set to: %o', lang);
                break;
            }
            default: {
                words = [];
                console.log('this language isn\'t available');
                break;
            }
        }
        this.languageTrie = new Trie(words);
        for (const str of words) this.scoresMap.set(str, 0);
    }

    /**
    * Complete a prefix with a word or a command.
    * @param {*} prefix 
    */
    autoComplete(prefix: string) {
        let trie: Trie;
        const words: string[] = prefix.split(' ');
        prefix = words[words.length - 1];
        if (prefix.startsWith('/')) {
            prefix = prefix.slice(1, prefix.length);
            trie = this.commandTrie;
        } else {
            trie = this.languageTrie;
        }

        let resultsFromTrie: string[] = [];
        if (trie._isPrefix(prefix)) resultsFromTrie = trie.getPrefix(prefix); // correct completion
        else resultsFromTrie = trie.getPrefixWithFuzzyMatch(prefix); // fuzzymatch completion

        return resultsFromTrie.length ? this.sortResultOnScores(resultsFromTrie) : [''];
    }

    /**
     * Sort the array of result given from the trie on their scores.
     * @param resultsFromTrie 
     */
    sortResultOnScores(resultsFromTrie: string[]) {
        const tempMap: Map<string, number> = new Map<string, number>();
        for (let i = 0; i < resultsFromTrie.length; i++) {
            if (this.scoresMap.has('/' + resultsFromTrie[i])) tempMap.set(resultsFromTrie[i], this.scoresMap.get('/' + resultsFromTrie[i])!);
            else tempMap.set(resultsFromTrie[i], this.scoresMap.get(resultsFromTrie[i])!);
        }
        const resultsSortedOnScore = new Map([...tempMap.entries()].sort((a, b) => b[1] - a[1])); // sort on values (aka count)
        return Array.from(resultsSortedOnScore.keys()); // convert to array of results
    }

    /**
     * Returns the string with the highest score from the given trie results.
     * @param resultsFromTrie 
     */
    getCompletedWordFromScores(resultsFromTrie: string[]): string {
        let str: string; let maxScore = 0; let bestScoreString = '';
        for (str of resultsFromTrie) {
            if (this.scoresMap.has('/' + str) && this.scoresMap.get('/' + str)! >= maxScore) { // check for commands.
                maxScore = this.scoresMap.get('/' + str)!; bestScoreString = str;
            }
            if (this.scoresMap.has(str) && this.scoresMap.get(str)! >= maxScore) { // check for normal words.
                maxScore = this.scoresMap.get(str)!; bestScoreString = str;
            }
        }
        return bestScoreString;
    }

    /**
     * Updates the scoresMap for the given input string.
     * @param input 
     */
    updateWordsScore(input: string): void {
        const words: string[] = input.split(' ');
        for (const word of words) {
            if (!this.scoresMap.has(word)) this.scoresMap.set(word!, 1);
            else this.scoresMap.set(word, this.scoresMap.get(word)! + 1);
        }
    }

    /**
    * Change the language tree's language.
    * @param {*} lang 
    */
    changeAutocompleteLanguage(lang: string): void {
        if (this.autoCompleteLanguage != lang) {
            this.autoCompleteLanguage = lang;
            this.buildLanguageTree(lang);
        }
    }

}

/** *******************************************************
 * Classes used in import { Trie } from "prefix-trie-ts";*
 * https://github.com/ClickSimply/prefix-trie-ts         *
 * Needed to do this to make  some changes to the code:
 * - now supports uppercase words.
 * - now does fuzzy matching. (the functions work, but 
 * could not figure out how to print it properly on time)
 *********************************************************/

const config = {
    END_WORD: '$',
    PERMS_MIN_LEN: 2,
};

export class Trie {

    /**
     * 
     * 
     * @internal
     * @type {*}
     * @memberOf Trie
     */
    private _trie: any;

    constructor(input: string[]) {
        this._trie = Trie._create(input);
    }

    public getIndex() {
        return this._trie;
    }

    public setIndex(trie: any) {
        this._trie = trie;
    }

    public addWord(word: string) {

        const reducer = (previousValue: any, currentValue: string, currentIndex: number, array: string[]) => {
            return Trie._append(previousValue, currentValue, currentIndex, array);
        };

        const input: string[] = word.split('');
        input.reduce(reducer, this._trie);
        return this;
    }

    public removeWord(word: string) {

        const { prefixFound, prefixNode } = Trie._checkPrefix(this._trie, word);

        if (prefixFound) {
            delete prefixNode[config.END_WORD];
        }

        return this;
    }

    public getWords() {
        return Trie._recursePrefix(this._trie, '');
    }

    public getPrefixWithFuzzyMatch(strPrefix: string): string[] {
        // get prefix of the given prefix for which the trie has result to find the prefix until right before the typo.
        let foundWords: string[] = [];
        let wordsToLookAt: string[] = [];
        let i: number;
        for (i = 0; i < strPrefix.length; i++) {
            wordsToLookAt = this.getPrefix(strPrefix.slice(0, i));
            if (wordsToLookAt.length == 0) break;
            else foundWords = wordsToLookAt;
        }

        // perform fuzzymatch with prefix on result from above.
        let minValue = Infinity; let bestMatch = '';
        for (const word of foundWords) {
            const levDist: number = levenshtein.get(strPrefix, word);
            if (levDist < minValue) {
                minValue = levDist; bestMatch = word;
            }
        }
        let result: string[];
        bestMatch.length ? result = [bestMatch] : result = [];
        // process.stdout.cursorTo(bestMatch.length-i-3);  // move cursor to beginning of line
        // process.stdout.clearLine(1);  // clear text from the right of the cursor.
        return result;
    }

    public getPrefix(strPrefix: string) {
        if (!this._isPrefix(strPrefix)) {
            return [];
        }

        const { prefixNode } = Trie._checkPrefix(this._trie, strPrefix);

        return Trie._recursePrefix(prefixNode, strPrefix);
    }

    /**
     * 
     * 
     * @internal
     * @param {any} prefix 
     * @returns 
     * 
     * @memberOf Trie
     */
    public _isPrefix(prefix: string) {

        const { prefixFound } = Trie._checkPrefix(this._trie, prefix);

        return prefixFound;
    }

    /**
     * 
     * 
     * @internal
     * @static
     * @param {any} trie 
     * @param {any} letter 
     * @param {any} index 
     * @param {any} array 
     * @returns 
     * 
     * @memberOf Trie
     */
    private static _append(trie: any, letter: string, index: number, array: string[]) {
        trie[letter] = trie[letter] || {};
        trie = trie[letter];

        if (index === array.length - 1) {
            trie[config.END_WORD] = 1;
        }

        return trie;
    }

    /**
     * 
     * 
     * @internal
     * @static
     * @param {any} prefixNode 
     * @param {string} prefix 
     * @returns 
     * 
     * @memberOf Trie
     */
    private static _checkPrefix(prefixNode: any, prefix: string) {
        const input: string[] = prefix.split('');
        const prefixFound = input.every((letter,) => {
            if (!prefixNode[letter]) {
                return false;
            }
            return prefixNode = prefixNode[letter];
        });

        return {
            prefixFound,
            prefixNode,
        };
    }

    /**
     * 
     * 
     * @internal
     * @static
     * @param {any} input 
     * @returns 
     * 
     * @memberOf Trie
     */
    private static _create(input: string[]) {

        const trie = (input || []).reduce((accumulator, item) => {
            item
                .split('')
                .reduce(Trie._append, accumulator);

            return accumulator;
        }, {});

        return trie;
    }

    /**
     * 
     * 
     * @internal
     * @static
     * @param {any} node 
     * @param {any} prefix 
     * @param {string[]} [prefixes=[]] 
     * @returns 
     * 
     * @memberOf Trie
     */
    private static _recursePrefix(node: any, prefix: string, prefixes: string[] = []) {
        let word = prefix;

        for (const branch in node) {
            if (branch === config.END_WORD) {
                prefixes.push(word);
                word = '';
            }
            Trie._recursePrefix(node[branch], prefix + branch, prefixes);
        }

        return prefixes.sort();
    }
}

/**
 * Module exports.
 */
export default AutoComplete;