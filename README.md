# mai-companion

A calm, intelligent GitHub companion that automatically reviews issues, pull requests, and discussions using the Gemini API. Built with Cloudflare Workers and TypeScript.

## Features

- **Automatic Issue Review** — Analyzes new issues and posts helpful, structured comments
- **Pull Request Reviews** — Reviews PR diffs and provides actionable feedback
- **Mention Responses** — Replies when `@mai-companion` is mentioned in comments
- **Webhook Verification** — Validates GitHub webhook signatures using HMAC-SHA256
- **Token Caching** — Caches installation tokens and refreshes them before expiry
- **Retry Logic** — Exponential backoff for Gemini API calls with rate limit handling

## Tech Stack

- Cloudflare Workers
- TypeScript (strict mode)
- GitHub App API
- GitHub Webhooks
- Google Gemini API

## Prerequisites

- Node.js 18+
- A [GitHub App](https://docs.github.com/en/apps/creating-github-apps/about-creating-github-apps/about-creating-github-apps) with appropriate permissions
- A [Google AI Studio](https://aistudio.google.com/) API key

## Installation

```bash
git clone https://github.com/your-org/mai-companion.git
cd mai-companion
npm install
```

## GitHub App Configuration

### Create the GitHub App

1. Go to **Settings → Developer settings → GitHub Apps → New GitHub App**
2. Set the following:

| Field | Value |
|-------|-------|
| GitHub App name | `mai-companion` |
| Homepage URL | Your deployment URL |
| Webhook URL | `https://mai-companion.<your-subdomain>.workers.dev/webhook` |
| Webhook secret | Generate a secure secret (save for later) |

### Required Permissions

| Permission | Access |
|------------|--------|
| Contents | Read-only |
| Issues | Read and write |
| Pull requests | Read and write |
| Metadata | Read-only |

### Subscribe to Events

- [x] Issues
- [x] Issue comments
- [x] Pull requests
- [x] Pull request reviews
- [x] Pull request review comments

### Save Credentials

After creating the app:
1. Note the **App ID** from the app settings page
2. Generate a **private key** and save the `.pem` file

## Cloudflare Setup

### Authenticate

```bash
wrangler login
```

### Set Secrets

```bash
wrangler secret put GEMINI_API_KEY
wrangler secret put GITHUB_APP_ID
wrangler secret put GITHUB_PRIVATE_KEY
wrangler secret put GITHUB_WEBHOOK_SECRET
```

For `GITHUB_PRIVATE_KEY`, paste the entire contents of your `.pem` file.

### Deploy

```bash
npm run deploy
```

## Local Development

```bash
npm run dev
```

This starts a local development server at `http://localhost:8787`.

### Testing Webhooks Locally

Use the [Smee.io](https://smee.io/) webhook proxy or the [GitHub CLI](https://cli.github.com/) to forward webhooks to your local server:

```bash
smee --url https://smee.io/your-channel --target http://localhost:8787/webhook
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GEMINI_API_KEY` | Google AI Studio API key | Yes |
| `GITHUB_APP_ID` | GitHub App ID | Yes |
| `GITHUB_PRIVATE_KEY` | GitHub App private key (PEM format) | Yes |
| `GITHUB_WEBHOOK_SECRET` | Webhook secret configured in the GitHub App | Yes |

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Status check |
| GET | `/health` | Health check |
| POST | `/webhook` | GitHub webhook receiver |

## Project Structure

```
mai-companion/
├── src/
│   ├── index.ts              # Worker entry point
│   ├── github/
│   │   ├── auth.ts           # JWT generation & token management
│   │   ├── client.ts         # GitHub API client
│   │   ├── installation.ts   # Installation resolution
│   │   ├── verify.ts         # Webhook signature verification
│   │   └── webhook.ts        # Webhook parsing & routing
│   ├── gemini/
│   │   ├── client.ts         # Gemini API client with retries
│   │   ├── prompts.ts        # Prompt templates
│   │   └── review.ts         # Review orchestration
│   ├── handlers/
│   │   ├── issues.ts         # Issue event handler
│   │   ├── pullRequests.ts   # PR event handler
│   │   ├── issueComments.ts  # Comment handler (mentions)
│   │   └── reviews.ts        # Review event handler
│   ├── utils/
│   │   ├── logger.ts         # Structured JSON logging
│   │   ├── response.ts       # HTTP response helpers
│   │   └── env.ts            # Environment validation
│   └── types/
│       └── index.ts          # TypeScript interfaces
├── wrangler.jsonc            # Cloudflare Workers config
├── package.json
├── tsconfig.json
└── README.md
```

## Troubleshooting

### Webhook not receiving events

1. Verify the webhook URL in your GitHub App settings
2. Confirm `GITHUB_WEBHOOK_SECRET` matches the secret in your GitHub App
3. Check Cloudflare Workers logs: `wrangler tail`

### Gemini API errors

1. Verify `GEMINI_API_KEY` is set correctly
2. Check API quotas at [Google AI Studio](https://aistudio.google.com/)
3. Review logs for specific error messages

### Token authentication failures

1. Ensure `GITHUB_PRIVATE_KEY` includes the full PEM content (with headers)
2. Verify `GITHUB_APP_ID` matches your app
3. Check that the app is installed on the target repository

### Type errors

```bash
npm run typecheck
```

## License

MIT
