import type { Env, GitHubWebhookEvent } from "../types/index.ts";
import { createReview, getPullRequestFiles } from "../github/client.ts";
import { reviewPullRequest } from "../gemini/review.ts";
import { validateResponse } from "../gemini/validate.ts";
import { logger } from "../utils/logger.ts";

export async function handlePullRequest(
  env: Env,
  event: GitHubWebhookEvent,
  installationId: number
): Promise<void> {
  if (event.action !== "opened" || !event.pull_request || !event.repository) {
    return;
  }

  const { owner, repo } = parseRepoName(event.repository.full_name);
  const pr = event.pull_request;

  logger.info("Processing new pull request", {
    owner,
    repo,
    number: pr.number,
    title: pr.title,
  });

  try {
    const files = await getPullRequestFiles(env, installationId, owner, repo, pr.number);

    const response = await reviewPullRequest(
      env.GEMINI_API_KEY,
      pr.title,
      pr.body || "",
      files
    );

    const { clean, warnings } = validateResponse(response, files);

    const reviewBody = formatPrReview(clean, files.length, warnings);

    await createReview(env, installationId, owner, repo, pr.number, reviewBody, "COMMENT");

    logger.info("PR review posted", { owner, repo, number: pr.number });
  } catch (error) {
    logger.error("Failed to review pull request", {
      owner,
      repo,
      number: pr.number,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

function parseRepoName(fullName: string): { owner: string; repo: string } {
  const [owner, repo] = fullName.split("/");
  return { owner: owner!, repo: repo! };
}

function formatPrReview(review: string, fileCount: number, warnings: string[]): string {
  let footer = `\n---\n*Reviewed ${fileCount} file${fileCount !== 1 ? "s" : ""} · [mai-companion](https://github.com/apps/mai-companion)*`;
  if (warnings.length > 0) {
    footer += `\n> Note: ${warnings.length} potential accuracy issue(s) detected. Please verify references.`;
  }
  return `### mai-companion Review\n\n${review}\n${footer}`;
}
