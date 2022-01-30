import { addHTMLElement } from '../browser_main';
import Client from './../../client';

export let messageToSend = '/shout-to-all ';

/**
 * Create HTML Elements for the Create-Channel Modal
 */
function initCreateChannelModal() {
    // Modal div
    const modalCreateChannel = addHTMLElement('div', document.body, { id: 'modalCreateChannel', className: 'modal-create-channel', });

    // Modal content
    const modalContentCreateChannel = addHTMLElement('div', modalCreateChannel, { id: 'modalContentCreateChannel', className: 'modal-content-create-channel' });

    // Modal header
    const modalHeaderCreateChannel = addHTMLElement('div', modalContentCreateChannel, { id: 'modalHeaderCreateChannel', className: 'modal-header-create-channel' });

    // Modal Body
    const modalBodyCreateChannel = addHTMLElement('div', modalContentCreateChannel, { id: 'modalBodyCreateChannel', className: 'modal-body-create-channel' });

    // close 
    addHTMLElement('span', modalHeaderCreateChannel, { id: 'closeButtonCreateChannel', className: 'close', innerHTML: '&times;' })

    // Modal Header title
    addHTMLElement('h2', modalHeaderCreateChannel, { id: 'modalHeaderTitleCreateChannel', textContent: 'Creating a new channel' });

    // Text in modal body
    addHTMLElement('p', modalBodyCreateChannel, { id: 'modalTextCreateChannel', textContent: 'Enter the name for the new channel (a channel name should start with #):' });

    // Textbox
    addHTMLElement('input', modalBodyCreateChannel, { id: 'modalTextBoxCreateChannel', type: 'text' });

    // Extra space
    addHTMLElement('p', modalBodyCreateChannel, { textContent: '' })

    // Send button
    addHTMLElement('button', modalBodyCreateChannel, { id: 'createChannelButton', className: 'sendButton', innerHTML: 'Submit', value: 'Submit' });

    // Extra space
    addHTMLElement('p', modalBodyCreateChannel, { textContent: '' });

    const modal = document.getElementById('modalCreateChannel');
    const button = document.getElementById('createChannelButton');
    // Pressing enter can also be used to create a new channel.
    modal!.addEventListener('keyup', function (event: KeyboardEvent) {
        if ((event.code == 'Enter') && (modal!.style.display == 'block')) {
            // Cancel the default action, if needed
            event.preventDefault();
            button!.click();
        }
    });
}

/**
 * Create HTML Elements for the Join-Channel Modal
 */
function initJoinChannelModal() {
    // Modal div
    const modalJoinChannel = addHTMLElement('div', document.body, { id: 'modalJoinChannel', className: 'modal-create-channel', });

    // Modal content
    const modalContentJoinChannel = addHTMLElement('div', modalJoinChannel, { id: 'modalContentJoinChannel', className: 'modal-content-create-channel', })

    // Modal header
    const modalHeaderJoinChannel = addHTMLElement('div', modalContentJoinChannel, { id: 'modalHeaderJoinChannel', className: 'modal-header-create-channel', });

    // Modal Body
    const modalBodyJoinChannel = addHTMLElement('div', modalContentJoinChannel, { id: 'modalBodyJoinChannel', className: 'modal-body-create-channel', });

    // close 
    addHTMLElement('span', modalHeaderJoinChannel, { id: 'closeButtonJoinChannel', className: 'close', innerHTML: '&times;' });

    // Modal Header title
    addHTMLElement('h2', modalHeaderJoinChannel, { textContent: 'Joining a channel' })

    // Text in modal body
    addHTMLElement('p', modalBodyJoinChannel, { textContent: 'Select the channel you want to join:' })

    // Dropdown menu
    addHTMLElement('select', modalBodyJoinChannel, { id: 'modalDropDownJoinChannel' });

    // Extra space
    addHTMLElement('p', modalBodyJoinChannel, { textContent: '' });

    // Send button
    addHTMLElement('button', modalBodyJoinChannel, { id: 'joinChannelButton', innerHTML: 'Submit', className: 'sendButton', value: 'Submit' });

    // Extra space
    addHTMLElement('p', modalBodyJoinChannel, { textContent: '' })
}

/**
 * Refreshes the friendlist in the popupSpan element.
 * @param Client 
 */
function refreshFriendlist(Client: Client) {
    const popupSpan = document.getElementById('dirPopupSpan')
    popupSpan!.innerHTML = '';
    const title = addHTMLElement('p', popupSpan!, { textContent: 'MY FRIENDS:' })
    title.style.color = 'steelblue'
    const friendlist = Client.directory;
    friendlist.forEach((nick: string, fingerprint,) => {
        const friend = addHTMLElement('p', popupSpan!, { className: 'popupValueText', textContent: nick })

        const messagesDiv = document.createElement('div');
        messagesDiv.id = `messagesDiv${nick}`;
        messagesDiv.style.marginTop = '10px';
        messagesDiv.style.display = 'none';
        messagesDiv.style.height = '100%';
        messagesDiv.style.overflowY = 'auto';
        messagesDiv.style.overflowX = 'hidden';

        const chatDiv = document.getElementById('chatDiv')!;
        chatDiv.appendChild(messagesDiv);
        const target = document.getElementById('sendDiv')!;
        chatDiv.insertBefore(messagesDiv, target);

        friend.onclick = async () => {
            setChatBoxToNick(nick, fingerprint, Client);
        }
    });
}

/**
 * Script for the Span Element of channels
 * @param Client 
 */
function refreshChannelList(Client: Client) {
    const channelPopupSpan = document.getElementById('channelPopupSpan');
    channelPopupSpan!.innerHTML = '';

    const all = addHTMLElement('p', channelPopupSpan!, { className: 'popupValueText', textContent: 'MAIN CHANNEL' });
    all.onclick = async () => {
        setChatBoxToChannel('MAIN CHANNEL', Client);
    }
    // eslint-disable-next-line no-unused-vars
    Client.channels.forEach((_, name) => {
        const channelDiv = addHTMLElement('div', channelPopupSpan!, { id: `channelDiv${name}`, className: 'channel-name-div', });

        const channels = addHTMLElement('p', channelDiv!, { className: 'popupValueText', textContent: name });

        const messagesDiv = document.createElement('div');
        messagesDiv.id = `messagesDiv${name}`;
        messagesDiv.style.marginTop = '10px';
        messagesDiv.style.display = 'none';
        messagesDiv.style.height = '100%';
        messagesDiv.style.overflowY = 'auto';
        messagesDiv.style.overflowX = 'hidden';

        const chatDiv = document.getElementById('chatDiv')!;
        chatDiv.appendChild(messagesDiv);
        const target = document.getElementById('extraDiv2')!;
        chatDiv.insertBefore(messagesDiv, target);

        channels.onclick = async () => {
            setChatBoxToChannel(name, Client);
        }

        if ((name.substr(0, 6) != '#table') && ((name.substr(0, 6) != '#world'))) {
            const leaveChannelButton = addHTMLElement('span', channelDiv, { id: `leaveChannelButton${name}`, className: 'close2', innerHTML: '&times;' });
            leaveChannelButton.onclick = async () => {
                Client.send({
                    command: 'channel-leave',
                    id: Client.getCommandId(),
                    channelName: name
                });
                if (document.getElementById('chatTitleText')!.textContent == name) {
                    setChatBoxToChannel('MAIN CHANNEL', Client);
                }
            }
        }
    })
    const createChannel = addHTMLElement('p', channelPopupSpan!, { className: 'popupValueText', textContent: '+' });
    createChannel.onclick = async () => {
        const modal = document.getElementById('modalCreateChannel');
        const span = document.getElementById('closeButtonCreateChannel');
        const button = document.getElementById('createChannelButton');
        const createChannelTextBox = document.getElementById('modalTextBoxCreateChannel');
        modal!.style.display = 'block';
        createChannelTextBox!.focus();
        span!.onclick = () => {
            modal!.style.display = 'none';
        }
        button!.onclick = async () => {
            const channelName = (createChannelTextBox as HTMLInputElement).value;
            if (Client.allChannels.has(channelName)) {
                await new Promise<never>(() => alert('This channel already exist!'));
            }
            else if (3 < channelName.length && channelName.length < 16 &&
                /[abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#]/.test(channelName) && channelName.charAt(0) == '#') {
                Client.send({
                    command: 'channel-create',
                    id: Client.getCommandId(),
                    channelName: channelName,
                    properties: {
                        saveHistory: true, // TODO not used yet by us
                        messageOutside: false, // TODO also not used yet
                        publicKey: Math.random().toString(36).slice(2)
                    }
                });
                (document.getElementById('modalTextBoxCreateChannel') as HTMLInputElement)!.value = '';
                modal!.style.display = 'none';
            }
            else {
                await new Promise<never>(() => alert('Please enter a correct channelname!'));
            }

        }
    }
    const joinChannel = addHTMLElement('p', channelPopupSpan!, { className: 'popupValueText', textContent: 'Join New Channel' })
    joinChannel.onclick = async () => {
        const modal = document.getElementById('modalJoinChannel');
        const span = document.getElementById('closeButtonJoinChannel');
        const button = document.getElementById('joinChannelButton');
        const dropDown = document.getElementById('modalDropDownJoinChannel');

        // add all options to dropdown menu
        const x: number = (dropDown as HTMLSelectElement).options.length - 1;
        let i;
        for (i = x; i >= 0; i--) {
            (dropDown as HTMLSelectElement).options[i].remove();
        }
        // eslint-disable-next-line no-unused-vars
        Client.allChannels.forEach((_, name) => {
            if ((name.substr(0, 6) != '#table') && ((name.substr(0, 6) != '#world'))) {
                addHTMLElement('option', dropDown!, { value: name, text: name })
            }
        })

        modal!.style.display = 'block';
        span!.onclick = () => {
            modal!.style.display = 'none';
        }
        button!.onclick = async () => {
            const name = ((document.getElementById('modalDropDownJoinChannel') as HTMLInputElement).value);

            if (Client.allChannels.size == 0) {
                await new Promise<never>(() => alert('There are currently no channels that you can join!'));
            }
            if (Client.channels.has(name)) {
                await new Promise<never>(() => alert('You are already in this channel!'));
            }
            else {
                Client.send({
                    command: 'channel-join',
                    id: Client.getCommandId(),
                    channelName: name
                });
            }
            modal!.style.display = 'none';
        }
    }
}

/**
 * Init the sound settings popupSpan element
 */
function makeSettings() {
    const settingsPopupSpan = document.getElementById('settingsPopupSpan');
    settingsPopupSpan!.innerHTML = '';

    addHTMLElement('p', settingsPopupSpan!, { id: 'fx', innerHTML: 'FX   :<input type="range" min="1" max="100" value="50" id="fx">' });
    addHTMLElement('p', settingsPopupSpan!, { id: 'music', innerHTML: 'Music:<input type="range" min="1" max="100" value="50" id="music">' })
}

function setChatBoxToChannel(channelName: string, Client: Client) {
    document.getElementById('chatBox')!.style.display = 'none';
    // eslint-disable-next-line no-unused-vars
    Client.allChannels.forEach((_, name) => {
        const messagesDivToClear = document.getElementById(`messagesDiv${name}`);
        if (messagesDivToClear !== null) {
            messagesDivToClear!.style.display = 'none';
        }
    })
    // eslint-disable-next-line no-unused-vars
    Client.directory.forEach((name, _) => {
        const messagesDivToClear = document.getElementById(`messagesDiv${name}`);
        if (messagesDivToClear !== null) {
            messagesDivToClear!.style.display = 'none';
        }
    })

    const title = document.getElementById('chatTitleText');
    const textBox = document.getElementById('textBox');
    title!.textContent = channelName;

    if (channelName == 'MAIN CHANNEL') {
        (<HTMLInputElement>textBox).placeholder = 'What is on your mind?';
        messageToSend = '/shout-to-all '
        const messagesDiv = document.getElementById('chatBox');
        messagesDiv!.style.display = 'list-item';
    }
    else {
        (<HTMLInputElement>textBox).placeholder = `send something on channel ${channelName}`;
        messageToSend = `/send-message-on-channel ${channelName} `;
        const messagesDiv = document.getElementById(`messagesDiv${channelName}`);
        messagesDiv!.style.display = 'list-item';
    }
}

function setChatBoxToNick(nickName: string, fingerprint: string, Client: Client) {
    document.getElementById('chatBox')!.style.display = 'none';
    // eslint-disable-next-line no-unused-vars
    Client.allChannels.forEach((_, name) => {
        const messagesDivToClear = document.getElementById(`messagesDiv${name}`);
        if (messagesDivToClear !== null) {
            messagesDivToClear!.style.display = 'none';
        }
    })
    // eslint-disable-next-line no-unused-vars
    Client.directory.forEach((name, _) => {
        const messagesDivToClear = document.getElementById(`messagesDiv${name}`);
        if (messagesDivToClear !== null) {
            messagesDivToClear!.style.display = 'none';
        }
    })

    const title = document.getElementById('chatTitleText');
    const textBox = document.getElementById('textBox');

    title!.textContent = nickName;
    (<HTMLInputElement>textBox).placeholder = `send something to ${nickName}`;

    if (Client.nick == nickName) {
        messageToSend = '/shout-to-me ';
    }
    else {
        messageToSend = `/send-direct-message ${fingerprint} `;
    }

    const messagesDiv = document.getElementById(`messagesDiv${nickName}`);
    messagesDiv!.style.display = 'list-item';
}

export { initCreateChannelModal, initJoinChannelModal, refreshFriendlist, refreshChannelList, makeSettings }