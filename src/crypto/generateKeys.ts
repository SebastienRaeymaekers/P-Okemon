/**
 * to execute: node ./bin/generateKeys.js
 */
import * as fs from 'fs';
import * as crypto from 'crypto';

const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
});
fs.writeFile('./bin/publicKey.pem', publicKey.export({
    format:'pem',
    type:'pkcs1'
    }), (err) => {
    if (err) return console.log(err);
    else return console.log('Generated public key');
    }
);
fs.writeFile('./bin/privateKey.pem', privateKey.export({
    format:'pem',
    type:'pkcs1'
    }), (err) => {
    if (err) return console.log(err);
    else return console.log('Generated private key');
    }
);