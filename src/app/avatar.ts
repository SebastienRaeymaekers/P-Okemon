import * as THREE from 'three'

export function createAvatar(clientLocation: number[], orientation: number, material: THREE.LineBasicMaterial, cellWidth: number, cellHeight: number, gridWidth: number, gridHeight: number) {  // TODO ask the dimensions directly from the canvas instead of giving them in the cosntructor
    const clientPoints = [];
    const trueLocation = [clientLocation[0] * cellWidth - gridWidth / 2, clientLocation[1] * cellHeight - gridHeight / 2]; // TODO temporary name/value
    const clientOffSet = [cellWidth / 2, cellHeight / 2];

    clientPoints.push(new THREE.Vector3(trueLocation[0] + 0 * clientOffSet[0], trueLocation[1] + 1 * clientOffSet[1], 0));
    if (orientation == 1) { // TODO proper implementation of the orientation, without if statements ofcourse
        clientPoints.push(new THREE.Vector3(trueLocation[0] + 1 * clientOffSet[0], trueLocation[1] + 1 * clientOffSet[1], 0));
        clientPoints.push(new THREE.Vector3(trueLocation[0] + 0 * clientOffSet[0], trueLocation[1] + 1 * clientOffSet[1], 0));
    }
    clientPoints.push(new THREE.Vector3(trueLocation[0] + 1 * clientOffSet[0], trueLocation[1] + 2 * clientOffSet[1], 0));
    if (orientation == 2) { // TODO proper implementation of the orientation, without if statements ofcourse
        clientPoints.push(new THREE.Vector3(trueLocation[0] + 1 * clientOffSet[0], trueLocation[1] + 1 * clientOffSet[1], 0));
        clientPoints.push(new THREE.Vector3(trueLocation[0] + 1 * clientOffSet[0], trueLocation[1] + 2 * clientOffSet[1], 0));
    }
    clientPoints.push(new THREE.Vector3(trueLocation[0] + 2 * clientOffSet[0], trueLocation[1] + 1 * clientOffSet[1], 0));
    if (orientation == 3) { // TODO proper implementation of the orientation, without if statements ofcourse
        clientPoints.push(new THREE.Vector3(trueLocation[0] + 1 * clientOffSet[0], trueLocation[1] + 1 * clientOffSet[1], 0));
        clientPoints.push(new THREE.Vector3(trueLocation[0] + 2 * clientOffSet[0], trueLocation[1] + 1 * clientOffSet[1], 0));
    }
    clientPoints.push(new THREE.Vector3(trueLocation[0] + 1 * clientOffSet[0], trueLocation[1] + 0 * clientOffSet[1], 0));
    if (orientation == 4) { // TODO proper implementation of the orientation, without if statements ofcourse
        clientPoints.push(new THREE.Vector3(trueLocation[0] + 1 * clientOffSet[0], trueLocation[1] + 1 * clientOffSet[1], 0));
        clientPoints.push(new THREE.Vector3(trueLocation[0] + 1 * clientOffSet[0], trueLocation[1] + 0 * clientOffSet[1], 0));
    }
    const clientGeometry = new THREE.BufferGeometry().setFromPoints(clientPoints);

    return new THREE.LineLoop(clientGeometry, material);
}