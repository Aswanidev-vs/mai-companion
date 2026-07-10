import type { Env, GitHubWebhookEvent } from "../types/index.ts";
import { postComment } from "../github/client.ts";
import { reviewIssue } from "../gemini/review.ts";
import { validateResponse } from "../gemini/validate.ts";
import { logger } from "../utils/logger.ts";

export async function handleIssue(
  env: Env,
  event: GitHubWebhookEvent,
  installationId: number
): Promise<void> {
  if (event.action !== "opened" || !event.issue || !event.repository) {
    return;
  }

  const { owner, repo } = parseRepoName(event.repository.full_name);
  const issue = event.issue;

  logger.info("Processing new issue", {
    owner,
    repo,
    number: issue.number,
    title: issue.title,
  });

  try {
    const response = await reviewIssue(
      env.GEMINI_API_KEY,
      issue.title,
      issue.body || "",
      issue.labels.map((l) => l.name)
    );

    const { clean, warnings } = validateResponse(response);

    const comment = formatIssueComment(clean, warnings);

    await postComment(env, installationId, owner, repo, issue.number, comment);

    logger.info("Issue review posted", { owner, repo, number: issue.number });
  } catch (error) {
    logger.error("Failed to review issue", {
      owner,
      repo,
      number: issue.number,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

function parseRepoName(fullName: string): { owner: string; repo: string } {
  const [owner, repo] = fullName.split("/");
  return { owner: owner!, repo: repo! };
}

function formatIssueComment(review: string, warnings: string[]): string {
  let footer = "\n---\n*Reviewed by [mai-companion](https://github.com/apps/mai-companion)*";
  if (warnings.length > 0) {
    footer += `\n> Note: ${warnings.length} potential accuracy issue(s) detected. Please verify references.`;
  }
  return `### mai-companion Review\n\n${review}\n${footer}`;
}
