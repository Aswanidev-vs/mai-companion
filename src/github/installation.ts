import type { Env } from "../types/index.ts";
import { getInstallationToken } from "./auth.ts";

interface InstallationInfo {
  id: number;
  account: { login: string; type: string };
  repository_selection: string;
}

export async function getInstallationForRepo(
  env: Env,
  owner: string,
  repo: string
): Promise<number> {
  const jwt = await import("./auth.ts").then((m) =>
    m.generateJwt(env.GITHUB_APP_ID, env.GITHUB_PRIVATE_KEY)
  );

  const response = await fetch("https://api.github.com/app/installations", {
    headers: {
      Authorization: `Bearer ${jwt}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to list installations: ${response.status}`);
  }

  const installations = (await response.json()) as InstallationInfo[];

  for (const installation of installations) {
    try {
      await getInstallationToken(env, installation.id);
      return installation.id;
    } catch {
      continue;
    }
  }

  throw new Error(`No valid installation found for ${owner}/${repo}`);
}
