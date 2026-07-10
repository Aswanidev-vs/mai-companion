import type { Env, GitHubWebhookEvent } from "../types/index.ts";
import { postComment } from "../github/client.ts";
import { logger } from "../utils/logger.ts";

export async function handleReview(
  _env: Env,
  event: GitHubWebhookEvent,
  _installationId: number
): Promise<void> {
  if (!event.review || !event.repository) {
    return;
  }

  const { owner, repo } = parseRepoName(event.repository.full_name);

  logger.info("Review event received", {
    owner,
    repo,
    action: event.action,
    reviewState: event.review.state,
    reviewUser: event.review.user.login,
  });
}

function parseRepoName(fullName: string): { owner: string; repo: string } {
  const [owner, repo] = fullName.split("/");
  return { owner: owner!, repo: repo! };
}
