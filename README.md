# `template-files`

Provide single point of truth for template files.

## Project structure

```
.
├── .changeset
│   ├── README.md
│   ├── config.json
│   └── late-roses-tell.md
├── .dockerignore
├── .github
│   ├── labeler.yaml
│   ├── readmetreerc.yaml
│   └── workflows
│       ├── format.yaml
│       ├── generate-readme-tree.yaml
│       ├── labeler.yaml
│       ├── release.yaml
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
└── template-files
    ├── .changeset
    │   ├── README.md
    │   └── config.json
    ├── .dockerignore
    ├── .github
    │   ├── DISCUSSION_TEMPLATES
    │   │   └── feature_request.yaml
    │   ├── FUNDING.yaml
    │   ├── ISSUE_TEMPLATES
    │   │   ├── ---01-bug-report.yaml
    │   │   ├── ---02-docs-issue.yaml
    │   │   └── config.yaml
    │   ├── labeler.yaml
    │   ├── readmetreerc.yaml
    │   └── workflows
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
    │   └── Node.gitignore
    ├── .prettierignore
    ├── .prettierrc
    │   ├── .prettierrc
    │   └── import.order.prettierrc
    ├── Dockerfile
    │   ├── Next.Dockerfile
    │   └── httpd.Dockerfile
    ├── LICENSE
    ├── README.md
    ├── manifest
    │   ├── certificate.yaml
    │   ├── deployment.yaml
    │   ├── ingress.yaml
    │   ├── namespace.yaml
    │   └── service.yaml
    ├── package.json
    │   ├── changeset.package.json
    │   ├── definition.package.json
    │   ├── import.order.package.json
    │   └── package.manager.package.json
    └── pnpm-workspace.yaml

```

## License

Licensed under the MIT license, Copyright © trueberryless.

See [LICENSE](/LICENSE) for more information.
