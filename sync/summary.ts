import type { SyncSummary } from "./types.ts";

export function formatTable(items: SyncSummary[], links: string | undefined) {
  const rows = items.map(
    ({ changedFiles, pullRequestUrl, repository }) =>
      `| ${repository} | ${pullRequestUrl ? `[PR Link](${pullRequestUrl})` : "No PR"} | ${changedFiles} |`
  );

  return [
    "### Summary of Changes",
    "",
    "| Repository | PR Link | Files Changed |",
    "|------------|---------|---------------|",
    ...rows,
    "",
    ...(links ? [links, ""] : []),
  ].join("\n");
}

export function formatList(items: SyncSummary[], links: string | undefined) {
  const lines = items.map(({ changedFiles, pullRequestUrl, repository }) => {
    if (changedFiles === 0) {
      return `- ${repository} -- No files changed`;
    }

    return `- ${repository} -- ${changedFiles} ${changedFiles === 1 ? "file" : "files"} changed: ([PR Link](${pullRequestUrl}))`;
  });

  return [
    "### Summary of Changes",
    "",
    ...lines,
    "",
    ...(links ? [links, ""] : []),
  ].join("\n");
}

export function formatWorkflowLinks(
  serverUrl: string | undefined,
  repository: string | undefined
) {
  if (!serverUrl || !repository) return undefined;

  const workflows = `${serverUrl}/${repository}/actions/workflows`;

  return [
    "### Next steps",
    "",
    `- [Merge all sync pull requests](${workflows}/merge-sync-prs.yaml) with green checks, or try a dry run first.`,
    `- [Sync one repository](${workflows}/sync-repository.yaml) again, for example after a merge conflict.`,
  ].join("\n");
}
