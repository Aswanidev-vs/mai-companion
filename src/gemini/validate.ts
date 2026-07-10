import type { GitHubFile } from "../types/index.ts";
import { logger } from "../utils/logger.ts";

const FILE_REF_PATTERN = /(?:`|(?<=\s))([a-zA-Z0-9_\-./]+\.(?:ts|tsx|js|jsx|py|go|rs|java|rb|css|html|json|yaml|yml|md|toml))(?:`|(?=\s|[,:)]))/g;
const LINE_REF_PATTERN = /(?:(`[^`]+`)|(\S+\.(?:ts|tsx|js|jsx|py|go|rs|java|rb)))[\s:]*(?:line|L)?\s*(\d+)/gi;
const URL_PATTERN = /https?:\/\/[^\s)>\]]+/g;
const ISSUE_REF_PATTERN = /(?:^|\s)#(\d+)/gm;

interface ValidationResult {
  clean: string;
  warnings: string[];
}

export function validateResponse(
  response: string,
  files?: GitHubFile[]
): ValidationResult {
  const warnings: string[] = [];

  if (!files || files.length === 0) {
    return { clean: response, warnings };
  }

  const validFilenames = new Set(files.map((f) => f.filename));

  const fileRefs = response.matchAll(FILE_REF_PATTERN);
  for (const match of fileRefs) {
    const ref = match[1];
    if (ref && !validFilenames.has(ref) && !isCommonNonFile(ref)) {
      warnings.push(`Possibly hallucinated file reference: ${ref}`);
    }
  }

  const urlMatches = response.matchAll(URL_PATTERN);
  for (const match of urlMatches) {
    const url = match[0];
    if (url && looksFabricated(url)) {
      warnings.push(`Possibly fabricated URL: ${url}`);
    }
  }

  if (warnings.length > 0) {
    logger.warn("Response validation warnings", { warnings });
  }

  return { clean: response, warnings };
}

function isCommonNonFile(ref: string): boolean {
  const nonFiles = [
    "package.json",
    "tsconfig.json",
    "wrangler.jsonc",
    "README.md",
    ".gitignore",
    "CHANGELOG.md",
    "LICENSE",
  ];
  return nonFiles.includes(ref) || ref.startsWith(".") || ref.includes("node_modules");
}

function looksFabricated(url: string): boolean {
  const knownDomains = [
    "github.com",
    "developer.mozilla.org",
    "docs.github.com",
    "google.dev",
    "ai.google.dev",
    "typescriptlang.org",
    "nodejs.org",
    "npmjs.com",
    "stackoverflow.com",
  ];

  try {
    const parsed = new URL(url);
    return !knownDomains.some((d) => parsed.hostname.endsWith(d));
  } catch {
    return true;
  }
}
