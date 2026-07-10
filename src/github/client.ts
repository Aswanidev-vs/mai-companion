import type { Env, GitHubFile } from "../types/index.ts";
import { getInstallationToken } from "./auth.ts";

export async function githubFetch(
  env: Env,
  installationId: number,
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = await getInstallationToken(env, installationId);

  return fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...options.headers,
    },
  });
}

export async function postComment(
  env: Env,
  installationId: number,
  owner: string,
  repo: string,
  issueNumber: number,
  body: string
): Promise<void> {
  const url = `https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}/comments`;

  const response = await githubFetch(env, installationId, url, {
    method: "POST",
    body: JSON.stringify({ body }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to post comment: ${response.status} ${text}`);
  }
}

export async function createReview(
  env: Env,
  installationId: number,
  owner: string,
  repo: string,
  pullNumber: number,
  body: string,
  event: "APPROVE" | "REQUEST_CHANGES" | "COMMENT" = "COMMENT",
  comments?: Array<{ path: string; line: number; body: string }>
): Promise<void> {
  const url = `https://api.github.com/repos/${owner}/${repo}/pulls/${pullNumber}/reviews`;

  const response = await githubFetch(env, installationId, url, {
    method: "POST",
    body: JSON.stringify({ body, event, comments }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to create review: ${response.status} ${text}`);
  }
}

export async function getPullRequestFiles(
  env: Env,
  installationId: number,
  owner: string,
  repo: string,
  pullNumber: number
): Promise<GitHubFile[]> {
  const url = `https://api.github.com/repos/${owner}/${repo}/pulls/${pullNumber}/files?per_page=100`;

  const response = await githubFetch(env, installationId, url);

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to get PR files: ${response.status} ${text}`);
  }

  return (await response.json()) as GitHubFile[];
}

export async function replyToComment(
  env: Env,
  installationId: number,
  owner: string,
  repo: string,
  commentId: number,
  body: string
): Promise<void> {
  const url = `https://api.github.com/repos/${owner}/${repo}/issues/comments/${commentId}/replies`;

  const response = await githubFetch(env, installationId, url, {
    method: "POST",
    body: JSON.stringify({ body }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to reply to comment: ${response.status} ${text}`);
  }
}
