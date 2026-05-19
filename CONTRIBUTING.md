# Contributing

This workspace uses pull requests for changes to `main`. Keep changes focused,
reviewable, and documented when behavior or conventions change.

## Pull Request Title Convention

All pull request titles must follow Conventional Commits:

`<type>(optional-scope): <description>`

Examples:

- `feat(cms-plugin): add translation field helper`
- `fix(common): preserve rich text link metadata`
- `docs: clarify local development commands`
- `chore(infra): update workflow dependencies`

Recommended types:

- `feat`
- `fix`
- `docs`
- `refactor`
- `test`
- `chore`
- `ci`
- `build`
- `perf`

## Commit Messages Inside the PR

Commits inside a pull request can stay descriptive for review flow and do not
need to be strictly Conventional Commit formatted.

## Pull Request Description Workflow

- Prefer `gh pr create --body-file <path>` over `--body` to avoid shell escaping
  and newline formatting issues in PR descriptions.
- Prefer `gh pr edit --body-file <path>` for updates.
- If `gh pr edit` fails with a GraphQL error mentioning `projectCards`
  deprecation, update the body through REST:
  `gh api -X PATCH repos/<owner>/<repo>/pulls/<number> -f body="$(cat <path>)"`.

## Scope Guidance

- Use a package or area scope when helpful, such as `cms-plugin`, `common`,
  `cms-example`, `infra`, or `docs`.
- Keep descriptions concise, imperative, and behavior-focused.

## Runtime and Typings Policy

- Follow the Node.js and pnpm versions declared by CI and package manifests.
- Keep `@types/node` aligned with the supported runtime range for the package
  being changed.
- Do not update runtime versions or Node typings beyond the configured runtime
  policy unless the migration is intentional and included in the PR scope.

## Review Comment Workflow

- If the current Codex/chat thread is linked to an open pull request, push newly
  applied changes to that PR branch unless explicitly instructed otherwise.
- After you address a pull request comment, resolve that conversation in the PR.

## Documentation Expectations

- Update relevant docs when introducing new behavior, workflows, or conventions.
- Keep shared workspace docs at the repository root or in a future `docs/`
  directory.
- Keep package-specific docs alongside the package they describe.
