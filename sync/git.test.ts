import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import {
  BOT_IDENTITY,
  cloneRepository,
  commitChanges,
  createBranch,
  forcePushBranch,
  getAuthentication,
  getRepositoryUrl,
  hasChangedFile,
  stageChanges,
} from "./git.ts";
import { run } from "./shell.ts";

const SEED_IDENTITY = {
  GIT_AUTHOR_EMAIL: "seed@example.com",
  GIT_AUTHOR_NAME: "Seed",
  GIT_COMMITTER_EMAIL: "seed@example.com",
  GIT_COMMITTER_NAME: "Seed",
};

let workspace: string;
let remote: string;
let checkout: string;

function git(args: string[], cwd: string) {
  return run("git", args, cwd, SEED_IDENTITY);
}

beforeEach(() => {
  for (const name of ["GIT_AUTHOR_EMAIL", "GIT_AUTHOR_NAME", "GIT_COMMITTER_EMAIL", "GIT_COMMITTER_NAME"]) {
    vi.stubEnv(name, undefined);
  }

  workspace = mkdtempSync(join(tmpdir(), "git-test-"));
  remote = join(workspace, "remote.git");
  checkout = join(workspace, "checkout");

  const seed = join(workspace, "seed");

  git(["init", "--bare", "--initial-branch", "main", remote], workspace);
  git(["init", "--initial-branch", "main", seed], workspace);
  writeFileSync(join(seed, "README.md"), "# Seed\n");
  writeFileSync(join(seed, "package.json"), "{}\n");
  git(["add", "--all"], seed);
  git(["commit", "--message", "seed"], seed);
  git(["remote", "add", "origin", remote], seed);
  git(["push", "origin", "main"], seed);
});

afterEach(() => {
  vi.unstubAllEnvs();
  rmSync(workspace, { force: true, recursive: true });
});

describe("getRepositoryUrl", () => {
  test("points at the GitHub repository", () => {
    expect(getRepositoryUrl("owner/name")).toBe("https://github.com/owner/name.git");
  });
});

describe("getAuthentication", () => {
  test("sends the token as a basic auth header without putting it in the URL", () => {
    const authentication = getAuthentication("secret", {});

    expect(authentication).toEqual({
      GIT_CONFIG_COUNT: "1",
      GIT_CONFIG_KEY_0: "http.https://github.com/.extraheader",
      GIT_CONFIG_VALUE_0: `Authorization: Basic ${Buffer.from("x-access-token:secret").toString("base64")}`,
    });
  });
});

describe("getAuthentication with existing git config entries", () => {
  test("appends the header instead of replacing them", () => {
    expect(getAuthentication("secret", { GIT_CONFIG_COUNT: "2" })).toMatchObject({
      GIT_CONFIG_COUNT: "3",
      GIT_CONFIG_KEY_2: "http.https://github.com/.extraheader",
    });
  });
});

describe("BOT_IDENTITY", () => {
  test("is the GitHub Actions bot, never a personal account", () => {
    expect(BOT_IDENTITY).toEqual({
      GIT_AUTHOR_EMAIL: "41898282+github-actions[bot]@users.noreply.github.com",
      GIT_AUTHOR_NAME: "github-actions[bot]",
      GIT_COMMITTER_EMAIL: "41898282+github-actions[bot]@users.noreply.github.com",
      GIT_COMMITTER_NAME: "github-actions[bot]",
    });
  });
});

describe("sync git flow", () => {
  test("commits as the bot even when the environment names a person", () => {
    vi.stubEnv("GIT_AUTHOR_NAME", "A Person");
    vi.stubEnv("GIT_AUTHOR_EMAIL", "person@example.com");
    vi.stubEnv("GIT_COMMITTER_NAME", "A Person");
    vi.stubEnv("GIT_COMMITTER_EMAIL", "person@example.com");
    cloneRepository(remote, checkout);
    writeFileSync(join(checkout, "README.md"), "# Changed\n");
    stageChanges(checkout);
    commitChanges(checkout, "change");

    expect(run("git", ["log", "-1", "--format=%an %ae %cn %ce"], checkout)).not.toContain("person");
  });

  test("clones, commits on a new branch and pushes it", () => {
    cloneRepository(remote, checkout);
    createBranch(checkout, "update-template-files");
    writeFileSync(join(checkout, "README.md"), "# Updated\n");
    mkdirSync(join(checkout, ".github"));
    writeFileSync(join(checkout, ".github", "renovate.json"), "{}\n");

    expect(stageChanges(checkout).toSorted()).toEqual([".github/renovate.json", "README.md"]);

    const hash = commitChanges(checkout, "ci: update GitHub template files");

    forcePushBranch(checkout, "update-template-files");

    const remoteHead = run("git", ["rev-parse", "--short", "update-template-files"], remote);

    expect(remoteHead).toBe(hash);
    expect(
      run("git", ["log", "-1", "--format=%an <%ae> | %cn <%ce>", "update-template-files"], remote)
    ).toBe(
      "github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com> | github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>"
    );
  });

  test("reports no changes when the templates are already applied", () => {
    cloneRepository(remote, checkout);
    createBranch(checkout, "update-template-files");

    expect(stageChanges(checkout)).toEqual([]);
  });

  test("detects a changed package.json at the root or in a package", () => {
    cloneRepository(remote, checkout);

    expect(hasChangedFile(checkout, "package.json")).toBe(false);

    writeFileSync(join(checkout, "package.json"), '{ "name": "changed" }\n');

    expect(hasChangedFile(checkout, "package.json")).toBe(true);

    git(["checkout", "--", "package.json"], checkout);
    mkdirSync(join(checkout, "packages", "plugin"), { recursive: true });
    writeFileSync(join(checkout, "packages", "plugin", "package.json"), "{}\n");
    git(["add", "--all"], checkout);

    expect(hasChangedFile(checkout, "package.json")).toBe(true);
  });

  test("replaces a sync branch that diverged, like after a merge conflict", () => {
    cloneRepository(remote, checkout);
    createBranch(checkout, "update-template-files");
    writeFileSync(join(checkout, "README.md"), "# First\n");
    stageChanges(checkout);
    commitChanges(checkout, "first");
    forcePushBranch(checkout, "update-template-files");

    const second = join(workspace, "second");

    cloneRepository(remote, second);
    createBranch(second, "update-template-files");
    writeFileSync(join(second, "README.md"), "# Second\n");
    stageChanges(second);

    const hash = commitChanges(second, "second");

    forcePushBranch(second, "update-template-files");

    expect(run("git", ["rev-parse", "--short", "update-template-files"], remote)).toBe(hash);
    expect(run("git", ["show", "update-template-files:README.md"], remote)).toBe("# Second");
  });
});
