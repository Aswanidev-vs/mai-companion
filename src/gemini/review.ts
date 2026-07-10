import { generateContent } from "./client.ts";
import {
  SYSTEM_INSTRUCTION,
  issueReviewPrompt,
  prReviewPrompt,
  commentReplyPrompt,
  codeExplanationPrompt,
} from "./prompts.ts";
import type { GitHubFile } from "../types/index.ts";

export async function reviewIssue(
  apiKey: string,
  title: string,
  body: string,
  labels: string[]
): Promise<string> {
  const prompt = issueReviewPrompt(title, body, labels);
  return generateContent(apiKey, { prompt, search: true, systemInstruction: SYSTEM_INSTRUCTION });
}

export async function reviewPullRequest(
  apiKey: string,
  title: string,
  body: string,
  files: GitHubFile[]
): Promise<string> {
  const prompt = prReviewPrompt(title, body, files);
  return generateContent(apiKey, { prompt, search: true, systemInstruction: SYSTEM_INSTRUCTION });
}

export async function replyToMention(
  apiKey: string,
  issueTitle: string,
  commentBody: string,
  context: string
): Promise<string> {
  const prompt = commentReplyPrompt(issueTitle, commentBody, context);
  return generateContent(apiKey, { prompt, search: true, systemInstruction: SYSTEM_INSTRUCTION });
}

export async function explainCode(
  apiKey: string,
  filename: string,
  patch: string
): Promise<string> {
  const prompt = codeExplanationPrompt(filename, patch);
  return generateContent(apiKey, { prompt, search: false, systemInstruction: SYSTEM_INSTRUCTION });
}
