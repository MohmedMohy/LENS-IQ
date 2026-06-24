import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

function getEncryptionKey(): Buffer {
    const key = process.env.ENCRYPTION_KEY;
    if (!key) {
        throw new Error("ENCRYPTION_KEY is required. Generate one: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"");
    }
    return Buffer.from(key, "hex");
}

export function encrypt(plainText: string): string {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(plainText, "utf8", "hex");
    encrypted += cipher.final("hex");
    const authTag = cipher.getAuthTag().toString("hex");

    return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

export function decrypt(cipherText: string): string {
    const key = getEncryptionKey();
    const parts = cipherText.split(":");
    if (parts.length !== 3) throw new Error("Invalid encrypted format");

    const iv = Buffer.from(parts[0], "hex");
    const authTag = Buffer.from(parts[1], "hex");
    const encrypted = parts[2];

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
}

export function mask(value: string, visibleStart = 0, visibleEnd = 4): string {
    if (!value) return "";
    if (value.length <= visibleStart + visibleEnd) {
        return value.slice(0, visibleStart) + "*".repeat(Math.max(1, value.length - visibleStart - visibleEnd)) + value.slice(-visibleEnd);
    }
    return value.slice(0, visibleStart) + "*".repeat(value.length - visibleStart - visibleEnd) + value.slice(-visibleEnd);
}
