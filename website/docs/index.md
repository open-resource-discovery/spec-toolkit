---
slug: /overview
sidebar_position: 0
title: "Overview"
---

## JSON Schema Specification Toolkit (v0 draft)

:::note[Quick Facts]

- **Status**: <span className="feature-status-draft">DRAFT</span>. This project is a work in progress and is not yet recommended for production use.

:::

### Summary

Formal interface contracts and specifications support reliable integration and interoperability.

Writing them well can be difficult:

- A specification must be clear to the people who implement it.
- It should also be machine-readable to reduce manual, error-prone work and support an ecosystem of clients and libraries.
- Examples must remain consistent with the specification.
- Human-readable documentation, machine-readable schemas, and examples must not contradict one another.
- Adopters need quick feedback through command-line tools, continuous integration, and editor validation.

The **JSON Schema Specification Toolkit**, or **Spec Toolkit**, is a command-line tool for creating and maintaining these contracts.
It builds on the widely supported [JSON Schema](https://json-schema.org/) standard.

Spec Toolkit generates Markdown documentation and distributable JSON Schema files from a JSON Schema source.

Plugins can generate other formats, including TypeScript types, Mermaid diagrams, and CSV files.
See the [best practices](./best-practices.md) for guidance on writing clear, evolvable specifications.

### Contact

Open a GitHub pull request or [issue](https://github.com/open-resource-discovery/spec-toolkit/issues) if you have questions or want to propose a change.
