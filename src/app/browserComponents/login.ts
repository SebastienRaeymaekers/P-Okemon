import Client from './../../client';
import { initCanvas } from './initMain'
import { generateKeyPair, importKeyFromPassword } from './../../crypto/crypto';
import { tilePaths, spritePaths } from './../image_paths';
import * as protocol from './../../protocol';
import { addHTMLElement } from '../browser_main';

const registertabbutton = document.getElementById('registertabbutton') as HTMLButtonElement;
const loginTabButton = document.getElementById('logintabbutton') as HTMLButtonElement;
const guestTabButton = document.getElementById('guesttabbutton') as HTMLButtonElement;

let client: null | Promise<Client> | Client = null;

/**
 * Initialize the login page.
 * @param nick 
 * @param keys 
 */
async function initLogin(nick: string, keys: { publicKey: string, privateKey: string }) {
    const tabcontent = document.getElementsByClassName('tabcontent') as HTMLCollectionOf<HTMLDivElement>
    while (tabcontent.length > 0) {
        tabcontent[0].innerHTML = '';
        tabcontent[0].remove();
    }

    const tab = document.getElementsByClassName('tab') as HTMLCollectionOf<HTMLDivElement>
    while (tab.length > 0) {
        tab[0].innerHTML = '';
        tab[0].remove();
    }

    const loader = document.createElement('div');
    document.body.appendChild(loader);
    loader.id = 'loader';
    loader.className = 'loader';

    const bodyDiv = addHTMLElement('div', document.body, { id: 'bodyDiv', className: 'bodyDiv' });

    const canvas = initCanvas(bodyDiv);
    await initImages();
    let Client;
    if (keys == undefined) {
        Client = await createClient(nick, canvas, 'world1');
    } else {
        Client = await createClient(nick, canvas, 'world1', keys);
    }

    document.getElementById('loader')!.remove();
    return Client;
}

async function initImages(): Promise<void> {
    const promises: Promise<void>[] = [];

    for (const [id, path] of tilePaths) {
        promises.push(new Promise<void>((res, rej) => {

            const img = new Image();
            img.id = id;
            img.style.display = 'none';

            document.body.append(img);

            img.onload = () => res();
            img.onerror = () => rej();

            img.src = path;
        }));
    }

    for (const [id, path] of spritePaths) {
        promises.push(new Promise<void>((res, rej) => {

            const img = new Image();
            img.id = id;
            img.style.display = 'none';

            document.body.append(img);

            img.onload = () => res();
            img.onerror = () => rej();

            img.src = path;
        }));
    }

    return new Promise<void>((res,) => {
        Promise.all(promises).then(() => res());
    })
}

/**
 * Create a new client.
 * @param nick 
 * @param canvas 
 * @param keys 
 */
async function createClient(nick: string, canvas: HTMLCanvasElement, selectedWorld: string, keys?: { publicKey: string, privateKey: string }): Promise<Client> {

    let keysGiven = true;
    if (typeof keys === 'undefined') {
        keysGiven = false;
    }
    const theClient = new Client(window.location.href, selectedWorld, nick, keysGiven, canvas, keys);

    client = new Promise<Client>(resolve => theClient.socket.on('data', (data: protocol.S2CCommand) => {
        if (data.command === 'success') {
            resolve(theClient)
        }
    }));
    await client;
    return client;
}

/**
 * Return the keypair from local storage.
 * @param nick 
 * @param password 
 */
async function getKeyPair(nick: string, password: string) {
    const item = localStorage.getItem(nick);
    if (item) {
        const decrypteddata = await importKeyFromPassword(false, password, '', item);
        if (decrypteddata) {
            const savedKeys = JSON.parse(decrypteddata);
            return savedKeys;
        } else {
            return { 'publicKey': 'wrongpass', 'privateKey': 'wrongpass' };
        }

    }

    return { 'publicKey': 'notfound', 'privateKey': 'notfound' };
}

/**
 * Open a the tab with the given button and string.
 */
function openTab(button: HTMLButtonElement, tab: string) {
    // Declare all variables
    // var i, tabcontent, tablinks;
    let i;

    // Get all elements with class="tabcontent" and hide them
    const tabcontent = document.getElementsByClassName('tabcontent') as HTMLCollectionOf<HTMLDivElement>
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = 'none';
    }

    // Get all elements with class="tablinks" and remove the class "active"
    const tablinks = document.getElementsByClassName('tablinks');
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(' active', '');
    }

    // Show the current tab, and add an "active" class to the button that opened the tab
    const currentTab = document.getElementById(tab);
    currentTab!.style.display = 'flex';

    button.className += ' active';
}

// ///////////////////////////////////////////////////////////////////////////////////
// /////////////////////////// ONCLICK FUNCTIONS /////////////////////////////////////
// ///////////////////////////////////////////////////////////////////////////////////

window.onload = function () {
    openTab(loginTabButton, 'logintab');
};

loginTabButton.onclick = function () { openTab(loginTabButton, 'logintab') };
registertabbutton.onclick = function () { openTab(registertabbutton, 'registertab') };
guestTabButton.onclick = function () { openTab(guestTabButton, 'guesttab') };

export { initLogin, generateKeyPair, getKeyPair, importKeyFromPassword }