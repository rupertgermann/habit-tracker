# Domain Docs

This is a single-context repo.

## Before exploring, read these if present

- `CONTEXT.md` at the repo root
- `docs/adr/` for architectural decisions relevant to the area being changed

If these files do not exist, proceed silently. The domain-modeling flow creates them lazily when terms or decisions are resolved.

## Use the glossary's vocabulary

When output names a domain concept, use the term as defined in `CONTEXT.md`. If a needed concept is missing, note it for domain modeling rather than inventing vocabulary.

## Flag ADR conflicts

If output contradicts an existing ADR, surface it explicitly rather than silently overriding it.
