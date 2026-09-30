import type { Repository } from "./config.ts";
import type { Props } from "./types.ts";

const PLACEHOLDER = /<%=\s*(\w+)\s*%>/g;

export function getRepositoryProps(repository: Repository): Props {
  const [owner, repositoryName] = repository.name.split("/") as [
    string,
    string,
  ];
  const packageName = repository.package ?? repositoryName;

  return {
    branchName: repository.branch,
    homepage: repository.homepage ?? `https://${repositoryName}.netlify.app/`,
    owner,
    packageDirectory: packageName.split("/").at(-1) as string,
    packageName,
    projectFolder: repository.projectFolder ?? "docs",
    repositoryName,
    repositoryUrl: `https://github.com/${repository.name}`,
    year: String(repository.year),
  };
}

export function renderTemplate(template: string, props: Props) {
  return template.replaceAll(PLACEHOLDER, (_match, key: string) => {
    const value = props[key];

    if (value === undefined) {
      throw new Error(`The template references an unknown property '${key}'.`);
    }

    return value;
  });
}
