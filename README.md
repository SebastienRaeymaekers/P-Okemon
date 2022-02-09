
<!-- PROJECT LOGO -->
<br />
<p align="center">
  <h1 align="center">Bachelors thesis project</h1>

  <p align="center">
    A web application where you can login to a virtual world with your character and explore the different rooms and sub-worlds. Has a chat system which lets you send private messages to a certain user, to a group of users of which the characters sit around the same table or send public messages to everyone in the (sub-)world or room you are in.
    <br />
    <br />
  </p>
</p>

In cooperation with Miguel Quirijnen, Arne Vermeulen, Ewald Verfaillie, Nick Van Dun, William Vanden Daele, Elien Vandermaesen.
Made in May 2021.


## CHAT FUNCTIONALITIES

## new app


Start the server by running `npm run dev:server` or clicking the Play icon in the NPM Scripts view in the VSCode Explorer sidebar.

Debug the server by putting a breakpoint in any of the TypeScript source files and choosing Start Debugging in the Run menu.

Run the (non-interactive) CLI client by running `npm run dev:client`.

Run the (interactive) browser client by running `npm run build-browser`, then starting the server, and then, when that is finished, pointing your favorite web browser at https://localhost:3000/ . (Note: since the server is self-signed, some browsers refuse to load this page. For Chrome, you need to navigate to `chrome://flags/#allow-insecure-localhost` and enable the *Allow insecure localhost* setting.)


## Generating you private keys

To access use the application you have to generate your keys. Do this by executing:

```console
$ npm run generate_keys
```

ATTENTION: it is important you specify a common name.
E.g. if you set the common name to 'localhost', then you can connect to the server with the url https://localhost:<port>

## Running tests

To run the tests for this chat application:

```console
$ npm run test
...running all the tests...
```

## Starting servers and clients

You can start a new client or server by executing the following commands in your terminal (be sure that you're located in the root directory of the application):

for standard setup use:

```console
$ npm run run_server
...starting a new server...
$ npm run run_client
...starting a new client...
```

for P2P use:

```console
$ npm run run_p2p
...starting a new server...
$ npm run run_p2p_second
...starting a second server...
$ npm run run_p2p_third
...starting a third server...
$ npm run run_p2p_client
...starting a new client...
$ npm run run_p2p_client2
...starting a new client...
```

## Autocompletion

By pressing `<tab>` you can use the autocomplete fuctionality. When in the command line, your words will be completed based on the selected language. This also works for commands known to the application using `'/' `.

! All commands are in lowercase and will be autocompleted in lowercase.

## Default Commands

To send a message to yourself:

```console
$ /shout-to-me <yourmessage>
```

To send a message to all the clients on your server use:

```console
$ /shout-to-all <yourmessage>
```

Both shout-to-all and shout-to-me provide a color functionality, this can be used in the following way:

```console
$ /shout-to-all <color> <yourmessage>
```

To learn more about which commands are available use 'help':

```console
$ /help
```

To display all connections (nick & fingerprint) in your addressbook:

```console
$ /print-directory
```

To change the nickname of a user in your directory:

```console
$ /change-nickname-in-directory <fingerprint> <new-nickname>
```

To show te URL of the server you're currently connected to:

```console
$ /show-url
```

To show a map that contains all your contacts with their public keys:

```console
$ /print-public-keys
```

## Anonymous Commands

Send a message as an anonymous user to the given fingerprint:

```console
$ /send-as-anonymous <text> <fingerprint-of-receiver>
```

Send an encrypted message to everyone, only the (optional) receiver can decrypt it:

```console
$ /send-to-anonymous <text> <fingerprint-of-receiver>
```

## Channel Commands

Users can particapte in multiple `channels`. By joining or creating a server you can send messages to a select group of users instead of broadcasting it.

To send a request to the server to create a channel, use (you'll get an error when the name already exists):

```console
$ /create-channel <channelname>
```

Join a channel with a given name:

```console
$ /join-channel <channelname>
```

Leave a channel with a given name:

```console
$ /leave-channel <channelname>
```

To get a list with all the available channels use:

```console
$ /get-allchannels
```

Returns the last messages sent on the given channel:

```console
$ /get-channel-history <channelname>
```

If you want to send a message on a specific channel use this command:

```console
$ /send-message-on-channel <channelname> <message>
```

## Starting chatbots

You can start a new chatbot by executing the following command in a terminal:

use:

```console
$ /npm run run_<bottype>
...starting a new bot of type <bottype>...
```

Currently there are three bottypes: elizabot, rotationbot and magic8bot. To start a chatbot with a custom nickname and/or owner, you can call the following:

use:

```console
$ npm run run_chatbot <--bottype [--botnick=nick] [--botowner=owner] [--furtherargs=args]>
```

An example, to call a rotationbot with nickname Rotati-o, owner client1 and number to rotate by 6:

```console
$ npm run run_chatbot --rotationbot --rotationnick='Rotati-o' --rotationowner='client1' --rotationnumber=6
```

All possible options can be found in bin/botconfig.json or by calling node index.js -h in directory dist/ (after running "npm run build").

It is also possible to call bots using the CLI, this way there is no need to open a separate terminal.  
A client can call the following commands to start chatbots in the CLI, these bots will only respond to the calling client:

```console
$ /start-eliza <elizanick>
$ /start-magic8 <magic8nick>
$ /start-rotation <rotationnick> <rotationnumber>
```

## Starting filters

You can add filters that filter your messages before you send them.
Filters are stored in a stack, filtering messages in the order they were added in.
The CLI-commands used for filters are the following:

To list all available filters:

```console
$ /get-all-filters
```

To display your filter stack:

```console
$ /get-my-filters
```

To add a filter of the given type to your stack:

```console
$ /add-filter <type>
```

To remove the top filter from your stack:

```console
$ /remove-filter
```
