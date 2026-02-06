from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import padding, rsa
from cryptography.hazmat.primitives import serialization
from cryptography.exceptions import InvalidSignature
import base64

def verify_signature(public_key_pem: str, message: str, signature_hex: str) -> bool:
    """
    Verifies that 'signature_hex' is the valid signature of 'message' signed by 'public_key_pem'.
    Uses RSA-PSS with SHA256 (matching WebCrypto).
    """
    try:
        # 1. Load Public Key
        # If it's pure Base64 (from WebCrypto export), we might need to wrap it in PEM headers
        # or load it as DER. Frontend sends SPKI (SubjectPublicKeyInfo)
        
        # Helper: Ensure PEM formatting
        clean_key = public_key_pem.replace("-----BEGIN PUBLIC KEY-----", "").replace("-----END PUBLIC KEY-----", "").strip()
        der_data = base64.b64decode(clean_key)
        
        public_key = serialization.load_der_public_key(der_data)

        # 2. Decode Signature (Hex -> Bytes)
        signature_bytes = bytes.fromhex(signature_hex)
        
        # 3. Verify
        # WebCrypto default: RSA-PSS, saltLength=32
        public_key.verify(
            signature_bytes,
            message.encode('utf-8'),
            padding.PSS(
                mgf=padding.MGF1(hashes.SHA256()),
                salt_length=32
            ),
            hashes.SHA256()
        )
        return True
    
    except InvalidSignature:
        print("❌ Invalid Signature")
        return False
    except Exception as e:
        print(f"❌ Crypto Error: {e}")
        return False
