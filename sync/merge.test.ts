import { describe, expect, test } from "vitest";

import {
  decideMerge,
  formatMergeReport,
  getChecksState,
  type PullRequest,
} from "./merge.ts";

function pullRequest(overrides: Partial<PullRequest> = {}): PullRequest {
  return {
    isDraft: false,
    mergeable: "MERGEABLE",
    number: 1,
    statusCheckRollup: [],
    url: "https://github.com/owner/repo/pull/1",
    ...overrides,
  };
}

describe("getChecksState", () => {
  test("passes without checks", () => {
    expect(getChecksState([])).toBe("passing");
  });

  test("passes when every check succeeded or was skipped", () => {
    expect(
      getChecksState([
        { __typename: "CheckRun", conclusion: "SUCCESS", status: "COMPLETED" },
        { __typename: "CheckRun", conclusion: "SKIPPED", status: "COMPLETED" },
        { __typename: "CheckRun", conclusion: "NEUTRAL", status: "COMPLETED" },
        { __typename: "StatusContext", state: "SUCCESS" },
      ])
    ).toBe("passing");
  });

  test.each(["FAILURE", "TIMED_OUT", "CANCELLED", "ACTION_REQUIRED", "STARTUP_FAILURE"])(
    "fails for a %s check run",
    (conclusion) => {
      expect(
        getChecksState([{ __typename: "CheckRun", conclusion, status: "COMPLETED" }])
      ).toBe("failing");
    }
  );

  test.each(["FAILURE", "ERROR"])("fails for a %s status", (state) => {
    expect(getChecksState([{ __typename: "StatusContext", state }])).toBe("failing");
  });

  test("is pending while a check runs or a status is expected", () => {
    expect(
      getChecksState([{ __typename: "CheckRun", conclusion: null, status: "IN_PROGRESS" }])
    ).toBe("pending");
    expect(getChecksState([{ __typename: "StatusContext", state: "PENDING" }])).toBe(
      "pending"
    );
  });

  test("reports a failure before a pending check", () => {
    expect(
      getChecksState([
        { __typename: "CheckRun", conclusion: null, status: "QUEUED" },
        { __typename: "CheckRun", conclusion: "FAILURE", status: "COMPLETED" },
      ])
    ).toBe("failing");
  });
});

describe("decideMerge", () => {
  test("merges a mergeable pull request with passing checks", () => {
    expect(decideMerge(pullRequest())).toEqual({ action: "merge" });
  });

  test("merges when the rollup is missing", () => {
    expect(decideMerge(pullRequest({ statusCheckRollup: null }))).toEqual({
      action: "merge",
    });
  });

  test.each([
    [undefined, "No open sync pull request"],
    [pullRequest({ isDraft: true }), "Draft"],
    [pullRequest({ mergeable: "CONFLICTING" }), "Merge conflict, run “Sync one repository” to recreate it"],
    [pullRequest({ mergeable: "UNKNOWN" }), "GitHub is still checking mergeability, run again shortly"],
    [
      pullRequest({
        statusCheckRollup: [{ __typename: "CheckRun", conclusion: "FAILURE", status: "COMPLETED" }],
      }),
      "Checks are failing",
    ],
    [
      pullRequest({
        statusCheckRollup: [{ __typename: "CheckRun", conclusion: null, status: "IN_PROGRESS" }],
      }),
      "Checks are still running",
    ],
  ])("skips %#", (input, reason) => {
    expect(decideMerge(input)).toEqual({ action: "skip", reason });
  });
});

describe("formatMergeReport", () => {
  const results = [
    { merged: true, outcome: "Merged", pullRequestUrl: "https://example.com/1", repository: "owner/a" },
    { merged: false, outcome: "Checks are failing", pullRequestUrl: "https://example.com/2", repository: "owner/b" },
    { merged: false, outcome: "No open sync pull request", pullRequestUrl: undefined, repository: "owner/c" },
  ];

  test("counts the merged pull requests", () => {
    expect(formatMergeReport(results, false)).toBe(
      [
        "### Merged sync pull requests: 1",
        "",
        "| Repository | Pull request | Outcome |",
        "|------------|--------------|---------|",
        "| owner/a | [PR](https://example.com/1) | Merged |",
        "| owner/b | [PR](https://example.com/2) | Checks are failing |",
        "| owner/c |  | No open sync pull request |",
        "",
      ].join("\n")
    );
  });

  test("counts the pull requests a dry run would merge", () => {
    const report = formatMergeReport(
      [{ merged: false, outcome: "Would merge", pullRequestUrl: "https://example.com/1", repository: "owner/a" }],
      true
    );

    expect(report.split("\n")[0]).toBe("### Sync pull requests that would be merged: 1");
  });
});
