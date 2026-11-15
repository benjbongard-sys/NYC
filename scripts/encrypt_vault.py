"""Encrypt private NOUX modules; NEVER commit plaintext modules or passphrase to GitHub.

Usage: set NOUX_PASSPHRASE in your shell environment and run this script locally.
The repository needs only the generated assets/private.vault.json ciphertext.
"""
import base64,hashlib,json,os,pathlib
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
ROOT=pathlib.Path(__file__).resolve().parents[1]
FILES=['data.js','itinerary.js','mta.js','routeplanner.js','photo-sources.js','custom-stops.js','app.js']
passphrase=os.environ.get('NOUX_PASSPHRASE')
if not passphrase: raise SystemExit('NOUX_PASSPHRASE must be supplied locally; never commit it.')
plain=json.dumps({name:(ROOT/name).read_text() for name in FILES},ensure_ascii=False,separators=(',',':')).encode('utf-8')
salt=os.urandom(20);iv=os.urandom(12);rounds=320000
key=hashlib.pbkdf2_hmac('sha256',passphrase.encode(),salt,rounds,32)
ct=AESGCM(key).encrypt(iv,plain,b'NOUX-NYC-PRIVATE-V1')
b64=lambda x:base64.b64encode(x).decode()
payload={'version':1,'algorithm':'AES-256-GCM','kdf':'PBKDF2-SHA256','iterations':rounds,'salt':b64(salt),'iv':b64(iv),'ct':b64(ct)}
( ROOT/'assets').mkdir(exist_ok=True)
(ROOT/'assets/private.vault.json').write_text(json.dumps(payload,separators=(',',':')))
print('Encrypted',len(FILES),'private modules. Ciphertext length',len(ct),'bytes. No secret in output metadata.')