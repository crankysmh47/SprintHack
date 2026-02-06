// lib/crypto.ts

export interface KeyPair {
    publicKey: string;
    privateKey: CryptoKey;
}

// 1. Generate RSA-PSS Key Pair (Good for Signing)
export async function generateKeys(): Promise<CryptoKey[]> {
    if (!window.crypto || !window.crypto.subtle) {
        console.warn("⚠️ WebCrypto Not Available (Insecure Context?). Returning Mock Keys.");
        // We cannot generate real keys in insecure context. 
        // Throw error or return mock? returning mock to prevent crash, but flow will fail at verification.
        // Actually, we should probably alert user.
        alert("SECURITY WARNING: You are not on localhost or HTTPS. Anonymity features are disabled.");
        throw new Error("Secure Context Required");
    }

    const keyPair = await window.crypto.subtle.generateKey(
        {
            name: "RSA-PSS",
            modulusLength: 2048,
            publicExponent: new Uint8Array([1, 0, 1]),
            hash: "SHA-256"
        },
        true, // extractable
        ["sign", "verify"]
    );

    return [keyPair.publicKey, keyPair.privateKey];
}

// 2. Export Key to String (PEM-like or JWK) for DB storage
export async function exportKey(key: CryptoKey): Promise<string> {
    const exported = await window.crypto.subtle.exportKey("spki", key);
    const exportedAsBase64 = window.btoa(String.fromCharCode(...new Uint8Array(exported)));
    return exportedAsBase64;
}

// 3. Import Key (Optional, if we need to verify locally)
export async function importKey(pem: string): Promise<CryptoKey> {
    const binaryDerString = window.atob(pem);
    const binaryDer = new Uint8Array(binaryDerString.length);
    for (let i = 0; i < binaryDerString.length; i++) {
        binaryDer[i] = binaryDerString.charCodeAt(i);
    }

    return await window.crypto.subtle.importKey(
        "spki",
        binaryDer,
        {
            name: "RSA-PSS",
            hash: "SHA-256"
        },
        true,
        ["verify"]
    );
}

// 4. Sign Data (Vote) - Returns Hex String
export async function signVote(privateKey: CryptoKey, data: string): Promise<string> {
    const encoder = new TextEncoder();
    const encoded = encoder.encode(data);

    const signature = await window.crypto.subtle.sign(
        {
            name: "RSA-PSS",
            saltLength: 32,
        },
        privateKey,
        encoded
    );

    // Convert to Hex
    return Array.from(new Uint8Array(signature))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}
