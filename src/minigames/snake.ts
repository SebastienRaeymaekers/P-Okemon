import Client from '../client';
import { MiniGame, addHTMLElement } from './minigame';

/**
 * Snake class extending Minigame
 * TODO ADD SOURCE FROM GITHUB!!
 * Source: 
 */
export class Snake extends MiniGame {
  snake!: {
    x: number;
    y: number;
    dx: number;
    dy: number;
    cells: any;
    maxCells: number;
  };
  apple!: { x: number; y: number };
  grid!: number;
  count!: number;

  constructor(client: Client, clientDoc: Document, minigameString: string) {
    super(client, clientDoc, minigameString);
  }

  init() {
    this.game = 'snake';
    addHTMLElement('h2', this.mgHeaderDiv, { id: 'menuTitle', textContent: this.game });

    this.canvas = <HTMLCanvasElement>addHTMLElement('canvas', this.mgBodyDiv, {id: 'game', className: 'snakeCanvas'} )
    this.canvas.width = 400;
    this.canvas.height = 400;
    this.context = <CanvasRenderingContext2D>this.canvas.getContext('2d');

    this.grid = 16;
    this.count = 0;

    this.snake = {
      x: 160,
      y: 160,

      // snake velocity. moves one grid length every frame in either the x or y direction
      dx: this.grid,
      dy: 0,

      // keep track of all grids the snake body occupies
      cells: [],

      // length of the snake. grows when eating an apple
      maxCells: 4,
    };

    this.apple = {
      x: 320,
      y: 320,
    };
  }

  setUpButtons() {
    this.doc.addEventListener('keydown', (e) => {
      // prevent snake from backtracking on itself by checking that it's
      // not already moving on the same axis (pressing left while moving
      // left won't do anything, and pressing right while moving left
      // shouldn't let you collide with your own body)

      if (e.code === 'ArrowLeft' && this.snake.dx === 0) {
        e.preventDefault();
        this.snake.dx = -this.grid;
        this.snake.dy = 0;
      } else if (e.code === 'ArrowUp' && this.snake.dy === 0) {
        e.preventDefault();
        this.snake.dy = -this.grid;
        this.snake.dx = 0;
      } else if (e.code === 'ArrowRight' && this.snake.dx === 0) {
        e.preventDefault();
        this.snake.dx = this.grid;
        this.snake.dy = 0;
      } else if (e.code === 'ArrowDown' && this.snake.dy === 0) {
        e.preventDefault();
        this.snake.dy = this.grid;
        this.snake.dx = 0;
      }
    });
  }

  loop() {
    if (this.loop_interrupted === false) {
      requestAnimationFrame(this.loop);
    }

    // slow game loop to 15 fps instead of 60 (60/15 = 4)
    if (++this.count < 4) {
      return;
    }

    this.count = 0;
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // move snake by it's velocity
    this.snake.x += this.snake.dx;
    this.snake.y += this.snake.dy;

    // wrap snake position horizontally on edge of screen
    if (this.snake.x < 0) {
      this.snake.x = this.canvas.width - this.grid;
    } else if (this.snake.x >= this.canvas.width) {
      this.snake.x = 0;
    }

    // wrap snake position vertically on edge of screen
    if (this.snake.y < 0) {
      this.snake.y = this.canvas.height - this.grid;
    } else if (this.snake.y >= this.canvas.height) {
      this.snake.y = 0;
    }

    // keep track of where snake has been. front of the array is always the head
    this.snake.cells.unshift({ x: this.snake.x, y: this.snake.y });

    // remove cells as we move away from them
    if (this.snake.cells.length > this.snake.maxCells) {
      this.snake.cells.pop();
    }

    // draw apple
    this.context.fillStyle = 'red';
    this.context.fillRect(
      this.apple.x,
      this.apple.y,
      this.grid - 1,
      this.grid - 1
    );

    // draw snake one cell at a time
    this.context!.fillStyle = 'green';
    this.snake.cells.forEach((cell: any, index: any) => {
      // drawing 1 px smaller than the grid creates a grid effect in the snake body so you can see how long it is
      this.context.fillRect(cell.x, cell.y, this.grid - 1, this.grid - 1);

      // snake ate apple
      if (cell.x === this.apple.x && cell.y === this.apple.y) {
        this.snake.maxCells++;

        // canvas is 400x400 which is 25x25 grids
        this.apple.x = this.getRandomInt(0, 25) * this.grid;
        this.apple.y = this.getRandomInt(0, 25) * this.grid;

        // update level & score
        this.updateScore(this.score + 1);
        if (this.score > this.maxscore) this.updateMaxScore(this.score);
      }

      // check collision with all cells after this one (modified bubble sort)
      for (let i = index + 1; i < this.snake.cells.length; i++) {
        // snake occupies same space as a body part. reset game
        if (
          cell.x === this.snake.cells[i].x &&
          cell.y === this.snake.cells[i].y
        ) {
          this.snake.x = 160;
          this.snake.y = 160;
          this.snake.cells = [];
          this.snake.maxCells = 4;
          this.snake.dx = this.grid;
          this.snake.dy = 0;

          this.apple.x = this.getRandomInt(0, 25) * this.grid;
          this.apple.y = this.getRandomInt(0, 25) * this.grid;

          // this.uploadScore;
          this.client.send({ // geen idee waarom ik dit niet in een functie uploadscore kan steken, dan werkt het gewoon niet
            id: 10, // wth is een commandid
            command: 'scoreboard-request',
            game: <string>this.game,
            result: { nick: this.client.nick, score: this.score }
          });
          this.updateScore(0);

        }
      }
    });
  }

  // get random whole numbers in a specific range
  // @see https://stackoverflow.com/a/1527820/2124254
  getRandomInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min)) + min;
  }

}