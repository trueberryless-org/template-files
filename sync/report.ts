import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

import type { SyncSummary } from "./types.ts";

const directory = resolve(process.argv[2] ?? "summary");

const summaries = readdirSync(directory)
  .filter((file) => file.endsWith(".json"))
  .map(
    (file) =>
      JSON.parse(readFileSync(join(directory, file), "utf8")) as SyncSummary
  )
  .toSorted((a, b) => a.repository.localeCompare(b.repository));

writeFileSync(join(directory, "final_summary.md"), formatTable(summaries));
writeFileSync(join(directory, "discord_summary.md"), formatList(summaries));

function formatTable(items: SyncSummary[]) {
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
  ].join("\n");
}

function formatList(items: SyncSummary[]) {
  const lines = items.map(({ changedFiles, pullRequestUrl, repository }) => {
    if (changedFiles === 0) {
      return `- ${repository} -- No files changed`;
    }

    return `- ${repository} -- ${changedFiles} ${changedFiles === 1 ? "file" : "files"} changed: ([PR Link](${pullRequestUrl}))`;
  });

  return ["### Summary of Changes", "", ...lines, ""].join("\n");
}
