import { readFileSync } from "node:fs";
import { z } from "zod";

const RepositoryNameSchema = z.string().regex(/^[\w.-]+\/[\w.-]+$/);

const RepositorySchema = z.object({
  branch: z.string().default("main"),
  ci: z.boolean().default(false),
  homepage: z.url().optional(),
  name: RepositoryNameSchema,
  package: z.string().optional(),
  preset: z.enum(["site", "plugin", "tooling"]),
});

const ConfigSchema = z.object({
  repositories: z.array(RepositorySchema).min(1),
});

export type Repository = z.output<typeof RepositorySchema>;

export function parseConfig(input: unknown) {
  const { repositories } = ConfigSchema.parse(input);
  const names = repositories.map(({ name }) => name);
  const duplicate = names.find((name, index) => names.indexOf(name) !== index);

  if (duplicate) {
    throw new Error(`The repository '${duplicate}' is listed more than once.`);
  }

  return repositories;
}

export function readConfig(path: string) {
  return parseConfig(JSON.parse(readFileSync(path, "utf8")));
}

export function findRepository(repositories: Repository[], name: string) {
  const repository = repositories.find((candidate) => candidate.name === name);

  if (!repository) {
    throw new Error(
      `The repository '${name}' is not listed in repositories.json.`
    );
  }

  return repository;
}
