---
"template-files": minor
---

Replaces the shell based sync with a typed and tested TypeScript implementation. `repositories.json` now only lists a preset and a few properties per repository instead of every file, the `owner` is a template property so repositories can move to another account, and there is a new `ci` option that syncs a CI workflow with lint, format, typecheck, unit, coverage and Playwright end-to-end jobs. The repository list follows the renamed repositories (`releases`, `recent-github-activity`, `starlight-group-pages`) and no longer contains the archived `npmx-digest`.
