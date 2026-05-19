# AGENTS.md

Guidance for coding agents and contributors working in this repository.

This repository is a pnpm workspace. This file includes:

- repository-wide collaboration rules
- development commands
- quality expectations
- documentation conventions

## Repository-wide Guidelines

- Use `pnpm` as the package manager.
- Keep changes focused and minimal; avoid unrelated refactors.
- Keep docs in sync when introducing new patterns, workflows, or conventions.
- Prefer existing package conventions over introducing new tools or structure.
- Pull request titles must follow Conventional Commits because GitHub squash
  merge commonly uses the PR title as the commit on `main`.
  - Format: `<type>(optional-scope): <description>`
  - Example: `feat(cms-plugin): add translation field helper`
  - Use descriptive commits inside the PR for review clarity; the PR title is
    the canonical squash commit message.
- When the current Codex/chat thread already has an open pull request, push any
  newly applied changes to that PR branch unless explicitly instructed
  otherwise.
- After you address a pull request review comment, resolve that conversation in
  the PR.
- Follow the Node.js and pnpm versions declared by CI and package manifests.
  Keep runtime typings aligned with those supported runtimes.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full contribution guidelines.

## Docs Structure

- Shared workspace docs live in root-level docs such as
  [CONTRIBUTING.md](CONTRIBUTING.md), this file, or a future `docs/` directory.
- Package-specific docs should live beside the package they describe, such as
  `libs/cms-plugin/README.md` or `examples/cms-example/README.md`.

## Development Commands

```bash
pnpm build                    # Run build scripts across workspace packages
pnpm check                    # Run formatting, lint, and integration tests
pnpm format:check             # Check formatting with Prettier
pnpm lint                     # Run package lint scripts
pnpm test                     # Run package integration test scripts

pnpm --filter cms-plugin build    # Build the Payload CMS plugin package
pnpm --filter cms-plugin lint     # Lint the plugin source
pnpm --filter cms-plugin test:int # Run plugin Vitest tests
pnpm --filter cms-plugin test:e2e # Run plugin Playwright tests

pnpm --filter common build        # Build the shared common package
pnpm --filter cms-example dev     # Start the example Payload/Next app
pnpm --filter cms-example build   # Build the example app
```

## Quality Checklist

- Run `pnpm check` before finishing changes when feasible.
- Run focused package checks while iterating on package-specific work.
- Run `pnpm build` or the affected package build before finishing changes that
  touch compiled packages.
- Run `pnpm --filter cms-plugin test:int` when touching plugin logic covered by
  Vitest.
- Run `pnpm --filter cms-plugin test:e2e` for changes with meaningful browser or
  end-to-end risk.
- Run `pnpm --filter cms-example build` for changes that affect the example app
  or plugin/example integration.
- Update relevant docs when behavior, workflows, package APIs, or conventions
  change.

## Package Notes

- `libs/cms-plugin` contains the Payload CMS plugin package.
- `libs/common` contains shared code used by workspace packages.
- `examples/cms-example` contains the example Payload/Next application.
