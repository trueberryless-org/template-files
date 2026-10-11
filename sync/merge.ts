export const MERGE_METHODS = ["squash", "merge", "rebase"] as const;

const FAILED_CONCLUSIONS = new Set([
  "ACTION_REQUIRED",
  "CANCELLED",
  "FAILURE",
  "STARTUP_FAILURE",
  "TIMED_OUT",
]);
const FAILED_STATES = new Set(["ERROR", "FAILURE"]);
const PENDING_STATES = new Set(["EXPECTED", "PENDING"]);

export function getChecksState(checks: Check[]): ChecksState {
  if (checks.some(isFailed)) return "failing";
  if (checks.some(isPending)) return "pending";

  return "passing";
}

export function decideMerge(
  pullRequest: PullRequest | undefined
): MergeDecision {
  if (!pullRequest)
    return { action: "skip", reason: "No open sync pull request" };
  if (pullRequest.isDraft) return { action: "skip", reason: "Draft" };

  switch (pullRequest.mergeable) {
    case "CONFLICTING":
      return {
        action: "skip",
        reason: "Merge conflict, run “Sync one repository” to recreate it",
      };
    case "UNKNOWN":
      return {
        action: "skip",
        reason: "GitHub is still checking mergeability, run again shortly",
      };
  }

  switch (getChecksState(pullRequest.statusCheckRollup ?? [])) {
    case "failing":
      return { action: "skip", reason: "Checks are failing" };
    case "pending":
      return { action: "skip", reason: "Checks are still running" };
  }

  return { action: "merge" };
}

export function formatMergeReport(results: MergeResult[], dryRun: boolean) {
  const rows = results.map(({ outcome, pullRequestUrl, repository }) => {
    const link = pullRequestUrl ? `[PR](${pullRequestUrl})` : "";

    return `| ${repository} | ${link} | ${outcome} |`;
  });
  const mergedCount = results.filter((result) => result.merged).length;
  const title = dryRun
    ? `### Sync pull requests that would be merged: ${results.filter(({ outcome }) => outcome === "Would merge").length}`
    : `### Merged sync pull requests: ${mergedCount}`;

  return [
    title,
    "",
    "| Repository | Pull request | Outcome |",
    "|------------|--------------|---------|",
    ...rows,
    "",
  ].join("\n");
}

function isFailed(check: Check) {
  return check.__typename === "CheckRun"
    ? FAILED_CONCLUSIONS.has(check.conclusion ?? "")
    : FAILED_STATES.has(check.state ?? "");
}

function isPending(check: Check) {
  return check.__typename === "CheckRun"
    ? check.status !== "COMPLETED"
    : PENDING_STATES.has(check.state ?? "");
}

export type MergeMethod = (typeof MERGE_METHODS)[number];

export type ChecksState = "failing" | "passing" | "pending";

export interface Check {
  __typename: "CheckRun" | "StatusContext";
  conclusion?: string | null;
  state?: string | null;
  status?: string | null;
}

export interface PullRequest {
  isDraft: boolean;
  mergeable: "CONFLICTING" | "MERGEABLE" | "UNKNOWN";
  number: number;
  statusCheckRollup?: Check[] | null;
  url: string;
}

export type MergeDecision =
  { action: "merge" } | { action: "skip"; reason: string };

export interface MergeResult {
  merged: boolean;
  outcome: string;
  pullRequestUrl: string | undefined;
  repository: string;
}
