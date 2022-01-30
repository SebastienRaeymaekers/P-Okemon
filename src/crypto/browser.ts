// From https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/exportKey

/*
Convert  an ArrayBuffer into a string
from https://developers.google.com/web/updates/2012/06/How-to-convert-ArrayBuffer-to-and-from-String
*/
function ab2str(buf: ArrayBuffer) {
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