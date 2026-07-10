import type { Env } from "./types/index.ts";
import { parseWebhook } from "./github/webhook.ts";
import { handleIssue } from "./handlers/issues.ts";
import { handlePullRequest } from "./handlers/pullRequests.ts";
import { handleIssueComment } from "./handlers/issueComments.ts";
import { handleReview } from "./handlers/reviews.ts";
import { logger } from "./utils/logger.ts";
import { jsonResponse, errorResponse, textResponse } from "./utils/response.ts";
import { validateEnv } from "./utils/env.ts";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/" && request.method === "GET") {
      return jsonResponse({
        name: "mai-companion",
        status: "running",
        version: "1.0.0",
      });
    }

    if (url.pathname === "/health" && request.method === "GET") {
      return textResponse("ok");
    }

    if (url.pathname === "/webhook" && request.method === "POST") {
      try {
        validateEnv(env);
      } catch (error) {
        logger.error("Environment validation failed", {
          error: error instanceof Error ? error.message : String(error),
        });
        return errorResponse("Server configuration error", 500);
      }

      const parsed = await parseWebhook(request, env);

      if (!parsed) {
        return textResponse("Skipped", { status: 200 });
      }

      const { event, eventType, installationId } = parsed;

      try {
        switch (eventType) {
          case "issues":
            await handleIssue(env, event, installationId);
            break;
          case "pull_request":
            await handlePullRequest(env, event, installationId);
            break;
          case "issue_comment":
            await handleIssueComment(env, event, installationId);
            break;
          case "pull_request_review":
          case "pull_request_review_comment":
            await handleReview(env, event, installationId);
            break;
          default:
            logger.debug("Unhandled event type", { eventType });
        }

        return textResponse("Processed");
      } catch (error) {
        logger.error("Webhook handler error", {
          eventType,
          error: error instanceof Error ? error.message : String(error),
        });
        return errorResponse("Internal error", 500);
      }
    }

    return errorResponse("Not found", 404);
  },
};
