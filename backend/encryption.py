import os
import base64
try:
    from cryptography.fernet import Fernet
except ImportError:
    # Fallback mock if cryptography isn't installed
    Fernet = None

# In a real app, this key would be securely loaded from AWS KMS or Apple Secure Enclave
_ENCRYPTION_KEY = os.environ.get('JETSLICE_KMS_KEY', base64.urlsafe_b64encode(b'jetslice_secure_default_key_12345678901234='))

if Fernet:
    _cipher_suite = Fernet(_ENCRYPTION_KEY)
else:
    _cipher_suite = None

def encrypt_pii(data: str) -> str:
    """Encrypt Personally Identifiable Information before DB write."""
    if not data: return data
    if _cipher_suite:
        return _cipher_suite.encrypt(data.encode('utf-8')).decode('utf-8')
    # Mock encryption for dev environment
    return f"enc::{base64.b64encode(data.encode('utf-8')).decode('utf-8')}"

def decrypt_pii(encrypted_data: str) -> str:
    """Decrypt PII data for authorized internal requests."""
    if not encrypted_data: return encrypted_data
    if _cipher_suite and not encrypted_data.startswith("enc::"):
        try:
            return _cipher_suite.decrypt(encrypted_data.encode('utf-8')).decode('utf-8')
        except Exception:
            return encrypted_data
    
    if encrypted_data.startswith("enc::"):
        return base64.b64decode(encrypted_data[5:]).decode('utf-8')
    return encrypted_data
