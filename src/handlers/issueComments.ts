import type { Env, GitHubWebhookEvent } from "../types/index.ts";
import { replyToComment } from "../github/client.ts";
import { replyToMention } from "../gemini/review.ts";
import { validateResponse } from "../gemini/validate.ts";
import { logger } from "../utils/logger.ts";

const MENTION_PATTERN = /@mai-companion\b/i;

export async function handleIssueComment(
  env: Env,
  event: GitHubWebhookEvent,
  installationId: number
): Promise<void> {
  if (event.action !== "created" || !event.comment || !event.repository) {
    return;
  }

  const { owner, repo } = parseRepoName(event.repository.full_name);
  const comment = event.comment;

  if (!MENTION_PATTERN.test(comment.body)) {
    return;
  }

  logger.info("mai-companion mentioned in comment", {
    owner,
    repo,
    commentId: comment.id,
  });

  try {
    const issueTitle = event.issue?.title || "Unknown issue";
    const context = event.pull_request
      ? `This is a pull request (#${event.pull_request.number})`
      : `This is issue #${event.issue?.number || "unknown"}`;

    const response = await replyToMention(
      env.GEMINI_API_KEY,
      issueTitle,
      comment.body,
      context
    );

    const { clean, warnings } = validateResponse(response);

    const replyBody = formatMentionReply(clean, warnings);

    await replyToComment(env, installationId, owner, repo, comment.id, replyBody);

    logger.info("Reply posted to mention", {
      owner,
      repo,
      commentId: comment.id,
    });
  } catch (error) {
    logger.error("Failed to reply to mention", {
      owner,
      repo,
      commentId: comment.id,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

function parseRepoName(fullName: string): { owner: string; repo: string } {
  const [owner, repo] = fullName.split("/");
  return { owner: owner!, repo: repo! };
}

function formatMentionReply(response: string, warnings: string[]): string {
  let footer = "\n---\n*Reply from [mai-companion](https://github.com/apps/mai-companion)*";
  if (warnings.length > 0) {
    footer += `\n> Note: ${warnings.length} potential accuracy issue(s) detected. Please verify references.`;
  }
  return `${response}\n${footer}`;
}
