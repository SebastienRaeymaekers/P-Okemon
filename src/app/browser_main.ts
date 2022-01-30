// eslint-disable-next-line spaced-comment
/// <reference lib="dom" />
import Client from './../client';
import browserInterface from './browser_interface';
import { initBody, initHeader} from './browserComponents/initMain';
import { initLogin, generateKeyPair, getKeyPair, importKeyFromPassword} from './browserComponents/login'

export const windowConst = window;
export const documentConst = document;

const nickBoxLogin = document.getElementById('nicklogin') as HTMLInputElement;
const loginButton = document.getElementById('loginButtons') as HTMLButtonElement;
const nickBoxRegister = document.getElementById('nickregister') as HTMLInputElement;
const registerButton = document.getElementById('registerButtons') as HTMLButtonElement;
const nickBoxGuest = document.getElementById('nickguest') as HTMLInputElement;
const guestButton = document.getElementById('guestButtons') as HTMLButtonElement;
const registerBoxPassword = document.getElementById('registerPasswordButton') as HTMLButtonElement;
const loginBoxPassword = document.getElementById('loginPasswordButton') as HTMLButtonElement;

// ///////////////////////////////////////////////////////////////////////////////////
// /////////////////////////// LOGIN INTERFACE ///////////////////////////////////////
// /////////////////////////////////////////////////////////////////////////////////

guestButton.onclick = async () => {
    const nick = nickBoxGuest.value;
    if (nick === '') {
        await new Promise<never>(() => alert('Enter your nick first!'));
    }

    const { publicKey, privateKey } = await generateKeyPair();
    const client = await initLogin(nick, { publicKey, privateKey });

    initMainInterface(client);
}

loginButton.onclick = async () => {
    const nick = nickBoxLogin.value;
    const password = loginBoxPassword.value;
    if (nick === '') {
        await new Promise<never>(() => alert('Enter your nick first!'));
    }

    const { publicKey, privateKey } = await getKeyPair(nick, password);
    if (publicKey === 'notfound') {
        await new Promise<never>(() => alert('This username is not registered yet!'));
    } else if (publicKey === 'wrongpass') {
        await new Promise<never>(() => alert('Wrong password! You can try to register again.'));
    }

    const client = await initLogin(nick, { publicKey, privateKey });
    initMainInterface(client);
}

registerButton.onclick = async () => {
    const nick = nickBoxRegister.value;
    const password = registerBoxPassword.value;

    if (nick === '') {
        await new Promise<never>(() => alert('Enter your nick first!'));
    }

    if (password === '') {
        await new Promise<never>(() => alert('Enter your password first!'));
    }

    const { publicKey, privateKey } = await generateKeyPair();
    const encryptedpair = await importKeyFromPassword(true, password, JSON.stringify({ publicKey, privateKey }));

    if (encryptedpair) {
        localStorage.setItem(nick, encryptedpair);
        await new Promise<never>(() => alert('Successfully registered!'));
    } else {
        await new Promise<never>(() => alert('There was an error saving the user data!'));
    }

    const client = await initLogin(nick, { publicKey, privateKey });
    initMainInterface(client);
}

// ///////////////////////////////////////////////////////////////////////////////////
// /////////////////////////// MAIN INTERFACE ///////////////////////////////////////
// /////////////////////////////////////////////////////////////////////////////////

/**
 * Calls functions that together create the main interface.
 */
function initMainInterface(Client: Client) {
    document.body.style.display = 'flex'; 
    document.body.style.flexDirection = 'column-reverse';
    document.body.style.overflow = 'hidden';
    document.documentElement.style.height = '100%'
    initButtons();
    initHeader(Client);
    const browser_interface = new browserInterface(Client);
    initBody(browser_interface, Client);
}

function initButtons() {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/icon?family=Material+Icons'
    link.rel = 'stylesheet'
    document.body.append(link)
}

/**
 * Add an HTML Element with a given type and possibly options to the given parent 
 * @param type 
 * @param parent 
 * @param options 
 * @returns 
 */
function addHTMLElement(type: string, parent: HTMLElement, options?: {id?: string, className?: string, textContent?: string, src?: string, innerHTML?: string, value?: string, type?: string, placeholder?: string, text?: string }): HTMLImageElement | HTMLElement {
    const Element = document.createElement(type);
    parent.appendChild(Element);
    if (options) {
        if (options.id) Element.id = options.id;
        if (options.className) Element.className = options.className;
        if (options.textContent) Element.textContent = options.textContent;
        if (options.src) (<HTMLImageElement>Element).src = options.src;
        if (options.innerHTML) Element.innerHTML = options.innerHTML;
        if (options.value) (<HTMLButtonElement>Element).value = options.value;
        if (options.type) (<HTMLInputElement>Element).type = options.type;
        if (options.placeholder) (<HTMLInputElement>Element).placeholder = options.placeholder;
        if (options.text) (<HTMLOptionElement>Element).text = options.text;
    }
    return Element;
}

export { addHTMLElement}