# Security notes

The lock screen is not an HTTP authentication gateway. Only the planner code and data contained in the encrypted bundle are private-at-rest; public files and original GitHub history remain publicly accessible. The browser derives a key with PBKDF2-SHA256 and decrypts AES-256-GCM locally. No unlock secret is stored in JavaScript, URL parameters, source maps, or the repository.

For strong identity-based access control, use Cloudflare Access or equivalent authentication in front of hosting, and consider a private repository with fresh history. Cached or externally copied historical source cannot be recalled reliably.