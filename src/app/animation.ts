
export class Animation {
    spritesheet;     // the spritesheet image
    width;           // width of spritesheet
    height;          // height of spritesheet
    timePerFrame;    // time in(ms) given to each frame
    numberOfFrames;  // number of frames(sprites) in the spritesheet, default 1
    scaleX;
    scaleY;

    // current frame index pointer
    frameIndex;

    // time the frame index was last updated
    lastUpdate;

    constructor(spritesheet: HTMLImageElement, timePerFrame: number, numberOfFrames: number, scalex: number, scaley: number) {
        this.spritesheet = spritesheet;             // the spritesheet image
        this.width = spritesheet.width;             // width of spritesheet
        this.height = spritesheet.height;           // height of spritesheet
        this.timePerFrame = timePerFrame;           // time in(ms) given to each frame
        this.numberOfFrames = numberOfFrames || 1;  // number of frames(sprites) in the spritesheet, default 1
        this.scaleX = scalex;
        this.scaleY = scaley;
        // current frame index pointer
        this.frameIndex = 0;

        // time the frame index was last updated
        this.lastUpdate = Date.now();

    }

    setSprite(spritesheet: HTMLImageElement) {
        this.spritesheet = spritesheet;
        this.width = spritesheet.width;             // width of spritesheet
        this.height = spritesheet.height;           // height of spritesheet
    }

    // to update
    update() {
        if (Date.now() - this.lastUpdate >= this.timePerFrame) {
            // console.log(this.frameIndex)
            this.frameIndex++;
            if (this.frameIndex >= this.numberOfFrames) {
                this.frameIndex = 0;
            }
            this.lastUpdate = Date.now();
        }
    }

    // to draw on the canvas, parameter is the context of the canvas to be drawn on
    draw(context: CanvasRenderingContext2D, x: number, y: number) {
        context.drawImage(this.spritesheet,
            this.frameIndex * this.width / this.numberOfFrames,
            0,
            this.width / this.numberOfFrames,
            this.height,
            x,
            y,
            // this.width / this.numberOfFrames,
            // this.height,
            this.scaleX,
            this.scaleY);
    }

    fadeout(context: CanvasRenderingContext2D, x: number, y: number, dx: number, dy: number) {
        context.drawImage(this.spritesheet,
            this.frameIndex * this.width / this.numberOfFrames,
            0,
            (this.width / this.numberOfFrames) - dx,
            this.height - dy,
            x + dx,
            y + dy,
            // this.width / this.numberOfFrames,
            // this.height,
            this.scaleX - dx,
            this.scaleY - dy
        )
    }

}

export default Animation;