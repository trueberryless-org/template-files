import { resolve } from "node:path";

import { findRepository, readConfig } from "./config.ts";
import { syncRepository, writeSummary } from "./repository.ts";

const repositories = readConfig(
  resolve(import.meta.dirname, "../repositories.json")
);
const repository = findRepository(
  repositories,
  requireEnvironment("REPOSITORY")
);

const summary = syncRepository(repository, requireEnvironment("GH_TOKEN"));

writeSummary(summary, resolve("summary"));

console.info(
  `${repository.name}: ${summary.changedFiles} changed file(s)${summary.pullRequestUrl ? ` (${summary.pullRequestUrl})` : ""}`
);

function requireEnvironment(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`The environment variable ${name} is required.`);
  }

  return value;
}
