# Issue tracker: GitHub

Issues and PRDs for this repo live as GitHub issues. Use the `gh` CLI for all operations.

## Conventions

- Create an issue with `gh issue create --title "..." --body "..."`
- Read an issue with `gh issue view <number> --comments`
- List issues with `gh issue list --state open --json number,title,body,labels,comments`
- Comment with `gh issue comment <number> --body "..."`
- Apply or remove labels with `gh issue edit <number> --add-label "..."` / `--remove-label "..."`
- Close with `gh issue close <number> --comment "..."`

Infer the repo from `git remote -v`; `gh` does this automatically inside the clone.

## Pull requests as a triage surface

PRs as a request surface: yes.

External PRs run through the same labels and states as issues. List open PRs with `gh pr list --state open --json number,title,body,labels,author,authorAssociation,comments`, then keep only `CONTRIBUTOR`, `FIRST_TIME_CONTRIBUTOR`, or `NONE`.

Use `gh pr view <number> --comments` and `gh pr diff <number>` when triaging a PR.

## When a skill says "publish to the issue tracker"

Create a GitHub issue.

## When a skill says "fetch the relevant ticket"

Run `gh issue view <number> --comments`, or `gh pr view <number> --comments` if the number is a PR.
