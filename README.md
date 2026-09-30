# `template-files`

Provide single point of truth for template files.

## How it works

Every repository listed in [`repositories.json`](./repositories.json) receives the files of its **preset** from [`templates/`](./templates). The sync opens (or updates) one `update-template-files` pull request per repository.

| Preset      | For                                                                  |
| ----------- | -------------------------------------------------------------------- |
| `site`      | A single package at the repository root                              |
| `plugin`    | A pnpm workspace with `docs/` and `packages/<package>/` and changesets |
| `tooling`   | Internal tooling repositories like this one                          |

A repository entry only needs `name` and `preset`. Everything else is optional:

| Property        | Default                          | Meaning                                                    |
| --------------- | -------------------------------- | ---------------------------------------------------------- |
| `package`       | the repository name              | npm package name, may be scoped                            |
| `homepage`      | `https://<repository>.netlify.app/` | `homepage` in every synced `package.json`               |
| `branch`        | `main`                           | Default branch                                             |
| `ci`            | `false`                          | Also sync the CI workflow, oxlint config and test tooling  |
| `skip`          | `[]`                             | Template targets or sources to leave alone, e.g. `.prettierrc` |

Templates use `<%= property %>` placeholders. Besides the properties above, `owner`, `repositoryName`, `repositoryUrl`, `packageDirectory` and `branchName` are available, so moving a repository to another account only requires changing its `name`.

Files are synced in one of these ways:

- **copy**: the file is replaced.
- **merge-json**: the template is deep-merged into the existing file, its values win (`package.json`).
- **merge-yaml**: the template provides defaults, existing values win and lists are unioned (`pnpm-workspace.yaml`).
- **add-missing-lines**: missing patterns are appended, existing lines are kept (`.gitignore`, `.prettierignore`).
- **replace-license**: only the `## License` section of a README is replaced.
- **delete**: obsolete files are removed.

## Commands

```shell
pnpm check   # typecheck the sync scripts
pnpm test    # unit tests
pnpm sync    # sync one repository, needs GH_TOKEN and REPOSITORY (owner/name)
```

## Project structure

```
.
├── .changeset
│   ├── README.md
│   └── config.json
├── .github
│   ├── labeler.yaml
│   ├── readmetreerc.yaml
│   ├── renovate.json
│   └── workflows
│       ├── format.yaml
│       ├── generate-readme-tree.yaml
│       ├── labeler.yaml
│       ├── sync.yaml
│       └── welcome-bot.yaml
├── .gitignore
├── .prettierignore
├── .prettierrc
├── CHANGELOG.md
├── LICENSE
├── README.md
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
├── repos.json
├── sync_templates.sh
└── template-files
    ├── .changeset
    │   ├── README.md
    │   └── config.json
    ├── .github
    │   ├── CODEOWNERS
    │   ├── FUNDING.yaml
    │   ├── labeler.yaml
    │   ├── renovate.json
    │   └── workflows
    │       ├── format.yaml
    │       ├── labeler.yaml
    │       ├── publish.yaml
    │       ├── release.yaml
    │       ├── tangle.yaml
    │       └── welcome-bot.yaml
    ├── .gitignore
    │   └── Node.gitignore
    ├── .prettierignore
    ├── .prettierrc
    │   └── .prettierrc
    ├── LICENSE
    ├── README.md
    ├── nginx.conf
    ├── package.json
    │   ├── changeset.package.json
    │   ├── definition.package.json
    │   ├── package.manager.package.json
    │   └── prettier.package.json
    └── pnpm-workspace
        ├── allow-builds.yaml
        └── with-packages.yaml

```

## License

Licensed under the MIT license, Copyright © trueberryless.

See [LICENSE](https://github.com/trueberryless-org/template-files/blob/main/LICENSE) for more information.
