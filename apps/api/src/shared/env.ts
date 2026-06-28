const WEAK_SECRET_PATTERNS = [
    "change-me",
    "secret",
    "password",
    "123456",
    "qwerty",
    "default",
];

function assertStrongSecret(value: string | undefined, name: string, minBytes = 32): string {
    if (!value) {
        throw new Error(`${name} is required. Generate one: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`);
    }

    // Reject weak / placeholder values
    const lower = value.toLowerCase();
    for (const pattern of WEAK_SECRET_PATTERNS) {
        if (lower.includes(pattern)) {
            throw new Error(`${name} contains a weak pattern ("${pattern}"). Use a strong random secret (min ${minBytes} bytes).`);
        }
    }

    // Enforce minimum entropy (hex string = 2 chars per byte)
    if (value.length < minBytes * 2) {
        throw new Error(`${name} must be at least ${minBytes} bytes (${minBytes * 2} hex characters). Got ${value.length} chars.`);
    }

    return value;
}

export function validateEnv(): void {
    const required = [
        "DATABASE_URL",
        "JWT_SECRET",
        "REFRESH_TOKEN_SECRET",
    ];

    const missing = required.filter((key) => !process.env[key]);

    if (missing.length > 0) {
        throw new Error(
            `Missing required environment variables: ${missing.join(", ")}\n\n` +
            `Generate secrets on your local machine:\n` +
            `  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"\n\n` +
            `Then set them in Railway Dashboard → Variables.\n` +
            `Railway auto-injects DATABASE_URL — you only need to set JWT_SECRET, REFRESH_TOKEN_SECRET, COOKIE_SECRET, and ENCRYPTION_KEY.`
        );
    }

    const port = Number(process.env.PORT);
    if (process.env.PORT && (isNaN(port) || port < 1 || port > 65535)) {
        throw new Error(`Invalid PORT: ${process.env.PORT}`);
    }

    assertStrongSecret(process.env.JWT_SECRET, "JWT_SECRET");
    assertStrongSecret(process.env.REFRESH_TOKEN_SECRET, "REFRESH_TOKEN_SECRET");

    const cookieSecret = process.env.COOKIE_SECRET;
    if (cookieSecret) {
        assertStrongSecret(cookieSecret, "COOKIE_SECRET");
    } else {
        console.warn("WARNING: COOKIE_SECRET not set. Session cookies will not be signed. Set a strong random value.");
    }

    if (process.env.JWT_SECRET === process.env.REFRESH_TOKEN_SECRET) {
        throw new Error("JWT_SECRET and REFRESH_TOKEN_SECRET must be different values.");
    }

    const encryptionKey = process.env.ENCRYPTION_KEY;
    if (process.env.NODE_ENV === "production") {
        if (!encryptionKey) {
            throw new Error("ENCRYPTION_KEY is required in production. Generate one: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"");
        }
        if (!/^[0-9a-f]{64}$/i.test(encryptionKey)) {
            throw new Error("ENCRYPTION_KEY must be a 64-character hex string (32 bytes).");
        }
    } else if (encryptionKey) {
        if (!/^[0-9a-f]{64}$/i.test(encryptionKey)) {
            throw new Error("ENCRYPTION_KEY must be a 64-character hex string (32 bytes).");
        }
    } else {
        console.warn("WARNING: ENCRYPTION_KEY not set. PII fields (national_id, phone) will be stored in plain text. Set a 64-char hex key in production.");
    }
}
