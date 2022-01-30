/**
 * This file stores the different worlds a server can have.
 * Make sure the tiles used are consistent with the images defined in image_paths.ts!
 */
// export const world1 = {
//     tiles: generateEmptyWorld(100, 100),
//     doorsMap: new Map<string, number[]>([]),
//     entryMap: new Map<string, number[]>([['world5', [1, 1]]])
// };

// function generateEmptyWorld(width: number, height: number): string[][] {
//     const world: string[][] = []
//     for (let i = 0; i < height; i++) {
//         const row: string[] = []
//         for (let j = 0; j < width; j++) {
//             row.push(getTile(j, i));
//         }
//         world.push(row);
//     }
//     world[4][6] = 'mg2';
//     world[8][1] = 'ta2';
//     return world;
// }

// function getTile(x: number, y: number): string {
//     if (x == 0 || y == 0) return 'wa1';
//     switch (Math.floor(Math.random() * 2)) {
//         case 0:
//             return 'ti1';
//         case 1:
//             return 'ti2';
//         default:
//             return '...'
//     }

// }

// main room with world1 on top, world2 to the right, world3 on the bottom and world4 on the left.
export const world1 = {
    tiles: [
        ['wa1', 'wa1', 'wa1', 'wa1', 'dc2', 'wa1', 'wa1', 'wa1', 'wa1'],
        ['wa1', 'ti1', 'ti1', 'ti1', 'ti1', 'ti1', 'ti1', 'ti1', 'wa1'],
        ['wa1', 'ti1', 'ti1', 'ti1', 'ti1', 'ti1', 'ti1', 'ti1', 'wa1'],
        ['wa1', 'ti1', 'ti1', 'ti1', 'ti1', 'ti1', 'ti1', 'ti1', 'wa1'],
        ['dc2', 'ti1', 'ti1', 'ti1', 'ti1', 'ti1', 'ti1', 'ti1', 'dc2'],
        ['wa1', 'ti1', 'ti1', 'ti1', 'ti1', 'ti1', 'ti1', 'ti1', 'wa1'],
        ['wa1', 'ti1', 'mg1', 'ti1', 'ti1', 'ti1', 'ti1', 'ti1', 'wa1'],
        ['wa1', 'ti1', 'ti1', 'ti1', 'ti1', 'ti1', 'ti1', 'ti1', 'wa1'],
        ['wa1', 'wa1', 'wa1', 'wa1', 'dc2', 'wa1', 'wa1', 'wa1', 'wa1']
    ],
    doorsMap: new Map<string, number[]>([['world5', [4, 0]], ['world2', [8, 4]], ['world3', [4, 8]], ['world4', [0, 4]]]), // y = computer screen coordinate
    entryMap: new Map<string, number[]>([['world5', [4, 7]], ['world2', [7, 4]], ['world3', [4, 1]], ['world4', [1, 4]]]) // y = carthesian coordinate
};

export const world2 = {
    tiles: [
        ['wa1', 'wa1', 'wa1', 'wa1', 'wa1', 'wa1', 'wa1', 'wa1', 'wa1', 'wa1'],
        ['wa1', 'ti1', 'ti1', 'ti1', 'ti1', 'ti1', 'ti1', 'ti1', 'mg2', 'wa1'],
        ['wa1', 'ti1', 'ti1', 'ti1', 'ti1', 'ti1', 'ti1', 'ti1', 'ti1', 'wa1'],
        ['wa1', 'ti1', 'ti1', 'ti1', 'ti1', 'ti1', 'ti1', 'ti1', 'ti1', 'wa1'],
        ['dc2', 'ti1', 'ti1', 'ta2', 'ti1', 'ti1', 'ti1', 'ti1', 'ti1', 'wa1'],
        ['wa1', 'ti1', 'ti1', 'ti1', 'ti1', 'ti1', 'ti1', 'ti1', 'wa1', 'wa1'],
        ['wa1', 'ti2', 'ti2', 'ti2', 'ti1', 'ti1', 'ti1', 'ti1', 'ti1', 'wa1'],
        ['wa1', 'ti2', 'mg1', 'ti2', 'ti1', 'ti1', 'ti1', 'ti1', 'wa1', 'wa1'],
        ['wa1', 'wa1', 'wa1', 'wa1', 'wa1', 'wa1', 'wa1', 'wa1', 'wa1', 'wa1']
    ],
    doorsMap: new Map<string, number[]>([['world1', [0, 4]]]),
    entryMap: new Map<string, number[]>([['world1', [1, 4]]])
};

export const world3 = {
    tiles: [
        ['wa1', 'wa1', 'wa1', 'wa1', 'dc2', 'wa1', 'wa1', 'wa1', 'wa1', 'wa1'],
        ['wa1', 'ti1', 'ti1', 'ti1', 'ti1', 'ti1', 'ti1', 'ti1', 'ti1', 'wa1'],
        ['wa1', 'ti1', 'ti1', 'ti1', 'ti1', 'ti1', 'ti1', 'ta2', 'ti1', 'wa1'],
        ['wa1', 'ti1', 'ti1', 'ti1', 'ta2', 'ti1', 'ti1', 'ti1', 'ti1', 'wa1'],
        ['wa1', 'ti1', 'ti1', 'ti1', 'ti1', 'ti1', 'ti1', 'ti1', 'ti1', 'wa1'],
        ['wa1', 'ti1', 'ti1', 'ti1', 'ti1', 'ti1', 'ti1', 'ti1', 'ti1', 'wa1'],
        ['wa1', 'ti1', 'ti1', 'ti1', 'ti1', 'ti1', 'ti1', 'ti1', 'ti1', 'wa1'],
        ['wa1', 'ti1', 'ta2', 'ti1', 'ti1', 'ti1', 'ta2', 'ti1', 'ti1', 'wa1'],
        ['wa1', 'ti1', 'ti1', 'ti1', 'ti1', 'ti1', 'ti1', 'ti1', 'ti1', 'wa1'],
        ['wa1', 'wa1', 'wa1', 'wa1', 'wa1', 'wa1', 'wa1', 'wa1', 'wa1', 'wa1']
    ],
    doorsMap: new Map<string, number[]>([['world1', [4, 0]]]),
    entryMap: new Map<string, number[]>([['world1', [4, 8]]])
};

export const world4 = {
    tiles: [
        ['iw2', 'iw2', 'iw2', 'iw2', 'iw2', 'iw2', 'iw2', 'iw2', 'iw2', 'iw2'],
        ['iw1', 'it1', 'it1', 'it1', 'it1', 'it1', 'it1', 'it1', 'it1', 'iw1'],
        ['iw1', 'it1', 'it1', 'it1', 'it1', 'it1', 'it1', 'it1', 'it1', 'iw1'],
        ['iw1', 'it1', 'it1', 'it1', 'it1', 'it1', 'it1', 'ta2', 'it1', 'iw1'],
        ['iw1', 'it1', 'it1', 'it1', 'it1', 'it1', 'it1', 'it1', 'it1', 'iw1'],
        ['iw1', 'it1', 'it1', 'mg1', 'it1', 'it1', 'it1', 'it1', 'it1', 'dc2'],
        ['iw1', 'it1', 'it1', 'it1', 'it1', 'it1', 'it1', 'it1', 'it1', 'iw1'],
        ['iw1', 'it1', 'ta2', 'it1', 'it1', 'it1', 'it1', 'mg2', 'it1', 'iw1'],
        ['iw1', 'it1', 'it1', 'it1', 'it1', 'it1', 'it1', 'it1', 'it1', 'iw1'],
        ['iw1', 'iw1', 'iw1', 'iw1', 'iw1', 'iw1', 'iw1', 'iw1', 'iw1', 'iw1']
    ],
    doorsMap: new Map<string, number[]>([['world1', [9, 5]]]),
    entryMap: new Map<string, number[]>([['world1', [8, 4]]])
}

export const world5 = {
    tiles: [                   //
        ['bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1'],
        ['bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1'],
        ['bw1', 'bs1', 'bs1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1'],
        ['bw1', 'bs1', 'bw1', 'bs1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1'],
        ['bw1', 'bs1', 'bs1', 'bs1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'mg2', 'bw1', 'bs1', 'bs1', 'bs1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1'],
        ['bw1', 'bw1', 'bs1', 'bs1', 'bs1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bs1', 'bw1', 'bs1', 'bs1', 'bs1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1'],
        ['bw1', 'bw1', 'bb2', 'bs1', 'bs1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bb2', 'bw1', 'bw1', 'bs1', 'bs1', 'bs1', 'bs1', 'bw1', 'bw1', 'bw1'],
        ['bw1', 'bw1', 'bb2', 'bs1', 'bs1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bb2', 'bw1', 'bs1', 'bs1', 'bs1', 'bs1', 'bb2', 'bw1', 'bw1', 'bw1'],
        ['bw1', 'bw1', 'bb2', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bb2', 'bw1', 'bw1', 'bs1', 'ta2', 'bw1', 'bb2', 'bw1', 'bw1', 'bw1'],
        ['bw1', 'bw1', 'bb2', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bb2', 'bw1', 'bw1', 'bs1', 'bs1', 'bw1', 'bb2', 'bw1', 'bw1', 'bw1'],
        ['bw1', 'bw1', 'bb2', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bb2', 'bw1', 'bw1', 'bw1', 'bs1', 'bw1', 'bb2', 'bw1', 'bw1', 'bw1'],
        ['bw1', 'bs1', 'bs1', 'bs1', 'bs1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bb2', 'bw1', 'bw1', 'bw1', 'bs1', 'bw1', 'bb2', 'bw1', 'bw1', 'bw1'],
        ['bw1', 'ta2', 'bs1', 'bs1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bb2', 'bw1', 'bw1', 'bw1', 'bb2', 'bs1', 'bs1', 'bw1', 'bw1', 'bw1'],
        ['bw1', 'bs1', 'bs1', 'bs1', 'bb1', 'bb1', 'bb1', 'bb1', 'bb1', 'bb1', 'bb1', 'bb1', 'bb1', 'bb1', 'bb1', 'bs1', 'bb1', 'bb1', 'bb1', 'bs1', 'bw1', 'ta2', 'bs1', 'bw1', 'bw1'],
        ['bw1', 'bs1', 'dc2', 'bs1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bs1', 'bs1', 'bw1', 'bw1'],
        ['bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1', 'bw1']
    ],
    doorsMap: new Map<string, number[]>([['world1', [2, 14]]]),
    entryMap: new Map<string, number[]>([['world1', [2, 2]]])
}