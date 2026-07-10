export interface Env {
  GEMINI_API_KEY: string;
  GITHUB_APP_ID: string;
  GITHUB_PRIVATE_KEY: string;
  GITHUB_WEBHOOK_SECRET: string;
}

export interface GitHubWebhookEvent {
  action: string;
  number?: number;
  pull_request?: GitHubPullRequest;
  issue?: GitHubIssue;
  comment?: GitHubComment;
  review?: GitHubReview;
  repository?: GitHubRepository;
  installation?: { id: number };
  sender?: GitHubUser;
}

export interface GitHubPullRequest {
  number: number;
  title: string;
  body: string | null;
  html_url: string;
  diff_url: string;
  state: string;
  user: GitHubUser;
  head: { sha: string; ref: string };
  base: { ref: string };
  changed_files?: number;
  additions?: number;
  deletions?: number;
}

export interface GitHubIssue {
  number: number;
  title: string;
  body: string | null;
  html_url: string;
  state: string;
  user: GitHubUser;
  labels: Array<{ name: string; color: string }>;
}

export interface GitHubComment {
  id: number;
  body: string;
  html_url: string;
  user: GitHubUser;
  created_at: string;
}

export interface GitHubReview {
  id: number;
  body: string | null;
  state: string;
  html_url: string;
  user: GitHubUser;
}

export interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
}

export interface GitHubRepository {
  full_name: string;
  html_url: string;
  default_branch: string;
}

export interface GitHubFile {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  patch?: string;
}

export interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{ text: string }>;
    };
  }>;
}

export interface InstallationToken {
  token: string;
  expiresAt: number;
}
