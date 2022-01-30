// eslint-disable-next-line spaced-comment
/// <reference lib="dom" />
import { addHTMLElement } from './../browser_main'
import Client from './../../client';
import browserInterface from './../browser_interface';
import { initCreateChannelModal, initJoinChannelModal, makeSettings, refreshChannelList, refreshFriendlist } from './header'

/**
 * Initialize the body of the html document
 * @param browser_interface 
 * @param client 
 */
function initBody(browser_interface: browserInterface, client: Client) {
    const bodyDiv = <HTMLElement>document.getElementById('bodyDiv');
    const gameDiv = <HTMLElement>document.getElementById('gameDiv');
    initButtonBox(gameDiv, client);
    initChatDiv(browser_interface, bodyDiv);
    initGPSModal();
    displayCanvas();
}

/**
 * Initialize the buttons next to the game canvas
 * @param gameDiv 
 * @param client 
 */
function initButtonBox(gameDiv: HTMLElement, client: Client) {
    const buttonBoxDiv = addHTMLElement('div', gameDiv, { id: 'buttonBoxDiv', className: 'buttonBoxDiv' })
    const openChat = addHTMLElement('span', buttonBoxDiv, { id: 'chatButton', className: 'material-icons buttonBox', innerHTML: 'chat' })
    addHTMLElement('span', buttonBoxDiv, { id: 'playButton', className: 'material-icons unavailableButtonBox', innerHTML: 'play_circle_outline' })
    const spriteSelector = addHTMLElement('span', buttonBoxDiv, { id: 'spriteButton', className: 'material-icons buttonBox', innerHTML: 'checkroom' })
    const gpsButton = addHTMLElement('span', buttonBoxDiv, { id: 'gpsButton', className: 'material-icons buttonBox', innerHTML: 'public' })
    openChat.onclick = () => {
        const chatDiv = document.getElementById('chatDiv');
        if (chatDiv!.style.display !== 'flex') chatDiv!.style.display = 'flex'
        else chatDiv!.style.display = 'none'
    }
    spriteSelector.onclick = () => openSpriteSelector(client);
    gpsButton.onclick = () => {
        const modal = document.getElementById('modalGPS');
        const span = document.getElementById('closeButtonGPS');
        const buttonON = document.getElementById('GPSButtonON');
        const buttonOFF = document.getElementById('GPSButtonOFF');
        const dropDown = document.getElementById('modalDropDownGPS');

        // add all options to dropdown menu
        const x: number = (dropDown as HTMLSelectElement).options.length - 1;
        let i;
        for (i = x; i >= 0; i--) {
            (dropDown as HTMLSelectElement).options[i].remove();
        }

        client.directory.forEach((nick: string) => {
            if (nick !== client.nick) {
                addHTMLElement('option', dropDown!, { value: nick, text: nick });
            }
        });

        modal!.style.display = 'block';
        span!.onclick = () => {
            modal!.style.display = 'none';
        }
        buttonON!.onclick = async () => {
            modal!.style.display = 'none';
            if (client.directory.size == 1) {
                await new Promise<never>(() => alert('There are currently no other clients in this world!'));
            }
            else {
                const name = ((document.getElementById('modalDropDownGPS') as HTMLInputElement).value);
                client.world!.activateGPStoUser(name);
            }
        }
        buttonOFF!.onclick = async () => {
            modal!.style.display = 'none';
            client.world!.deactivateGPStoUser();
        }
    }
}

/**
 * Create HTML elements for the gps modal
 */
function initGPSModal() {
    // Modal div
    const modalGPS = addHTMLElement('div', document.body, { id: 'modalGPS', className: 'modal-create-channel' });
    // Modal content
    const modalContentGPS = addHTMLElement('div', modalGPS, { id: 'modalContentGPS', className: 'modal-content-create-channel' });
    // Modal header
    const modalHeaderGPS = addHTMLElement('div', modalContentGPS, { id: 'modalHeaderGPS', className: 'modal-header-create-channel' });
    // Modal Body
    const modalBodyGPS = addHTMLElement('div', modalContentGPS, { id: 'modalBodyGPS', className: 'modal-body-create-channel' });
    // close 
    addHTMLElement('span', modalHeaderGPS, { id: 'closeButtonGPS', className: 'close', innerHTML: '&times;' });
    // Modal Header title
    addHTMLElement('h2', modalHeaderGPS, { textContent: 'GPS functionality' })
    // Text in modal body
    addHTMLElement('p', modalBodyGPS, { textContent: 'Select the user you want directions to:' })
    // Dropdown menu
    addHTMLElement('select', modalBodyGPS, { id: 'modalDropDownGPS' });
    // Extra space
    addHTMLElement('p', modalBodyGPS, { textContent: '' });
    // Buttons div
    const GPSButtondiv = addHTMLElement('div', modalBodyGPS, { id: 'GPSButtondiv', className: 'GPSbuttons' });
    // GPS ON button
    addHTMLElement('button', GPSButtondiv, { id: 'GPSButtonON', innerHTML: 'Activate GPS', className: 'GPSButton', value: 'Activate GPS' });
    // GPS OFF button
    addHTMLElement('button', GPSButtondiv, { id: 'GPSButtonOFF', innerHTML: 'Deactivate GPS', className: 'GPSButton', value: 'Deactivate GPS' });
    // Extra space
    addHTMLElement('p', modalBodyGPS, { textContent: '' })
}

/**
 * Open the sprite selector menu
 * @param client chatclient
 */
function openSpriteSelector(client: Client) {
    const bodyDiv = <HTMLElement>document.getElementById('bodyDiv');
    const spriteDiv = addHTMLElement('div', bodyDiv, { id: 'spriteDiv', className: 'buttonboxMenu', });
    const spriteContentDiv = addHTMLElement('div', spriteDiv, { id: 'spriteContentDiv', className: 'buttonboxMenuContent' });
    const spriteHeaderDiv = addHTMLElement('div', spriteContentDiv, { id: 'spriteHeaderDiv', className: 'buttonboxMenuHeader' });
    const spriteBodyDiv = addHTMLElement('div', spriteContentDiv, { id: 'spriteBodyDiv', className: 'spriteSelectorBody' });
    const close = addHTMLElement('span', spriteHeaderDiv, { id: 'closebuttonSprites', className: 'close', innerHTML: '&times;' })
    addHTMLElement('h2', spriteHeaderDiv, { id: 'modalTitle', textContent: 'SPRITE SELECTOR' });
    spriteDiv!.style.display = 'block';
    close!.onclick = () => {
        spriteDiv!.style.display = 'none';
    }

    const sprite1 = addHTMLElement('img', spriteBodyDiv, { src: 'images/sprite1-s.png', className: 'sprite' })
    const sprite2 = addHTMLElement('img', spriteBodyDiv, { src: 'images/sprite2-s.png', className: 'sprite' })
    const sprite3 = addHTMLElement('img', spriteBodyDiv, { src: 'images/sprite3-s.png', className: 'sprite' })
    const sprite4 = addHTMLElement('img', spriteBodyDiv, { src: 'images/sprite4-s.png', className: 'sprite' })

    sprite1.onclick = () => changeSpriteAndClose(1);
    sprite2.onclick = () => changeSpriteAndClose(2);
    sprite3.onclick = () => changeSpriteAndClose(3);
    sprite4.onclick = () => changeSpriteAndClose(4);

    function changeSpriteAndClose(number: number) {
        client.updateUserSpriteInWorld(number)
        client.spriteNumber = number;
        spriteDiv!.style.display = 'none';
    }
}

/**
 * Create a HTML div-element for the canvas.
 * Instanciate the canvas
 */
function initCanvas(bodyDiv: HTMLElement): HTMLCanvasElement {
    const div = addHTMLElement('div', bodyDiv, { id: 'gameDiv', className: 'gameDiv' })
    div.style.display = 'none';

    const canvas = <HTMLCanvasElement>addHTMLElement('canvas', div, { id: 'canvas', className: 'canvas' });
    const bodyWidth = document.body.clientWidth;
    canvas.id = 'map';
    canvas.width = bodyWidth * (11 / 19);
    canvas.height = canvas.width * (11 / 17);

    return canvas;
}

/**
 * Create a HTML div-element for the header.
 * Add some elements
 */
function initHeader(Client: Client) {
    // HEADER DIV 
    const headerDiv = addHTMLElement('div', document.body, { id: 'headerDiv', className: 'headerDiv' });

    // NICK NAME
    addHTMLElement('div', headerDiv, { id: 'headerNickDiv', className: 'headerNickDiv', textContent: Client.nick });

    // LOGO
    addHTMLElement('img', headerDiv, { id: 'headerLogo', className: 'headerLogo', src: 'images/logo.png' });

    // HEADER NAV
    const headerNav = addHTMLElement('div', headerDiv, { id: 'headerNav', className: 'headerNav' });

    // POPUP CLIENT DIRECTORY
    const popupDiv = addHTMLElement('div', headerNav, { id: 'dirPopupDiv', className: 'popup' });
    const popupTitleDiv = addHTMLElement('div', popupDiv, { id: 'popupTitleDiv', className: 'popupTitle' });
    addHTMLElement('span', popupTitleDiv, { className: 'material-icons', innerHTML: 'forum' })
    addHTMLElement('p', popupTitleDiv, { className: 'popupText', innerHTML: 'Directory' });
    const dirPopupSpan = addHTMLElement('span', popupDiv, { id: 'dirPopupSpan', className: 'popuptext' });

    // POPUP CHANNELS
    const channelPopupDiv = addHTMLElement('div', headerNav, { id: 'channelPopupDiv', className: 'popup' });
    const channelPopupTitleDiv = addHTMLElement('div', channelPopupDiv, { id: 'channelPopupTitleDiv', className: 'popupTitle' });
    addHTMLElement('span', channelPopupTitleDiv, { className: 'material-icons', innerHTML: 'people' })
    addHTMLElement('p', channelPopupTitleDiv, { className: 'popupText', innerHTML: 'Channels' });
    const channelPopupSpan = addHTMLElement('span', channelPopupDiv, { id: 'channelPopupSpan', className: 'popuptext' });

    // POPUP SETTINGS
    const settingsPopupDiv = addHTMLElement('div', headerNav, { id: 'settingsPopupDiv', className: 'popup' });
    const settingsPopupTitleDiv = addHTMLElement('div', settingsPopupDiv, { id: 'settingsPopupTitleDiv', className: 'popupTitle' });
    addHTMLElement('span', settingsPopupTitleDiv, { className: 'material-icons', innerHTML: 'settings' })
    addHTMLElement('p', settingsPopupTitleDiv, { className: 'popupText', innerHTML: 'Settings' });
    const settingsPopupSpan = addHTMLElement('span', settingsPopupDiv, { id: 'settingsPopupSpan', className: 'popuptext' });
    makeSettings();

    // No two popups active at same time
    let popupOpen = false;
    let channelPopupOpen = false;
    let settingsPopupOpen = false;

    function closeAllPopups() {
        dirPopupSpan.style.visibility = 'hidden';
        settingsPopupSpan.style.visibility = 'hidden';
        channelPopupSpan.style.visibility = 'hidden';
        popupOpen = false;
        settingsPopupOpen = false;
        channelPopupOpen = false;
    }

    popupDiv.onclick = async () => {
        if (!popupOpen) {
            closeAllPopups()
            refreshFriendlist(Client);
            dirPopupSpan.style.visibility = 'visible';
            popupOpen = true;
        } else closeAllPopups();
    };

    channelPopupDiv.onclick = async () => {
        if (!channelPopupOpen) {
            closeAllPopups()
            refreshChannelList(Client);
            channelPopupSpan.style.visibility = 'visible';
            channelPopupOpen = true;
        } else closeAllPopups();
    };

    settingsPopupDiv.onclick = async () => {
        if (!settingsPopupOpen) {
            closeAllPopups()
            refreshFriendlist(Client);
            settingsPopupSpan.style.visibility = 'visible';
            settingsPopupOpen = true;
        } else closeAllPopups();
    };

    // DISCONNECT BUTTON
    const disconnectButton = addHTMLElement('div', headerNav, { id: 'disconnectButton', className: 'disconnectButton' });
    addHTMLElement('span', disconnectButton, { className: 'material-icons', innerHTML: 'logout' })
    disconnectButton.onclick = async () => {
        Client.send({
            command: 'request-disconnect',
            id: Client.getCommandId(),
            from: Client.getPublicKeyHash()
        });
        location.reload();
    }

    initCreateChannelModal();
    initJoinChannelModal();
}

/**
 * Display the canvas.
 */
function displayCanvas() {
    const canvasDiv = document.getElementById('gameDiv');
    canvasDiv!.className = 'gameDiv';
    canvasDiv!.style.display = 'flex';
}

/**
 * Create a HTML div-element for the chatbox.
 */
function initChatDiv(browser_interface: browserInterface, bodyDiv: HTMLElement) {
    const chatDiv = addHTMLElement('div', bodyDiv, { id: 'chatDiv', className: 'chatDiv' });
    addHTMLElement('div', chatDiv, { className: 'chatDivExtraSpace' });
    const chatTitleDiv = addHTMLElement('div', chatDiv, { id: 'chatTitleDiv', className: 'chatTitleDiv' });
    addHTMLElement('h2', chatTitleDiv, { id: 'chatTitleText', textContent: 'MAIN CHANNEL' });
    const chatBox = addHTMLElement('div', chatDiv, { id: 'chatBox', className: 'chatBox' });
    addHTMLElement('div', chatDiv, { id: 'extraDiv2', className: 'chatDivExtraSpace2' });
    browser_interface.messagesDiv = chatBox;
    initSendDiv(browser_interface);
}

/**
 * Create a HTML div-element for the send box.
 * Add some elements
 */
function initSendDiv(browser_interface: browserInterface) {
    // Send div 
    const chatDiv = <HTMLElement>document.getElementById('chatDiv');
    const sendDiv = addHTMLElement('div', chatDiv, { id: 'sendDiv', className: 'sendDiv', })

    // Input box
    const textBox = <HTMLInputElement>addHTMLElement('input', sendDiv, { id: 'textBox', className: 'textBox', placeholder: 'What is on your mind?' });

    // Send button
    // const sendButton = addHTMLElement('button',sendDiv, {id: 'sendButton', className: 'sendButton', value: 'Send', innerHTML: 'Send'});

    /* sendButton.onclick = async () => {
        const text = textBox!.value;
        textBox!.value = '';
        browser_interface!.processInput(text);
    }; */

    textBox.addEventListener('keyup', function (event: KeyboardEvent) {
        if (event.code == 'Enter') {
            // Cancel the default action, if needed
            event.preventDefault();
            const text = textBox!.value;
            textBox!.value = '';
            browser_interface!.processInput(text);
        }
    });

    document.body.addEventListener('keydown', function (event: KeyboardEvent) {
        if (event.code == 'Tab') {
            // Cancel the default action, if needed
            event.preventDefault();
            const text = textBox.value;
            const autocompletedText = browser_interface!.autocompleteInput(text);
            if (autocompletedText != undefined && autocompletedText.length > 0) textBox!.value = autocompletedText;
            // document.getElementById('textBox')!.focus();
        }
    });

}

export { initHeader, initCanvas, initSendDiv, initChatDiv as initChatBox, displayCanvas, initBody }