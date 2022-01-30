// From https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/exportKey

import * as crypto from 'crypto';

/*
Convert  an ArrayBuffer into a string
from https://developers.google.com/web/updates/2012/06/How-to-convert-ArrayBuffer-to-and-from-String
*/
function ab2str(buf: ArrayBuffer) {
    // TODO: FIXME(bart)?
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return String.fromCharCode.apply(null, new Uint8Array(buf) as any);
}

async function exportCryptoKeyAsPEM(isPrivateKey: boolean, key: CryptoKey): Promise<string> {
    const exported = await window.crypto.subtle.exportKey(
        isPrivateKey ? 'pkcs8' : 'spki',
        key
    );
    const exportedAsString = ab2str(exported);
    const exportedAsBase64 = window.btoa(exportedAsString);
    const type = isPrivateKey ? 'PRIVATE' : 'PUBLIC';
    const pemExported = `-----BEGIN ${type} KEY-----\n${exportedAsBase64}\n-----END ${type} KEY-----`;

    return pemExported;
}

export async function generateKeyPair(): Promise<{ publicKey: string, privateKey: string }> {

    // I hope this is secure

    if (typeof window !== 'undefined') {
        // browser code
        const keyPair = await window.crypto.subtle.generateKey(
            {
                name: 'RSASSA-PKCS1-v1_5',  // RSASSA-PKCS1-v1_5 or RSA-PSS for signing, RSA-OAEP for encryption
                modulusLength: 4096,
                publicExponent: new Uint8Array([1, 0, 1]),
                hash: 'SHA-256'
            },
            true,
            ['sign', 'verify']
        );
        const publicKey = await exportCryptoKeyAsPEM(false, keyPair.publicKey);
        const privateKey = await exportCryptoKeyAsPEM(true, keyPair.privateKey);
        return { publicKey, privateKey };
    }
    else {
        // CLI code
        const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
            publicKeyEncoding: {
                type: 'pkcs1',
                format: 'pem'
            },
            privateKeyEncoding: {
                type: 'pkcs1',
                format: 'pem',
            },
            modulusLength: 2048,
        })
        return { publicKey, privateKey };
    }
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}

function base64ToArrayBuffer(base64: string) {
    const binary_string = window.atob(base64);
    const len = binary_string.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
}

function convertStringToArrayBuffer(str: string | undefined) {
    const encoder = new TextEncoder();
    return encoder.encode(str);
}

function convertArrayBuffertoString(buffer: BufferSource | undefined) {
    const decoder = new TextDecoder('utf-8');
    return decoder.decode(buffer);
}

export async function importKeyFromPassword(encryptFlag: boolean, password: string, data: string, encoded_list?: any) {
    // password = document.getElementById("passwordField").value;

    const promise_key = await window.crypto.subtle.importKey(
        'raw',
        convertStringToArrayBuffer(password), {
        'name': 'PBKDF2'
    },
        false,
        ['deriveKey']
    ).then(function (importedPassword) {
        return window.crypto.subtle.deriveKey({
            'name': 'PBKDF2',
            'salt': convertStringToArrayBuffer('the salt is this random string'),
            'iterations': 100000,
            'hash': 'SHA-256'
        },
            importedPassword, {
            'name': 'AES-GCM',
            'length': 128
        },
            false,
            ['encrypt', 'decrypt']
        );
    }).catch(error => alert('Error while importing key: ' + error.message));

    if (promise_key) {
        if (encryptFlag) {
            const vector = window.crypto.getRandomValues(new Uint8Array(12))
            const items = encrypt_data(promise_key, data, vector)
            return items;
        } else {
            const key = decrypt_data(promise_key, encoded_list)
            return key;
        }
    } else {
        return null;
    }
}

async function encrypt_data(givenkey: CryptoKey, data: string, vector: ArrayBuffer) {
    const encrypt_promise = await window.crypto.subtle.encrypt({ name: 'AES-GCM', iv: vector }, givenkey, convertStringToArrayBuffer(data));

    const encrypted_data = arrayBufferToBase64(encrypt_promise);// new Uint8Array(result);
    const encrypted_vector = arrayBufferToBase64(vector);

    const items = [];

    items.push(encrypted_data);
    items.push(encrypted_vector);
    // localStorage.setItem("test", JSON.stringify(items));

    return JSON.stringify(items);

    // alert("Data encrypted " + encrypted_data);
}

async function decrypt_data(givenkey: CryptoKey, encrypted_list: any) {

    const encrypted_list_contents = JSON.parse(encrypted_list);// JSON.parse(localStorage.getItem("test"));
    const encrypted_data = encrypted_list_contents[0];
    const encrypted_vector = encrypted_list_contents[1];

    const buffer_encrypted_data = base64ToArrayBuffer(encrypted_data);// Buffer.from(encrypted_data, 'base64'); //convertStringToArrayBuffer(encrypted_data);
    const buffer_encrypted_vector = base64ToArrayBuffer(encrypted_vector)

    const decrypt_promise = await window.crypto.subtle.decrypt({ name: 'AES-GCM', iv: buffer_encrypted_vector }, givenkey, buffer_encrypted_data).catch(error => alert('Error while importing key: ' + error.message));

    if (decrypt_promise) {
        const decrypted_data = new Uint8Array(decrypt_promise);
        return convertArrayBuffertoString(decrypted_data);
    } else {
        return null;
    }

    // alert("Decrypted data: " + convertArrayBuffertoString(decrypted_data));

}