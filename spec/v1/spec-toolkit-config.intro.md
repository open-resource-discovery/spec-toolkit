# Spec-Toolkit CLI

This documentation explains how to use the Spec-Toolkit CLI tool. However, most will be done via the [configuration file](#configuration-file-interface-documentation).

## Prerequisite

1. You have installed Node v22 or higher and npm v10 or higher from: [nodejs](https://nodejs.org/en/download/).

1. You have installed the CLI tool on your local machine.

   ```bash
   npm install -g @open-resource-discovery/spec-toolkit
   ```

1. You have prepared a local [configuration file](#configuration-file-interface-documentation).

## CLI signature

Use the CLI tool via [npx](https://docs.npmjs.com/cli/v11/commands/npx).

```sh
# By default it will look for a `./spec-toolkit.config.json` config file in the CWD
npx @open-resource-discovery/spec-toolkit

# Possible to pass a configuration file by file path
npx @open-resource-discovery/spec-toolkit -c ./spec-toolkit.config.json

```

## CLI options

| Name | Value              | Description                                           |
| ---- | ------------------ | ----------------------------------------------------- |
| `-c` | `<configFilePath>` | Configuration file, containing a valid JSON document. |

## Configuration File Interface Documentation

Spec-Toolkit CLI root level configuration document (`spec-toolkit.config.json`), which contains:

- Global config
- Array of all specs JSON Schema files as input and their configuration
- Optional: Array of all spec extensions and their configuration
- Optional: Add plugin config for additional output formats (like diagrams, example files, typescript types).
