import type { Env, InstallationToken } from "../types/index.ts";
import { logger } from "../utils/logger.ts";

const TOKEN_CACHE = new Map<string, InstallationToken>();

interface JWTHeader {
  alg: string;
  typ: string;
}

interface JWTClaims {
  iat: number;
  exp: number;
  iss: string;
}

function base64UrlEncode(data: string): string {
  return btoa(data).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlEncodeBytes(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return base64UrlEncode(binary);
}

async function importPrivateKey(pem: string): Promise<CryptoKey> {
  const pemContents = pem
    .replace(/-----BEGIN.*?-----/, "")
    .replace(/-----END.*?-----/, "")
    .replace(/\s/g, "");

  const binaryString = atob(pemContents);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return crypto.subtle.importKey(
    "pkcs8",
    bytes,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );
}

export async function generateJwt(appId: string, privateKey: string): Promise<string> {
  const header: JWTHeader = { alg: "RS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const claims: JWTClaims = {
    iat: now - 60,
    exp: now + 600,
    iss: appId,
  };

  const headerEncoded = base64UrlEncode(JSON.stringify(header));
  const claimsEncoded = base64UrlEncode(JSON.stringify(claims));
  const signingInput = `${headerEncoded}.${claimsEncoded}`;

  const key = await importPrivateKey(privateKey);
  const encoder = new TextEncoder();
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    encoder.encode(signingInput)
  );

  const signatureEncoded = base64UrlEncodeBytes(new Uint8Array(signature));
  return `${signingInput}.${signatureEncoded}`;
}

export async function getInstallationToken(
  env: Env,
  installationId: number
): Promise<string> {
  const cacheKey = `${env.GITHUB_APP_ID}:${installationId}`;
  const cached = TOKEN_CACHE.get(cacheKey);

  if (cached && cached.expiresAt > Date.now() + 60_000) {
    return cached.token;
  }

  const jwt = await generateJwt(env.GITHUB_APP_ID, env.GITHUB_PRIVATE_KEY);

  logger.info("Requesting installation token", { installationId });

  const response = await fetch(
    `https://api.github.com/app/installations/${installationId}/access_tokens`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${jwt}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    }
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Failed to get installation token: ${response.status} ${body}`
    );
  }

  const data = (await response.json()) as { token: string; expires_at: string };
  const expiresAt = new Date(data.expires_at).getTime();

  TOKEN_CACHE.set(cacheKey, { token: data.token, expiresAt });

  logger.info("Installation token cached", {
    installationId,
    expiresAt: data.expires_at,
  });

  return data.token;
}
