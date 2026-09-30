import { execFileSync } from "node:child_process";

export function run(command: string, args: string[], cwd?: string) {
  return execFileSync(command, args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"],
  }).trim();
}
