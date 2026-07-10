import { logger } from "../utils/logger.ts";

const RELEVANT_EVENTS = [
  "issues",
  "issue_comment",
  "pull_request",
  "pull_request_review",
  "pull_request_review_comment",
] as const;

export type GitHubEventType = (typeof RELEVANT_EVENTS)[number];

export function parseWebhookHeaders(headers: Headers): {
  signature: string | null;
  eventType: GitHubEventType | null;
  deliveryId: string | null;
} {
  return {
    signature: headers.get("x-hub-signature-256"),
    eventType: headers.get("x-github-event") as GitHubEventType | null,
    deliveryId: headers.get("x-github-delivery"),
  };
}

export function isRelevantEvent(eventType: string | null): eventType is GitHubEventType {
  return eventType !== null && (RELEVANT_EVENTS as readonly string[]).includes(eventType);
}

export async function verifyWebhookSignature(
  payload: string,
  signature: string | null,
  secret: string
): Promise<boolean> {
  if (!signature) {
    logger.warn("Missing webhook signature");
    return false;
  }

  const expectedPrefix = "sha256=";
  if (!signature.startsWith(expectedPrefix)) {
    logger.warn("Invalid signature format");
    return false;
  }

  const signatureHex = signature.slice(expectedPrefix.length);
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signatureBytes = new Uint8Array(
    signatureHex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
  );

  const payloadBytes = encoder.encode(payload);
  const computedSignature = await crypto.subtle.sign("HMAC", key, payloadBytes);
  const computedBytes = new Uint8Array(computedSignature);

  if (signatureBytes.length !== computedBytes.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < signatureBytes.length; i++) {
    result |= signatureBytes[i]! ^ computedBytes[i]!;
  }

  return result === 0;
}
