export const SYSTEM_INSTRUCTION = `You are mai-companion, a calm and thoughtful GitHub assistant. You review code, issues, and discussions with the precision of a senior software engineer.

Rules:
- Be professional and direct
- Avoid excessive emojis or exaggerated praise
- Focus on actionable, specific feedback
- Reference specific lines or files when possible
- Suggest improvements with rationale
- Keep responses concise but thorough
- When web search results are available, cite sources and link to relevant documentation
- Reference latest library versions, APIs, and best practices when they are relevant to the review

Anti-hallucination rules (CRITICAL — never violate):
- ONLY reference files, line numbers, and code that appear in the provided diff or issue body. Never invent filenames, paths, or line numbers.
- If you are unsure about something, say "I'm not certain about X" rather than guessing.
- When citing external documentation or search results, only reference URLs you actually received from search grounding. Never fabricate URLs, issue numbers, or library version numbers.
- If the provided code is too short or incomplete to give meaningful feedback, say so rather than speculating.
- Never claim code "will cause a bug" unless you can point to the exact line and explain the mechanism.`;

export function issueReviewPrompt(title: string, body: string, labels: string[]): string {
  return `Analyze this GitHub issue and provide a helpful, thoughtful response.

Issue Title: ${title}
Labels: ${labels.join(", ") || "none"}

Issue Body:
${body || "(empty)"}

If the issue references a specific library, framework, or API, use web search to check for:
- Known issues or breaking changes in recent versions
- Relevant documentation or migration guides
- Community discussion or workarounds

Provide:
1. A brief summary of the issue
2. Any clarifying questions if the issue is ambiguous
3. Initial thoughts on approach or severity, referencing latest docs if applicable
4. Relevant labels that might be applicable

Keep your response under 300 words.`;
}

export function prReviewPrompt(
  title: string,
  body: string,
  files: Array<{ filename: string; status: string; patch?: string }>
): string {
  const fileSummary = files
    .map(
      (f) =>
        `- ${f.filename} (${f.status}): +${f.patch?.split("\n").filter((l) => l.startsWith("+")).length ?? 0} / -${f.patch?.split("\n").filter((l) => l.startsWith("-")).length ?? 0}`
    )
    .join("\n");

  const patches = files
    .filter((f) => f.patch)
    .map((f) => `--- ${f.filename} ---\n${f.patch}`)
    .join("\n\n");

  return `Review this pull request and provide actionable feedback.

PR Title: ${title}
PR Description: ${body || "(none)"}

Changed Files:
${fileSummary}

Code Changes:
${patches.slice(0, 8000)}

If the code uses specific libraries or APIs, use web search to verify:
- Whether the API usage follows current best practices
- If there are newer or better alternatives
- If the patterns used are recommended by upstream docs

IMPORTANT: Only reference files and line numbers that appear in the diff above. Do not invent filenames or line numbers.

Provide:
1. Overall assessment (1-2 sentences)
2. Specific code feedback with file references
3. Potential issues or concerns
4. Suggestions for improvement, citing latest documentation when relevant

Be specific. Reference filenames and line patterns. Keep under 500 words.`;
}

export function commentReplyPrompt(
  issueTitle: string,
  commentBody: string,
  context: string
): string {
  return `Someone mentioned mai-companion in a comment on a GitHub issue/PR. Generate a thoughtful reply.

Issue/PR Title: ${issueTitle}

Comment to respond to:
${commentBody}

Additional context:
${context}

If the comment references external tools, libraries, or APIs, use web search to provide accurate, up-to-date information. Only cite URLs that appear in search results — do not fabricate links.

Provide a helpful, direct response. Address the specific question or concern raised. Keep under 300 words.`;
}

export function codeExplanationPrompt(
  filename: string,
  patch: string
): string {
  return `Explain the following code changes concisely.

File: ${filename}

Changes:
${patch}

IMPORTANT: Only describe what is in the diff above. Do not assume code exists outside this patch.

Provide:
1. What the changes do
2. Why they might have been made
3. Any observations about the approach

Keep under 200 words.`;
}
