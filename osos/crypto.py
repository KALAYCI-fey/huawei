"""ARiL / OEDAŞ OSOS portal encryption (same scheme as the customer web UI)."""

from __future__ import annotations

import base64
import json
import secrets
from typing import Any

from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives.padding import PKCS7

# Hardcoded in the public Angular bundle for login / nologin / forgotPassword.
LOGIN_PASSPHRASE = b"nQ16mjwHIrpH9IVobutgTTms8TuibkFagoWMNWguRckcqxQ"

KEY_SIZE = 16  # AES-128
PBKDF2_ITERATIONS = 1000


def _derive_key(passphrase: bytes, salt: bytes) -> bytes:
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA1(),
        length=KEY_SIZE,
        salt=salt,
        iterations=PBKDF2_ITERATIONS,
    )
    return kdf.derive(passphrase)


def encrypt(payload: Any, passphrase: bytes) -> str:
    """Encrypt a JSON-serializable object the way the portal client does."""
    plaintext = json.dumps(payload, separators=(",", ":"), ensure_ascii=False)
    salt = secrets.token_bytes(16)
    iv = secrets.token_bytes(16)
    key = _derive_key(passphrase, salt)
    padder = PKCS7(128).padder()
    data = padder.update(plaintext.encode("utf-8")) + padder.finalize()
    encryptor = Cipher(algorithms.AES(key), modes.CBC(iv)).encryptor()
    ciphertext = encryptor.update(data) + encryptor.finalize()
    return salt.hex() + iv.hex() + base64.b64encode(ciphertext).decode("ascii")


def decrypt(blob: str, passphrase: bytes) -> Any:
    """Decrypt a portal response body into JSON."""
    if not isinstance(blob, str) or len(blob) < 64:
        return json.loads(blob)
    salt = bytes.fromhex(blob[:32])
    iv = bytes.fromhex(blob[32:64])
    ciphertext = base64.b64decode(blob[64:])
    key = _derive_key(passphrase, salt)
    decryptor = Cipher(algorithms.AES(key), modes.CBC(iv)).decryptor()
    padded = decryptor.update(ciphertext) + decryptor.finalize()
    unpadder = PKCS7(128).unpadder()
    plaintext = unpadder.update(padded) + unpadder.finalize()
    return json.loads(plaintext.decode("utf-8"))
