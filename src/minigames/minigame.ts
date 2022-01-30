import * as protocol from './../protocol';
import Client from '../client';
/**
 * Add an HTML Element with a given type and possibly options to the given parent 
 * @param type 
 * @param parent 
 * @param options 
 * @returns 
 */
export function addHTMLElement(type: string, parent: HTMLElement, options?: { id?: string, className?: string, textContent?: string, src?: string, innerHTML?: string, value?: string, type?: string, placeholder?: string, text?: string }): HTMLImageElement | HTMLElement | HTMLCanvasElement {
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

export abstract class MiniGame {
  playButton: HTMLSpanElement | undefined = undefined;
  mgDiv: HTMLDivElement;
  mgContentDiv: HTMLDivElement;
  mgHeaderDiv: HTMLDivElement;
  mgBodyDiv: HTMLDivElement;
  headerButtonsDiv: HTMLDivElement;
  endGameBtn: HTMLSpanElement
  exitBtn: HTMLButtonElement;
  client: Client;
  minigameString: string;
  doc: HTMLDocument;
  score = 0;
  maxscore = 0;
  scoreDisplay!: HTMLDivElement;
  currentScoreDisplay!: HTMLParagraphElement
  maxScoreDisplay!: HTMLParagraphElement;
  requestId: number | undefined = undefined;
  canvas!: HTMLCanvasElement;
  scoreboardCanvas: HTMLCanvasElement | undefined = undefined;
  scoreBoardContext!: CanvasRenderingContext2D | null;
  context!: CanvasRenderingContext2D;
  loop_interrupted = false;
  game: string | undefined;

  /**
   * Abstract class for minigames.
   * @param client Client who is playing the minigame
   * @param clientDoc Document the client is playing on
   * @param minigameString String that defines the kind of minigame
   */
  constructor(client: Client, clientDoc: Document, minigameString: string) {
    this.client = client;
    this.doc = clientDoc;
    this.minigameString = minigameString;

    const bodyDiv = <HTMLElement>document.getElementById('bodyDiv');
    this.mgDiv = <HTMLDivElement>addHTMLElement('div', bodyDiv, { id: 'mgDiv', className: 'mgDiv', });
    this.mgContentDiv = <HTMLDivElement>addHTMLElement('div', this.mgDiv, { id: 'mgContentDiv', className: 'mgContentDiv' });
    this.mgHeaderDiv = <HTMLDivElement>addHTMLElement('div', this.mgContentDiv, { id: 'mgHeaderDiv', className: 'mgHeaderDiv' });
    this.mgBodyDiv = <HTMLDivElement>addHTMLElement('div', this.mgContentDiv, { id: 'mgBodyDiv', className: 'mgBodyDiv' });

    this.headerButtonsDiv = <HTMLDivElement>addHTMLElement('div', this.mgHeaderDiv, { id: 'mgButtonsDiv', className: 'mgButtonsDiv' });
    this.endGameBtn = <HTMLSpanElement>addHTMLElement('span', this.headerButtonsDiv, { id: 'endMgButton', className: 'material-icons stopButton', innerHTML: 'stop' })
    this.exitBtn = <HTMLButtonElement>addHTMLElement('span', this.headerButtonsDiv, { id: 'exitMgButton', className: 'closeMg', innerHTML: '&times;' })

    this.scoreDisplay = <HTMLDivElement>addHTMLElement('div', this.mgBodyDiv, { id: 'scoreDisplay', className: 'scoreDisplay' })
    this.currentScoreDisplay = <HTMLParagraphElement>addHTMLElement('p', this.scoreDisplay, { id: 'scoreDisplay' })
    this.updateScore(0);
    this.maxScoreDisplay = <HTMLParagraphElement>addHTMLElement('p', this.scoreDisplay, { id: 'maxScoreDisplay' })
    this.updateMaxScore(0);
    this.mgDiv.style.display = 'block';

    this.setOnClicks();

    this.client.inMinigame = true;
    this.init();
    this.loop = this.loop.bind(this); // always before start game!!
    this.startGame();
    this.setUpButtons();
  }

  /**
   * Initialize all variables for the minigame
   */
  abstract init(): void;

  /**
   * Set up the control buttons for the minigame
   */
  abstract setUpButtons(): void;

  /** end the game
   * The game loop
   */
  abstract loop(): void;

  /**
   * our final function to end te game, maybe collide this with stopgame?
   */
  endGame() {
    // console.log('ending game');
    const playButton = <HTMLSpanElement>document.getElementById('playButton');
    if (playButton) {
      playButton.className = 'material-icons unavailableButtonBox';
    }
  }

  /**
   * Start the game
   */
  startGame() {
    this.loop_interrupted = false;
    this.requestId = requestAnimationFrame(this.loop);
  }

  /**
   * End the game
   */
  stopGame() {
    this.loop_interrupted = true;
    if (this.requestId !== undefined) {
      cancelAnimationFrame(this.requestId);
      this.requestId = undefined;
    }
  }

  /**
   * Set the 'onclick' functions for the exit- and play-button
   */
  setOnClicks() {
    // EXIT BUTTON: Leave the game
    this.endGameBtn.onclick = () => {
      this.stopGame();
      this.setupScoreboardDisplay();
      this.endGameBtn.remove();
    };

    this.exitBtn.onclick = () => {
      this.mgDiv.remove();
      this.client.inMinigame = false;
      this.client.leaveMinigame();
    };
  }

  /**
   * Get the scoreslist from the server
   */
  async getScoresList(): Promise<{ nick: string, score: number }[]> {
    this.client.send({
      id: 10, // wth is een commandid
      command: 'scoreboard-request',
      game: <string>this.game,
      result: { nick: this.client.nick, score: 0 } // zodat ge toch nog uw scoreboard krijgt
    });
    return await new Promise<{ nick: string, score: number }[]>(resolve => this.client.socket.on('data', (data: protocol.S2CCommand) => {
      if (data.command === 'scoreboard-answer') {
        resolve(data.data);
      }
    }));
  }

  /**
   * Create HTML Elements for the scoreboard
   */
  async setupScoreboardDisplay() {
    this.mgBodyDiv.removeChild(this.canvas);
    this.mgBodyDiv.removeChild(this.scoreDisplay);
    const scoreboardDiv = addHTMLElement('div', this.mgBodyDiv, { id: 'scoreboardDiv', className: 'scoreboardDiv' })

    const scoresList = await this.getScoresList();
    addHTMLElement('p', scoreboardDiv, { innerHTML: 'TOP TEN PLAYERS', className: 'scoreboardElement' })
    let i = 1;
    for (const value of scoresList.values()) {
      const scoreText = `${i}. ${value.nick}:      ${value.score}`;
      addHTMLElement('p', scoreboardDiv, { innerHTML: scoreText, className: 'scoreboardElement' })
      i++;
    }
  }

  /**
   * Update the current score field
   * @param Score current score
   */
  updateScore(Score: number) {
    this.score = Score;
    this.currentScoreDisplay.innerHTML = `Current score: ${this.score}`;
  }

  /**
   * If the current score exceeds the maximum score, update it.
   * @param Score current score
   */
  updateMaxScore(Score: number) {
    this.maxscore = Score;
    this.maxScoreDisplay.innerHTML = `Max score: ${this.maxscore}`;
  }
}