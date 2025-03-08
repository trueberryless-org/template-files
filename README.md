# `template-files`

Provide single point of truth for template files.

## Project structure

```
.
├── .changeset
│   ├── README.md
│   └── config.json
├── .dockerignore
├── .github
│   ├── labeler.yaml
│   ├── readmetreerc.yaml
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
├── repos.json
├── sync_templates.sh
└── template-files
    ├── .changeset
    │   ├── DotNet.config.json
    │   ├── README.md
    │   └── config.json
    ├── .dockerignore
    ├── .github
    │   ├── FUNDING.yaml
    │   ├── labeler.yaml
    │   ├── readmetreerc.yaml
    │   └── workflows
    │       ├── DotNet.deployment.yaml
    │       ├── deployment-with-lunaria.yaml
    │       ├── deployment.yaml
    │       ├── format.yaml
    │       ├── generate-readme-tree.yaml
    │       ├── labeler.yaml
    │       ├── publish.yaml
    │       ├── release.yaml
    │       ├── spell-checker.yaml
    │       └── welcome-bot.yaml
    ├── .gitignore
    │   ├── DotNet.gitignore
    │   └── Node.gitignore
    ├── .prettierignore
    ├── .prettierrc
    │   └── .prettierrc
    ├── Dockerfile
    │   ├── DotNet.Dockerfile
    │   ├── Next.Dockerfile
    │   ├── Node.Dockerfile
    │   ├── httpd.Dockerfile
    │   └── nginx.Dockerfile
    ├── LICENSE
    ├── README.md
    ├── manifest
    │   ├── certificate.yaml
    │   ├── deployment.yaml
    │   ├── ingress.yaml
    │   ├── namespace.yaml
    │   └── service.yaml
    ├── nginx.conf
    ├── package.json
    │   ├── changeset.package.json
    │   ├── definition.package.json
    │   ├── package.manager.package.json
    │   └── prettier.package.json
    └── pnpm-workspace.yaml

```

## License

Licensed under the MIT license, Copyright © trueberryless.

See [LICENSE](/LICENSE) for more information.
