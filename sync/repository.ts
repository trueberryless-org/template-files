import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import sortPackageJson from "sort-package-json";

import type { Repository } from "./config.ts";
import { applyOperation } from "./operations.ts";
import { getOperations } from "./presets.ts";
import {
  closePullRequest,
  ensureLabel,
  findOpenPullRequest,
  getBranchName,
  upsertPullRequest,
} from "./pull-request.ts";
import { run } from "./shell.ts";
import type { SyncSummary } from "./types.ts";

const TEMPLATES_PATH = resolve(import.meta.dirname, "../templates");

export function syncRepository(
  repository: Repository,
  token: string
): SyncSummary {
  const workspace = mkdtempSync(join(tmpdir(), "sync-"));
  const checkout = join(workspace, "target");

  try {
    run("git", [
      "clone",
      "--depth",
      "1",
      `https://x-access-token:${token}@github.com/${repository.name}.git`,
      checkout,
    ]);
    run("git", ["checkout", "-B", getBranchName()], checkout);

    const operations = getOperations(repository);

    for (const operation of operations) {
      applyOperation(operation, TEMPLATES_PATH, checkout);
    }

    const packageJsonTargets = new Set(
      operations
        .filter(({ target }) => target.endsWith("package.json"))
        .map(({ target }) => target)
    );

    for (const target of packageJsonTargets) {
      const path = join(checkout, target);
      writeFileSync(path, sortPackageJson(readFileSync(path, "utf8")));
    }

    if (isPackageJsonChanged(checkout)) {
      run(
        "pnpm",
        ["install", "--no-frozen-lockfile", "--ignore-scripts"],
        checkout
      );
    }

    run("git", ["add", "."], checkout);

    const changedFiles = run(
      "git",
      ["diff", "--cached", "--name-only"],
      checkout
    )
      .split("\n")
      .filter(Boolean).length;

    if (changedFiles === 0) {
      const open = findOpenPullRequest(repository.name, checkout);

      if (open) {
        closePullRequest(repository.name, open, checkout);
      }

      return {
        changedFiles,
        pullRequestUrl: undefined,
        repository: repository.name,
      };
    }

    ensureLabel(repository.name);
    run("git", ["commit", "-m", "ci: update GitHub template files"], checkout);
    run("git", ["push", "--force", "origin", getBranchName()], checkout);

    const pullRequestUrl = upsertPullRequest(
      repository.name,
      repository.branch,
      getChangelogEntry(checkout),
      checkout
    );

    return { changedFiles, pullRequestUrl, repository: repository.name };
  } finally {
    rmSync(workspace, { force: true, recursive: true });
  }
}

export function writeSummary(summary: SyncSummary, directory: string) {
  mkdirSync(directory, { recursive: true });
  writeFileSync(
    join(directory, `${summary.repository.replace("/", "-")}.json`),
    JSON.stringify(summary)
  );
}

function isPackageJsonChanged(cwd: string) {
  return run("git", ["status", "--porcelain"], cwd)
    .split("\n")
    .some((line) => line.endsWith("package.json"));
}

function getChangelogEntry(cwd: string) {
  const hash = run("git", ["rev-parse", "--short", "HEAD"], cwd);
  const repository =
    process.env["GITHUB_REPOSITORY"] ?? "trueberryless-org/template-files";

  return `- ci: update GitHub template files - ([${hash}](https://github.com/${repository}/commit/${process.env["GITHUB_SHA"] ?? hash}))`;
}
