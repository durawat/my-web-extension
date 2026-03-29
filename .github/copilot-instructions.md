# Copilot instructions

## Repository state

This repository is currently an early-stage browser extension workspace. At the moment, the checked-in project files are minimal and centered on `README.md`, which describes the repo as a starter foundation that will evolve as features, structure, and tooling are added.

## Build, test, and lint commands

There are currently no checked-in build, test, or lint scripts/configuration files in this repository. Before suggesting commands, inspect the repo for newly added tooling instead of assuming `npm`, `pnpm`, or extension-specific workflows exist.

## High-level architecture

The current architecture is intentionally minimal:

- `README.md` is the main source of project-level intent and explains that the repository is a lightweight starter workspace for a web extension.
- No extension manifest, source tree, package manager config, or CI/test setup is present yet.
- Treat the repository as a blank foundation where the code organization will be defined by future additions rather than existing structure.

## Key conventions

- Keep guidance aligned with the repo's current early-stage status; do not invent implementation details, commands, or directories that are not checked in.
- When adding project structure or tooling, update `README.md` to reflect the new setup because it currently serves as the primary project documentation.
- Prefer repository-specific instructions grounded in actual files over generic browser-extension assumptions.
