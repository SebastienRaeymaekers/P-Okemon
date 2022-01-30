import { Client } from '../client.js';
import { tilePaths, spritePaths } from './image_paths';
import { soundEffectPaths, soundTrackPaths } from './audio_paths';
import { ChannelProperties } from '../protocol.js';
// import * as ph from 'pathfinding';
const PF = require('pathfinding'); // eslint-disable-line no-eval
import { Animation } from './animation';

const unpassableblocks = ['wa1', 'ta1', 'mg1', 'mg2', 'ta2', 'bw1', 'iw1', 'iw2'];

export class World {

    private tiles: string[][];
    private canvas: HTMLCanvasElement;
    private context: CanvasRenderingContext2D;
    private canvasWidth_default = 0;
    private canvasHeight_default = 0;

    private mapWidth;
    private mapHeight;

    public userPos: number[];
    //    private userMovingDirection: number[];
    private userOrientation; // 1 -> North, 2 -> East, 3 -> South, 4 -> West
    public locationClients: Map<string, { nick: string, location: number[], orientation: number, spriteNumber: number }>;
    private aninimation_Canvas = 0;
    private tileSize;
    private isMoving;

    private tileSprites: Map<string, HTMLImageElement>;
    private userSprites: Map<string, HTMLImageElement>;
    private soundEffects: Map<string, HTMLAudioElement>; // map that maps the name of a sound effect to its corresponding HTMLAudioElement.
    private soundTracks: Map<string, HTMLAudioElement>; // map that maps the name of a sound effect to its corresponding HTMLAudioElement.
    private fxVolume: number;
    private musicVolume: number;
    private animation: Animation;

    public gpsPath: number[][];

    private client: Client;

    private fovX_default = 17;
    private fovY_default = 11;
    private fovX
    private fovY

    private lockKeys = false;
    public justChangedWorld = false;
    public gpsTarget: { nick: string, location: number[] } = { nick: '', location: [0, 0] };
    public gpsActive = false;

    /**
     * TODO checking valid canvas, valid tiles... 
     */
    constructor(tiles: string[][], userPos: number[], userOrientation: number, locationClients: Map<string, { nick: string, location: number[], orientation: number, spriteNumber: number }>,
        canvas: HTMLCanvasElement, context: CanvasRenderingContext2D, client: Client) {

        this.client = client;
        this.tileSprites = this.loadTileSprites();
        this.userSprites = this.loadUserSprites();
        this.soundEffects = this.loadSoundEffects();
        this.soundTracks = this.loadSoundTracks();
        this.fxVolume = 50;
        this.musicVolume = 50;
        this.tiles = tiles;
        this.canvas = canvas;
        this.context = context;
        this.mapWidth = tiles[0].length;
        this.mapHeight = tiles.length;
        this.userPos = userPos;
        this.userOrientation = userOrientation;
        this.gpsPath = [];

        this.canvasWidth_default = canvas.width;
        this.canvasHeight_default = canvas.height;

        this.fovX = Math.min(this.fovX_default, this.mapWidth); // change the fov if the map is wider than the default fov
        this.fovY = Math.min(this.fovY_default, this.mapHeight); // change the fov if the map is higher than the default fov
        this.tileSize = Math.min(canvas.width / this.fovX, canvas.height / this.fovY); // as big as possible so the map still fits the canvas
        canvas.width = this.tileSize * this.fovX; // rescale the canvas in case the map is less wide than the canvas
        canvas.height = this.tileSize * this.fovY; // rescale the canvas in case the map is less high than the canvas

        // this.user = otherUsers.get(this.client.fingerPrint)!;
        // this.otherUsers = otherUsers;
        // this.futureUserPos = otherUsers.get(this.client.fingerPrint)!.location;
        this.locationClients = locationClients;
        this.isMoving = false;
        this.initializeMap();
        this.animation = new Animation(this.getUserSprite(userOrientation, this.client.spriteNumber, 'animate'), 50, 3, this.tileSize, this.tileSize);
        this.setAllClients(this.locationClients);

        let inTextBox = false;
        document.onkeydown = (e) => {
            if (!this.justChangedWorld) {
                document.getElementById('textBox')!.addEventListener('keydown', function () { inTextBox = true });
                if (document.getElementById('modalCreateChannel')!.style.display == 'block') {
                    inTextBox = true
                }
                if (document.getElementById('modalJoinChannel')!.style.display == 'block') {
                    inTextBox = true
                }
                if (this.client.inMinigame) {
                    inTextBox = true
                }
                if (!inTextBox) this.onKeyDown(e)
                inTextBox = false;

                this.setGPStoUser(this.gpsTarget.nick);
            }
        } // TODO make this cleaner

        this.setupSliders();
        this.playMusic('song1');
    }

    activateGPStoUser(nick: string) {
        const fingerprint = [...this.client.directory.entries()]
            .filter(({ 1: v }) => v === nick)
            .map(([k]) => k);

        if (this.client.locationOfClients.size > 1) {
            const otherClient = this.client.locationOfClients.get(fingerprint[0])!;
            this.gpsTarget = { nick: nick, location: otherClient.location }
            this.gpsActive = true;
            this.setGPStoUser(this.gpsTarget.nick);
        }
    }

    deactivateGPStoUser() {
        this.gpsTarget = { nick: '', location: [0, 0] }
        this.gpsActive = false;
        this.gpsPath = [];
    }

    setGPStoUser(nick: string) { // TODO check what happens with multiple socket for one user.
        // get fingerprint from clients directory using nick
        // console.log(this.client.directory);
        const fingerprint = [...this.client.directory.entries()]
            .filter(({ 1: v }) => v === nick)
            .map(([k]) => k);

        if (this.client.nick === nick || fingerprint == [] || this.client.locationOfClients.size < 1) {
            this.gpsTarget = { nick: '', location: [0, 0] }
            this.gpsActive = false;
            this.gpsPath = [];
            return;
        }

        if (this.client.locationOfClients.size > 1) {
            const otherClient = this.client.locationOfClients.get(fingerprint[0])!;
            if (otherClient.world === this.client.worldName) { // if location if other user is in same world.
                const otherClientLocation = otherClient.location;
                this.setGPStoLocation(otherClientLocation[0], otherClientLocation[1]);
            } else if (this.client.worldName === 'world1') { // else if you are in central room (= world5), location is in other world and gps is pointed toward door to other world.
                this.setGPStoLocation(this.client.doorsMap.get(otherClient.world)![0], this.client.doorsMap.get(otherClient.world)![1]);
            } else {
                this.setGPStoLocation(this.client.doorsMap.get('world1')![0], this.client.doorsMap.get('world1')![1]);
                console.log('in other world');
            }
        }
    }

    setGPStoLocation(xCoord: number, yCoord: number) {
        // make pf grid
        const grid = new PF.Grid(this.tiles[0].length, this.tiles.length);
        for (let i = this.tiles.length - 1; i >= 0; i--) {
            for (let j = 0; j < this.tiles[i].length; j++) {
                if (unpassableblocks.includes(this.tiles[i][j])) {
                    grid.setWalkableAt(j, i, false);
                }
            }
        }

        const finder = new PF.AStarFinder();
        const path = finder.findPath(this.client.world!.userPos[0], this.client.world!.userPos[1], xCoord, yCoord, grid);
        console.log(path);
        if (Math.abs(path[path.length - 1][0] - this.userPos[0]) > 0 || Math.abs(path[path.length - 1][1] - this.userPos[1]) > 0) {
            path.splice(-1); path.shift();
            this.gpsPath = path;
        } else this.gpsPath = [];
        console.log(this.gpsPath);
    }

    drawGpsPath() {
        for (let i = 0; i < this.gpsPath.length; i++) {
            const sprite = this.getTerrainSprite('flower');
            const pos = this.getDrawingPos(this.gpsPath[i]);
            if (pos != null) {
                const [, , leftedge, rightedge, topedge, bottomedge] = this.getTopLeftInFOV();

                switch (this.locationClients.get(this.client.fingerPrint)!.orientation) {  // 1 -> North, 2 -> East, 3 -> South, 4 -> West
                    case 1:
                        this.context.drawImage(sprite, pos[0] * this.tileSize, (pos[1] + ((this.aninimation_Canvas * topedge * bottomedge) / 100)) * this.tileSize, this.tileSize, this.tileSize);
                        break;
                    case 2:
                        this.context.drawImage(sprite, (pos[0] + (-1 * (this.aninimation_Canvas * rightedge * leftedge) / 100)) * this.tileSize, pos[1] * this.tileSize, this.tileSize, this.tileSize);
                        break;
                    case 3:
                        this.context.drawImage(sprite, pos[0] * this.tileSize, (pos[1] + (-1 * (this.aninimation_Canvas * bottomedge * topedge) / 100)) * this.tileSize, this.tileSize, this.tileSize);
                        break;
                    case 4:
                        this.context.drawImage(sprite, (pos[0] + ((this.aninimation_Canvas * leftedge * rightedge) / 100)) * this.tileSize, pos[1] * this.tileSize, this.tileSize, this.tileSize);
                        break;
                }
            }
        }
    }

    /**
     * Setup the on input methods for the sound sliders.
     */
    private setupSliders() {
        const sliderFX = <HTMLInputElement>document.getElementById('fx');
        const sliderMusic = <HTMLInputElement>document.getElementById('music');
        sliderFX.oninput = e => {
            const newValue = Number((<HTMLTextAreaElement>e.target)!.value);
            for (const [, value] of this.soundEffects) {
                value.volume = (newValue / 100) * 0.90;
            }
            this.fxVolume = newValue;
        };
        sliderMusic.oninput = e => {
            const newValue = Number((<HTMLTextAreaElement>e.target)!.value);
            for (const [, value] of this.soundTracks) {
                value.volume = (newValue / 100) * 0.05;
            }
            this.musicVolume = newValue;
        };
    }

    /**
     * Method of loading in images using preloaded images in browser_main.initImages()
     * Assumes the images are loaded in properly in browser_main
     */
    private loadTileSprites() {
        const tileSprites = new Map();
        for (const [id,] of tilePaths) {
            tileSprites.set(id, document.getElementById(id));
        }

        return tileSprites;
    }

    /**
     * Method of loading in images using preloaded images in browser_main.initImages()
     * Assumes the images are loaded in properly in browser_main
     */
    private loadUserSprites() {
        const userSprites = new Map();
        for (const [id,] of spritePaths) {
            userSprites.set(id, document.getElementById(id));
        }

        return userSprites;
    }

    /**
     * Get the HTMLAudioElement from the map given its name and play it.
     * @param audioFile 
     */
    playSoundEffect(audioFile: string) {
        const audio = this.soundEffects.get(audioFile)!;
        audio.volume = (this.fxVolume / 100) * 0.90;
        audio.play();
    }

    /**
     * Get the HTMLAudioElement from the map given its name and play it.
     * @param audioFile 
     */
    playMusic(audioFile: string) {
        const audio = this.soundTracks.get(audioFile)!;
        audio.volume = (this.musicVolume / 100) * 0.05;
        audio.play();
        audio.loop = true;
    }

    /**
     * Fills a map that maps that map a name of an effect to its corresponding HTMLAudioElement given in soundEffectPaths.
     * @returns 
     */
    loadSoundEffects(): Map<string, HTMLAudioElement> {
        const soundEffects = new Map();
        for (const [id, path] of soundEffectPaths) {
            const soundEffect = new Audio(path);
            soundEffects.set(id, soundEffect);
        }
        return soundEffects;
    }

    /**
     * Fills a map that maps that map a name of an effect to its corresponding HTMLAudioElement given in soundTrackPaths.
     * @returns 
     */
    loadSoundTracks(): Map<string, HTMLAudioElement> {
        const soundTracks = new Map();
        for (const [id, path] of soundTrackPaths) {
            const soundTrack = new Audio(path);
            soundTracks.set(id, soundTrack);
        }
        return soundTracks;
    }

    /**
     * Draw map using their location, orientation en sprite number if it's in the user's field of view
     */

    private drawCharachter(nick: string, spritenumber: number, orientation: number, location: number[], animationprogress: number, ownAnimationProgress: number, ownOrientation: number) { // map(fingerprint, [spritenumber, orientation, location, animationprogress])
        const drawingPos = this.getDrawingPos(location);
        this.context.font = '30px Arial';
        if (!drawingPos) return;
        const [, , leftedge, rightedge, topedge, bottomedge] = this.getTopLeftInFOV();
        // the moving client is rotating
        if (animationprogress == 0) {
            const sprite = this.getUserSprite(orientation, spritenumber, 'static');
            switch (ownOrientation) {  // 1 -> North, 2 -> East, 3 -> South, 4 -> West
                case 1:
                    this.context.fillText(nick, drawingPos[0] * this.tileSize, (drawingPos[1] + (ownAnimationProgress * bottomedge * topedge) / 100) * this.tileSize, this.tileSize);
                    this.context.drawImage(sprite, drawingPos[0] * this.tileSize, (drawingPos[1] + (ownAnimationProgress * bottomedge * topedge) / 100) * this.tileSize, this.tileSize, this.tileSize);
                    break;
                case 2:
                    this.context.fillText(nick, (drawingPos[0] + (-1 * (ownAnimationProgress * rightedge * leftedge) / 100)) * this.tileSize, drawingPos[1] * this.tileSize, this.tileSize);
                    this.context.drawImage(sprite, (drawingPos[0] + (-1 * (ownAnimationProgress * rightedge * leftedge) / 100)) * this.tileSize, drawingPos[1] * this.tileSize, this.tileSize, this.tileSize);
                    break;
                case 3:
                    this.context.fillText(nick, drawingPos[0] * this.tileSize, (drawingPos[1] + (-1 * (ownAnimationProgress * bottomedge * topedge) / 100)) * this.tileSize, this.tileSize);
                    this.context.drawImage(sprite, drawingPos[0] * this.tileSize, (drawingPos[1] + (-1 * (ownAnimationProgress * bottomedge * topedge) / 100)) * this.tileSize, this.tileSize, this.tileSize);
                    break;
                case 4:
                    this.context.fillText(nick, (drawingPos[0] + ((ownAnimationProgress * leftedge * rightedge) / 100)) * this.tileSize, drawingPos[1] * this.tileSize, this.tileSize);
                    this.context.drawImage(sprite, (drawingPos[0] + ((ownAnimationProgress * leftedge * rightedge) / 100)) * this.tileSize, drawingPos[1] * this.tileSize, this.tileSize, this.tileSize);
                    break;
            }

        }
        // the moving client is doing a movement
        else {
            const spriteAnimation = this.getUserSprite(orientation, spritenumber, 'animate');
            this.animation.setSprite(spriteAnimation);
            this.animation.update();
            if (ownAnimationProgress != 0) {
                switch (ownOrientation) {
                    case 1:
                        drawingPos[1] += (ownAnimationProgress * topedge * bottomedge) / 100;
                        break;
                    case 2:
                        drawingPos[0] -= (ownAnimationProgress * rightedge * leftedge) / 100;
                        break;
                    case 3:
                        drawingPos[1] -= (ownAnimationProgress * topedge * bottomedge) / 100;
                        break;
                    case 4:
                        drawingPos[0] += (ownAnimationProgress * rightedge * leftedge) / 100;
                        break;

                }
            }
            switch (orientation) {  // 1 -> North, 2 -> East, 3 -> South, 4 -> West
                case 1:
                    this.context.fillText(nick, drawingPos[0] * this.tileSize, (drawingPos[1] - animationprogress / 100) * this.tileSize, this.tileSize);
                    this.animation.draw(this.context, drawingPos[0] * this.tileSize, (drawingPos[1] - animationprogress / 100) * this.tileSize);
                    break;
                case 2:
                    this.context.fillText(nick, (drawingPos[0] + animationprogress / 100) * this.tileSize, drawingPos[1] * this.tileSize, this.tileSize);
                    this.animation.draw(this.context, (drawingPos[0] + animationprogress / 100) * this.tileSize, drawingPos[1] * this.tileSize);
                    break;
                case 3:
                    this.context.fillText(nick, drawingPos[0] * this.tileSize, (drawingPos[1] + animationprogress / 100) * this.tileSize, this.tileSize);
                    this.animation.draw(this.context, drawingPos[0] * this.tileSize, (drawingPos[1] + animationprogress / 100) * this.tileSize);
                    break;
                case 4:
                    this.context.fillText(nick, (drawingPos[0] - animationprogress / 100) * this.tileSize, drawingPos[1] * this.tileSize, this.tileSize);
                    this.animation.draw(this.context, (drawingPos[0] - animationprogress / 100) * this.tileSize, drawingPos[1] * this.tileSize);
                    break;
            }
        }
    }

    /**
     * Return the users's sprite using it's orientation and sprite number
     */
    public getUserSprite(orientation: number, spritenumber: number, type: string) {

        if (type == 'static') {
            const fullstring = 'sprite' + spritenumber.toString() + '-' + this.getOrientationMapping(orientation); // TODO spritenumber fatsoenlijk laten doorsturen.
            return this.userSprites.get(fullstring)!;
        } else {
            const fullstring = 'sprite' + spritenumber.toString() + '-' + this.getOrientationMapping(orientation) + '-walk'; // TODO spritenumber fatsoenlijk laten doorsturen.
            return this.userSprites.get(fullstring)!;
        }

    }

    /**
     * Map an orientation as numerical value to a character representing it as
     *      1 -> 'n'
     *      2 -> 'e'
     *      3 -> 's'
     *      4 -> 'w'
     */
    private getOrientationMapping(orientation: number) {
        switch (orientation) {
            case 1:
                return 'n';
            case 2:
                return 'e';
            case 3:
                return 's';
            case 4:
                return 'w';
            default:
                return;
        }

    }

    /**
     * Draw the map
     * TODO maybe move FOV checks in here instead of in drawTile and drawCharacter?
     */
    private initializeMap() {
        for (let x = 0; x < this.mapWidth; x++) {
            for (let y = 0; y < this.mapHeight; y++) {
                this.drawTile(x, y, 0, 1);
                // if(this.gpsPath.includes([x,y])){
                //     const drawingPos = this.getDrawingPos([x, y]);
                //     if (!drawingPos) return;
                //     const sprite = this.getTerrainSprite('flower');
                //     this.context.drawImage(sprite, drawingPos[0] * this.tileSize, drawingPos[1] * this.tileSize, this.tileSize, this.tileSize);
                // }
            }
        }
    }

    /**
     * Draw the given tile if it's in the FOV
     */
    private drawTile(x: number, y: number, animationprogress: number, orientation: number) {
        const drawingPos = this.getDrawingPos([x, y]);
        if (!drawingPos) return;
        const sprite = this.getTerrainSprite(this.tiles[y][x])
        const [, , leftedge, rightedge, topedge, bottomedge] = this.getTopLeftInFOV();

        switch (orientation) {  // 1 -> North, 2 -> East, 3 -> South, 4 -> West
            case 1:
                this.context.drawImage(sprite, drawingPos[0] * this.tileSize, (drawingPos[1] + ((animationprogress * topedge * bottomedge) / 100)) * this.tileSize, this.tileSize, this.tileSize);
                break;
            case 2:
                this.context.drawImage(sprite, (drawingPos[0] + (-1 * (animationprogress * rightedge * leftedge) / 100)) * this.tileSize, drawingPos[1] * this.tileSize, this.tileSize, this.tileSize);
                break;
            case 3:
                this.context.drawImage(sprite, drawingPos[0] * this.tileSize, (drawingPos[1] + (-1 * (animationprogress * bottomedge * topedge) / 100)) * this.tileSize, this.tileSize, this.tileSize);
                break;
            case 4:
                this.context.drawImage(sprite, (drawingPos[0] + ((animationprogress * leftedge * rightedge) / 100)) * this.tileSize, drawingPos[1] * this.tileSize, this.tileSize, this.tileSize);
                break;
        }
    }

    /**
     * Return the terraintype corresponding to the given terrain id, or "..." (formerly missingImage) if it does not exist.
     */
    public getTerrainSprite(terrainType: string) {
        if (!(this.tileSprites.has(terrainType))) terrainType = '...';
        return this.tileSprites.get(terrainType)!;
    }

    /**
     * Gets fired when the user presses a key in the document.
     * Moves the user according to the key press, if it was an arrow key
     * TODO make this only fire when the canvas has focus
     */
    private onKeyDown(event: KeyboardEvent) { // TODO een canmove, dus als ge nog nie volledig bent bewoge of als ge tege een muur staat
        if (!this.isArrowKey(event)) return;
        if (this.lockKeys) return;
        if (this.isMoving) return;
        this.userPos = this.locationClients.get(this.client.fingerPrint)!.location

        switch (event.key) {
            default:
                throw new Error('No such orientation');
            case 'ArrowUp':
                event.preventDefault();
                this.moveIndirection(1, [0, -1]);
                break;
            case 'ArrowRight':
                event.preventDefault();
                this.moveIndirection(2, [1, 0]);
                break;
            case 'ArrowDown':
                event.preventDefault();
                this.moveIndirection(3, [0, 1]);
                break;
            case 'ArrowLeft':
                event.preventDefault();
                this.moveIndirection(4, [-1, 0]);
                break;
        }
        this.isMoving = true;
        this.client.updateUserInWorld(this.userPos, this.userOrientation);
        Math.random() > 0.5 ? this.playSoundEffect('Footstep1') : this.playSoundEffect('Footstep2');
    }

    public moveIndirection(direction: number, movingDirection: [number, number]) {
        if (this.userOrientation != direction) {
            this.userOrientation = direction;
            return;
        }
        if (unpassableblocks.includes(this.tiles[this.mod((this.userPos[1] + movingDirection[1]), this.mapHeight)][this.mod((this.userPos[0] + movingDirection[0]), this.mapWidth)])) {
            return;
        }
        this.userPos[0] = this.mod((this.userPos[0] + movingDirection[0]), this.mapWidth);
        this.userPos[1] = this.mod((this.userPos[1] + movingDirection[1]), this.mapHeight);
        return;
    }

    /**
     * checks the given range for enverimental actions
     * 
     * @param range the size of the circle of your surounding
     */
    public CheckEnvirement(xCoordinate: number, yCoordinate: number, range: number): void {
        // initialize all the interactive elements on the map
        // TODO: kan in constructor worden gezet
        const interactives = new Map();
        interactives.set('mg1', 'snake');
        interactives.set('mg2', 'pong');
        interactives.set('ta2', 'table');
        interactives.set('dc2', 'door');
        let dX = -range;
        while (dX <= range) {
            if (xCoordinate + dX < 0 || xCoordinate + dX > this.tiles.length - 1) {
                dX += 1;
                continue;
            }

            let dY = -range
            while (dY <= range) {
                if (yCoordinate + dY < 0 || yCoordinate + dY > this.tiles.length - 1) {
                    dY += 1
                    continue;
                }
                if (interactives.has(this.tiles[xCoordinate + dX][yCoordinate + dY])) {
                    const event = interactives.get(this.tiles[xCoordinate + dX][yCoordinate + dY])
                    switch (event) {
                        case 'snake':
                            if (dX == 1 || dY == 1 || dX == -1 || dY == -1) this.client.startMinigame('snake');
                            if (dX == 2 || dY == 2 || dX == -2 || dY == -2) this.client.leaveMinigame();
                            break;
                        case 'pong':
                            if (dX == 1 || dY == 1 || dX == -1 || dY == -1) this.client.startMinigame('pong');
                            if (dX == 2 || dY == 2 || dX == -2 || dY == -2) this.client.leaveMinigame();
                            break;
                        case 'table':
                            if (dX == 2 || dY == 2 || dX == -2 || dY == -2) this.leaveTable(xCoordinate + dX, yCoordinate + dY);
                            else if (dX == 1 || dY == 1 || dX == -1 || dY == -1) this.joinTable(xCoordinate + dX, yCoordinate + dY);
                            break;
                        case 'door':
                            if (dX == 0 && dY == 0 && !this.justChangedWorld) {
                                console.log('stepped on door');
                                this.justChangedWorld = true;
                                this.client.changeWorld(xCoordinate, yCoordinate);
                                // this.stopGPS();
                            }
                            break;
                    }
                }
                dY += 1
            }
            dX += 1
        }
    }

    joinWorldChannel(worldName: string): void {
        const channelName = '#' + worldName;
        if (this.client.channels.has(channelName)) return;

        if (this.client.allChannels.has(channelName)) {
            this.client.send({
                id: this.client.getCommandId(),
                command: 'channel-join',
                channelName: channelName,
            });
        }
        else {
            const Channelvalues: ChannelProperties = {
                saveHistory: true,
                messageOutside: true
            }

            this.client.send({
                id: this.client.getCommandId(),
                command: 'channel-create',
                channelName: channelName,
                properties: Channelvalues,
            });
        }
    }

    leaveWorldChannel(worldName: string): void {
        const channelName = '#' + worldName;
        if (this.client.channels.has(channelName)) {
            this.client.send({
                id: this.client.getCommandId(),
                command: 'channel-leave',
                channelName: channelName
            });
        }
    }

    joinTable(Xcoordinate: number, YCoordinate: number): void {
        const channelName = '#table' + Xcoordinate.toString() + YCoordinate.toString();
        if (this.client.channels.has(channelName)) return;

        if (this.client.allChannels.has(channelName)) {
            this.client.send({
                id: this.client.getCommandId(),
                command: 'channel-join',
                channelName: channelName,
            });
        }
        else {
            const Channelvalues: ChannelProperties = {
                saveHistory: true,
                messageOutside: true
            }

            this.client.send({
                id: this.client.getCommandId(),
                command: 'channel-create',
                channelName: channelName,
                properties: Channelvalues,
            });
        }
    }

    leaveTable(Xcoordinate: number, YCoordinate: number): void {
        const channelName = '#table' + Xcoordinate.toString() + YCoordinate.toString();
        if (this.client.channels.has(channelName)) {
            this.client.send({
                id: this.client.getCommandId(),
                command: 'channel-leave',
                channelName: channelName
            });
        }
    }

    /**
     * Set the world's tiles
     * TODO check for faulty tiles (can be done in client too)
     * TODO weird place for this function
     */
    public setTiles(tiles: string[][]): void {

        this.tiles = tiles;
        this.mapHeight = tiles.length;
        this.mapWidth = tiles[0].length;

        this.canvas.width = this.canvasWidth_default; // reset the canvas to the originial size
        this.canvas.height = this.canvasHeight_default;

        this.fovX = Math.min(this.fovX_default, this.mapWidth); // change the fov if the map is wider than the default fov
        this.fovY = Math.min(this.fovY_default, this.mapHeight); // change the fov if the map is higher than the default fov
        this.tileSize = Math.min(this.canvas.width / this.fovX, this.canvas.height / this.fovY); // as big as possible so the map still fits the canvas
        this.canvas.width = this.tileSize * this.fovX; // rescale the canvas in case the map is less wide than the canvas
        this.canvas.height = this.tileSize * this.fovY; // rescale the canvas in case the map is less high than the canvas
        this.animation = new Animation(this.getUserSprite(this.userOrientation, this.client.spriteNumber, 'animate'), 50, 3, this.tileSize, this.tileSize);

        this.playMusic('song1');
    }

    /**
     * draws the map with all the clients and sets this.locationClinets
     * 
     * @param users //list of all the users with values connected to the server
     */
    public setAllClients(users: Map<string, { nick: string, location: number[], orientation: number, spriteNumber: number }>): void {
        this.locationClients = users;
        for (const [, user] of users) {
            const drawingPos = this.getDrawingPos(user.location);
            if (!drawingPos) return;
            const sprite = this.getUserSprite(user.orientation, user.spriteNumber, 'static');
            this.context.drawImage(sprite, drawingPos[0] * this.tileSize, drawingPos[1] * this.tileSize, this.tileSize, this.tileSize);
        }
        const [locationClientX, locationClientY] = this.locationClients.get(this.client.fingerPrint)!.location;
        this.CheckEnvirement(locationClientY, locationClientX, 2);
    }

    /**
     * the function must be called for the drawing of a movement
     * 
     * As it stands this will have to be transformed into a more optimal method of redrawing, as this is called on every world update
     * TODO deze functie mag overgeslagen worden mits kleine aanpassingen drawCharacter
     */
    public setLocationClients(users: Map<string, { nick: string, location: number[], orientation: number, spriteNumber: number, animationProgress: number, world: string }>): void {
        // BIG TODO, deze 2 mappen hebben niet dezelfde structuur: zou niet mogen werken
        this.locationClients = users;
        const ownAnimationProgress = users.get(this.client.fingerPrint)!.animationProgress;
        this.aninimation_Canvas = ownAnimationProgress;
        const ownOrientation = users.get(this.client.fingerPrint)!.orientation;
        for (let x = 0; x < this.mapWidth; x++) {
            for (let y = 0; y < this.mapHeight; y++) {
                this.drawTile(x, y, ownAnimationProgress, ownOrientation);
            }
        }

        this.client.world!.drawGpsPath();

        for (const [, values] of users) {
            if (values.world == this.client.worldName) this.drawCharachter(values.nick, values.spriteNumber, values.orientation, values.location, values.animationProgress, ownAnimationProgress, ownOrientation);

        }
        const [locationClientX, locationClientY] = users.get(this.client.fingerPrint)!.location;

        this.CheckEnvirement(locationClientY, locationClientX, 2);

        if (users.get(this.client.fingerPrint)!.animationProgress == 0) {
            this.isMoving = false;
        }

    }

    /**
     * Return true if and only if the given keyboard event's key is an arrowkey 
     */
    private isArrowKey(event: KeyboardEvent): boolean {
        return (event.key == 'ArrowUp' || event.key == 'ArrowDown' || event.key == 'ArrowRight' || event.key == 'ArrowLeft');
    }

    /**
     * Return the POSITIVE remainder of x / n (the standard javascript modulo operator "%" doesn't have the required behaviour for negative x)
     */
    public mod(x: number, n: number) {
        return ((x % n) + n) % n;
    }

    /**
     * Calculate the absolute position of the top left tile that gets drawn
     * 
     */
    private getTopLeftInFOV(): number[] {
        let topedge = 1;
        let leftedge = 1;
        let rightedge = 1;
        let bottomedge = 1;

        const marginX = Math.floor(this.fovX / 2);
        const marginY = Math.floor(this.fovY / 2);
        const pos = this.locationClients.get(this.client.fingerPrint)!.location;
        let left = pos[0] - marginX;
        let top = pos[1] - marginY;
        if (pos[0] - marginX < 0) {
            left = 0;
            leftedge = 0;
        } else if (pos[0] - 1 - marginX < 0) {
            leftedge = 0;
        }
        if (pos[1] - marginY < 0) {
            top = 0;
            topedge = 0;
        } else if (pos[1] - 1 - marginY < 0) {
            topedge = 0;
        }
        if (pos[0] + marginX >= this.mapWidth) {
            left = this.mapWidth - this.fovX;
            rightedge = 0;
        } else if (pos[0] + 1 + marginX >= this.mapWidth) {
            rightedge = 0;
        }
        if (pos[1] + marginY >= this.mapHeight) {
            top = this.mapHeight - this.fovY;
            bottomedge = 0;
        } else if (pos[1] + 1 + marginY >= this.mapHeight) {
            bottomedge = 0;
        }
        return [left, top, leftedge, rightedge, topedge, bottomedge];
    }

    /**
     * returns 0 if there is no change of background, 1 for north, 2 for east, 3 for south and 4 for west
     * @param originalPos
     * @param goalPos 
     * @returns 
     */
    private changeOfFrame(originalPos: number[], goalPos: number[]) {
        const marginX = Math.floor(this.fovX / 2);
        const marginY = Math.floor(this.fovY / 2);
        const Xchange = goalPos[0] - originalPos[0];
        const Ychange = goalPos[1] - originalPos[1];

        if (goalPos[0] - marginX < 0 || goalPos[1] - marginY < 0) {
            return 0;
        }
        else {
            if (Ychange < 0) {
                return 1
            }
            else {
                if (Xchange > 0) {
                    return 2
                }
                else {
                    if (Ychange > 0) {
                        return 3
                    }
                    else {
                        return 4;
                    }
                }
            }

        }
    }

    /**
     * Calculate the relative position of the given absolute position
     * Return null if the relative position is not in the FOV
     */
    private getDrawingPos(pos: number[]): number[] | null {
        const [left, top, , , ,] = this.getTopLeftInFOV();
        return this.isInFOV(pos) ? [pos[0] - left, pos[1] - top] : null;
    }

    /**
     * Return true if and only if the given position is in the users's field of view
     */
    private isInFOV(pos: number[]): boolean {
        const [left, top, leftedge, rightedge, topedge, bottomedge] = this.getTopLeftInFOV();
        return pos[0] >= left - leftedge && pos[0] < left + this.fovX + rightedge && pos[1] >= top - topedge && pos[1] < top + this.fovY + bottomedge;
    }

    private positionsEqual(pos1: number[], pos2: number[]): boolean {
        if (pos1[0] == pos2[0] && pos1[1] == pos2[1]) {
            return true;
        }
        else return false;
    }
}