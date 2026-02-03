# linter-eslint-8

ESLint v8 linter provider. Lints JavaScript files using project-level `.eslintrc.*` configuration files. Package used linter top-level API to visualize errors and other types of messages with ease.

## Installation

To install `linter-eslint-8` search for [linter-eslint-8](https://web.pulsar-edit.dev/packages/linter-eslint-8) in the Install pane of the Pulsar settings or run `ppm install linter-eslint-8`. Alternatively, you can run `ppm install asiloisad/pulsar-linter-eslint-8` to install a package directly from the GitHub repository.

## How it works

- Activates automatically for JavaScript files
- Looks for `.eslintrc.*` files in the project tree (`.eslintrc.js`, `.eslintrc.json`, `.eslintrc.yaml`, etc.)
- If no ESLint config is found, the package silently does nothing
- Uses the bundled ESLint v8 — no global install needed
- Respects `.eslintignore` files
- Provides precise token-level highlighting for lint messages

## Commands

Commands available in `atom-workspace`:

- `linter-eslint-8:reload`: reset the ESLint engine and re-lint open editors,
- `linter-eslint-8:open-config`: open the global default ESLint config.

## Global default config

You can create a global ESLint config that applies as a base to all projects. Run `Linter Eslint 8: Open Config` from the command palette to create and edit `~/.pulsar/eslint-8.default.js`. Project `.eslintrc.*` files will extend/override these settings.

## Contributing

Got ideas to make this package better, found a bug, or want to help add new features? Just drop your thoughts on GitHub — any feedback’s welcome!
