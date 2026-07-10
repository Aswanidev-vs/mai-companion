import type { Env, GitHubWebhookEvent } from "../types/index.ts";
import { parseWebhookHeaders, verifyWebhookSignature, isRelevantEvent } from "./verify.ts";
import { logger } from "../utils/logger.ts";

export async function parseWebhook(
  request: Request,
  env: Env
): Promise<{
  event: GitHubWebhookEvent;
  eventType: string;
  installationId: number;
} | null> {
  const { signature, eventType, deliveryId } = parseWebhookHeaders(request.headers);

  if (!eventType) {
    logger.warn("Missing event type header");
    return null;
  }

  if (!isRelevantEvent(eventType)) {
    logger.debug("Ignoring irrelevant event", { eventType });
    return null;
  }

  const payload = await request.text();

  const isValid = await verifyWebhookSignature(payload, signature, env.GITHUB_WEBHOOK_SECRET);
  if (!isValid) {
    logger.warn("Invalid webhook signature", { deliveryId });
    return null;
  }

  const event = JSON.parse(payload) as GitHubWebhookEvent;

  const installationId = event.installation?.id;
  if (!installationId) {
    logger.warn("Missing installation ID", { eventType, deliveryId });
    return null;
  }

  logger.info("Webhook verified", {
    eventType,
    action: event.action,
    deliveryId,
    installationId,
  });

  return { event, eventType, installationId };
}
