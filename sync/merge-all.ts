import { appendFileSync } from "node:fs";
import { resolve } from "node:path";

import { readConfig } from "./config.ts";
import {
  MERGE_METHODS,
  type MergeMethod,
  type MergeResult,
  type PullRequest,
  decideMerge,
  formatMergeReport,
} from "./merge.ts";
import { getBranchName } from "./pull-request.ts";
import { run } from "./shell.ts";

const MERGEABILITY_ATTEMPTS = 3;
const MERGEABILITY_DELAY_MS = 3000;

const owner = process.env["OWNER"];
const dryRun = process.env["DRY_RUN"] === "true";
const method = parseMergeMethod(process.env["MERGE_METHOD"] ?? "squash");

const repositories = readConfig(
  resolve(import.meta.dirname, "../repositories.json")
).filter(({ name }) => !owner || name.startsWith(`${owner}/`));

const results = repositories.map(({ name }) => mergeRepository(name));
const report = formatMergeReport(results, dryRun);

console.info(report);

const summaryPath = process.env["GITHUB_STEP_SUMMARY"];

if (summaryPath) appendFileSync(summaryPath, `${report}\n`);

if (results.some(({ outcome }) => outcome.startsWith("Merge failed"))) {
  process.exitCode = 1;
}

function mergeRepository(repository: string): MergeResult {
  const pullRequest = findPullRequest(repository);
  const decision = decideMerge(pullRequest);
  const pullRequestUrl = pullRequest?.url;

  if (decision.action === "skip") {
    return {
      merged: false,
      outcome: decision.reason,
      pullRequestUrl,
      repository,
    };
  }

  if (dryRun || !pullRequest) {
    return {
      merged: false,
      outcome: "Would merge",
      pullRequestUrl,
      repository,
    };
  }

  try {
    run("gh", [
      "pr",
      "merge",
      String(pullRequest.number),
      "--repo",
      repository,
      `--${method}`,
      "--delete-branch",
    ]);

    return { merged: true, outcome: "Merged", pullRequestUrl, repository };
  } catch (error) {
    const message =
      error instanceof Error ? error.message.split("\n")[0] : String(error);

    return {
      merged: false,
      outcome: `Merge failed: ${message}`,
      pullRequestUrl,
      repository,
    };
  }
}

function findPullRequest(repository: string): PullRequest | undefined {
  let pullRequest = fetchPullRequest(repository);

  for (
    let attempt = 1;
    pullRequest?.mergeable === "UNKNOWN" && attempt <= MERGEABILITY_ATTEMPTS;
    attempt++
  ) {
    sleep(MERGEABILITY_DELAY_MS);
    pullRequest = fetchPullRequest(repository);
  }

  return pullRequest;
}

function fetchPullRequest(repository: string): PullRequest | undefined {
  const json = run("gh", [
    "pr",
    "list",
    "--repo",
    repository,
    "--head",
    getBranchName(),
    "--state",
    "open",
    "--json",
    "isDraft,mergeable,number,statusCheckRollup,url",
    "--jq",
    ".[0] // empty",
  ]);

  return json === "" ? undefined : (JSON.parse(json) as PullRequest);
}

function sleep(milliseconds: number) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, milliseconds);
}

function parseMergeMethod(value: string): MergeMethod {
  if (!MERGE_METHODS.includes(value as MergeMethod)) {
    throw new Error(`MERGE_METHOD must be one of ${MERGE_METHODS.join(", ")}.`);
  }

  return value as MergeMethod;
}
