# `template-files`

Provide single point of truth for template files.

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
    │   ├── readmetreerc.yaml
    │   ├── renovate.json
    │   └── workflows
    │       ├── format.yaml
    │       ├── generate-readme-tree.yaml
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
    ├── manifest
    │   ├── certificate.yaml
    │   ├── ingress.yaml
    │   ├── namespace.yaml
    │   └── service.yaml
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
