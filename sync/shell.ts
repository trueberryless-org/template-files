import { execFileSync } from "node:child_process";

export function run(
  command: string,
  args: string[],
  cwd?: string,
  env?: NodeJS.ProcessEnv
) {
  return execFileSync(command, args, {
    cwd,
    env: env ? { ...process.env, ...env } : process.env,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"],
  }).trim();
}
