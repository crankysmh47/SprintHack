export async function deriveKeyFromPassword(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
        "raw",
        enc.encode(password),
        "PBKDF2",
        false,
        ["deriveKey"]
    );

    return await window.crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: salt as any,
            iterations: 100000,
            hash: "SHA-256"
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt"]
    );
}

export async function encryptPrivateKey(privateKey: CryptoKey, password: string): Promise<{ salt: string, iv: string, cipherText: string }> {
    // 1. Export Private Key to PKCS#8 (Bytes)
    const keyData = await window.crypto.subtle.exportKey("pkcs8", privateKey);

    // 2. Derive Encryption Key from Password
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const aesKey = await deriveKeyFromPassword(password, salt);

    // 3. Encrypt
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await window.crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv },
        aesKey,
        keyData
    );

    // 4. Return as Base64 Strings
    return {
        salt: btoa(String.fromCharCode(...salt)),
        iv: btoa(String.fromCharCode(...iv)),
        cipherText: btoa(String.fromCharCode(...new Uint8Array(encrypted)))
    };
}

export async function decryptPrivateKey(
    password: string,
    saltB64: string,
    ivB64: string,
    cipherTextB64: string
): Promise<CryptoKey> {
    // 1. Decode Base64
    const salt = new Uint8Array(atob(saltB64).split("").map(c => c.charCodeAt(0)));
    const iv = new Uint8Array(atob(ivB64).split("").map(c => c.charCodeAt(0)));
    const cipherText = new Uint8Array(atob(cipherTextB64).split("").map(c => c.charCodeAt(0)));

    // 2. Derive Key
    const aesKey = await deriveKeyFromPassword(password, salt);

    // 3. Decrypt
    const decryptedBuffer = await window.crypto.subtle.decrypt(
        { name: "AES-GCM", iv: iv },
        aesKey,
        cipherText
    );

    // 4. Import back to CryptoKey
    return await window.crypto.subtle.importKey(
        "pkcs8",
        decryptedBuffer,
        {
            name: "RSA-PSS",
            hash: "SHA-256"
        },
        true,
        ["sign"]
    );
}
