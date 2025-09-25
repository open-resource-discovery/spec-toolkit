# CHANGELOG

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html) rules,
but omits the **patch** level in the spec version number.

For a roadmap including expected timeline, please refer to [ROADMAP.md](./ROADMAP.md)

## [unreleased]

- added general config parameter `tsTypeExportExcludeJsFileExtension` for suppressing the `.js` file ending for typescript types exports
- remove general config parameter `sortProperties` which had no concrete implementation or effect when configured

## [0.3.3]

- fix table pattern properties cannot be of type `<string>` because html tag characters are not escaped

## [0.3.2]

- fix json examples should be represented as json in generated markdown files and jsonc examples as jsonc

## [0.3.1]

- added support for `jsonc` as example file format
- added support for `intro` and `outro` files for examples
