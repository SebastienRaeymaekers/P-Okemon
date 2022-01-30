import Client from '../client';
import { MiniGame, addHTMLElement } from './minigame';

/**
 * Pong class extending Minigame
 * Source: https://gist.github.com/straker/ff00b4b49669ad3dec890306d348adc4
 */
export class Pong extends MiniGame {
  grid!: number;
  paddleHeight!: number; // 80
  maxPaddleY!: number;
  rightPaddle!: {
    x: number;
    y: number;
    width: number;
    height: number;
    dy: number;
  };
  ball: any;
  paddleSpeed!: number;
  ballSpeed!: number;

  constructor(client: Client, clientDoc: Document, minigameString: string) {
    super(client, clientDoc, minigameString);
  }

  /**
   * Init doc
   */
  init() {
    this.game = 'pong';
    addHTMLElement('h2', this.mgHeaderDiv, { id: 'menuTitle', textContent: this.game });

    this.canvas = <HTMLCanvasElement>addHTMLElement('canvas', this.mgBodyDiv, { id: 'game', className: 'pongCanvas' })
    this.canvas.width = 400;
    this.canvas.height = 400;
    this.context = <CanvasRenderingContext2D>this.canvas.getContext('2d');

    this.maxPaddleY = 310 //  this.canvas.height - this.grid - this.paddleHeight; // 400 - 15 - 75 = 310
    this.paddleSpeed = 6;
    this.ballSpeed = 5;
    this.grid = 15;
    this.paddleHeight = this.grid * 5

    // {x: number, y: number, width: number, height: number, dy: number}
    this.rightPaddle = {
      // start in the middle of the game on the right side
      x: this.canvas.width - this.grid * 3,
      y: this.canvas.height / 2 - this.paddleHeight / 2,
      width: this.grid,
      height: this.paddleHeight,
      // paddle velocity
      dy: 0,
    };

    this.ball = {
      // start in the middle of the game
      x: this.canvas.width / 2,
      y: this.canvas.height / 2,
      width: this.grid,
      height: this.grid,
      // keep track of when need to reset the ball position
      resetting: false,
      // ball velocity (start going to the top-right corner)
      dx: this.ballSpeed,
      dy: -this.ballSpeed,
    };
  }

  /**
   * setup doc
   */
  setUpButtons() {
    // listen to keyboard events to move the paddles
    this.doc.addEventListener('keydown', (e) => {
      // up arrow key
      if (e.code === 'ArrowUp') {
        e.preventDefault();
        this.rightPaddle.dy = -this.paddleSpeed;
      }
      // down arrow key
      else if (e.code === 'ArrowDown') {
        e.preventDefault();
        this.rightPaddle.dy = this.paddleSpeed;
      }
    });

    // listen to keyboard events to stop the paddle if key is released
    this.doc.addEventListener('keyup', (e) => {
      this.rightPaddle;
      if (e.code === 'ArrowUp' || e.code === 'ArrowDown') {
        e.preventDefault();
        this.rightPaddle.dy = 0;
      }
    });
  }

  /**
   * loop doc
   */
  loop(): void {
    if (this.loop_interrupted === false) {
      requestAnimationFrame(this.loop);
    }

    this.context!.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // move paddles by their velocity
    this.rightPaddle.y += this.rightPaddle.dy;

    console.log(this.rightPaddle.y, this.maxPaddleY);
    if (this.rightPaddle.y <=  15) {
      this.rightPaddle.y = this.grid;
    } else if (this.rightPaddle.y > this.maxPaddleY) {
      this.rightPaddle.y = this.maxPaddleY;
    }

    // draw paddles
    this.context!.fillStyle = 'white';

    this.context!.fillRect(
      this.rightPaddle.x,
      this.rightPaddle.y,
      this.rightPaddle.width,
      this.rightPaddle.height
    );

    // move ball by its velocity
    this.ball.x += this.ball.dx;
    this.ball.y += this.ball.dy;

    // prevent ball from going through walls by changing its velocity
    if (this.ball.y < this.grid) {
      this.ball.y = this.grid;
      this.ball.dy *= -1;
    } else if (this.ball.y + this.grid > this.canvas.height - this.grid) {
      this.ball.y = this.canvas.height - this.grid * 2;
      this.ball.dy *= -1;
    } else if (this.ball.x <= 1) {
      this.ball.dx *= -1;
    }

    // reset ball if it goes past paddle (but only if we haven't already done so)
    if (
      (this.ball.x < 0 || this.ball.x > this.canvas.width) &&
      !this.ball.resetting
    ) {
      this.client.send({ // geen idee waarom ik dit niet in een functie uploadscore kan steken, dan werkt het gewoon niet
        id: 10, // wth is een commandid
        command: 'scoreboard-request',
        game: <string>this.game,
        result: { nick: this.client.nick, score: this.score }
      });
      this.score = 0;
      this.updateScore(this.score);

      this.ball.resetting = true;

      // give some time for the player to recover before launching the ball again
      setTimeout(() => {
        this.ball.resetting = false;
        this.ball.x = this.canvas.width / 2;
        this.ball.y = this.canvas.height / 2;
      }, 400);
    }

    // check to see if ball collides with paddle. if they do change x velocity
    if (this.collides(this.ball, this.rightPaddle)) {
      this.ball.dx *= -1;

      // move ball next to the paddle otherwise the collision will happen again
      // in the next frame
      this.ball.x = this.rightPaddle.x - this.ball.width;
      this.score += 1;
      this.updateScore(this.score);
      if (this.score > this.maxscore) this.updateMaxScore(this.score);
    }

    // draw ball
    this.context!.fillRect(
      this.ball.x,
      this.ball.y,
      this.ball.width,
      this.ball.height
    );

    // draw walls
    this.context!.fillStyle = 'lightgrey';
    this.context!.fillRect(0, 0, this.canvas.width, this.grid);
    this.context!.fillRect(
      0,
      this.canvas.height - this.grid,
      this.canvas.width,
      this.canvas.height
    );
    this.context!.fillRect(0, 0,
      this.grid,
      this.canvas.height
    );

    // draw dotted line down the middle
    for (
      let i = this.grid;
      i < this.canvas.height - this.grid;
      i += this.grid * 2
    ) {
      this.context!.fillRect(
        this.canvas.width / 2 - this.grid / 2,
        i,
        this.grid,
        this.grid
      );
    }
  }

  /**
   * check for collision between two objects using axis-aligned bounding box (AABB)
   * @see https://developer.mozilla.org/en-US/docs/Games/Techniques/2D_collision_detection
   * @param obj1
   * @param obj2
   * @returns Boolean whether obj1 and obj2 collide
   */
  collides(obj1: any, obj2: any) {
    return (
      obj1.x < obj2.x + obj2.width &&
      obj1.x + obj1.width > obj2.x &&
      obj1.y < obj2.y + obj2.height &&
      obj1.y + obj1.height > obj2.y
    );
  }

}