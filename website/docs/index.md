---
slug: /
sidebar_position: 0
title: "Overview"
---

## Json Schema Specification Toolkit (v0 DRAFT)

:::note[Quick Facts]

- **STATUS**: <span className="feature-status-draft">DRAFT</span>. This project is currently 🚧 Work in Progress 🚧 not yet recommended to be productively used.
- v1 to be released Q4 2025 / Q1 2026.

:::

### Summary

If you're reading this page, you likely already understand the importance of formal interface contracts and specifications for integration and interoperability.

But writing good interface contracts and specifications is hard:

- The specification needs to be understandable to humans: after all, developers have to implement them.
- It also needs to be machine-readable to avoid manual (and error prone) work and to build an ecosystem of clients and libraries around the spec.
- Examples are an important part of the documentation.
- All of the above has to be 100% in sync with each other and without contradictions, otherwise adopters will make different assumptions, which leads to a broken / misunderstood contract in practice.
- Adopters need ways to very quickly get feedback if they implemented the specification correctly, so early validation (CLI, CI/CD) and live-feedback (in an IDE) is crucial.
- Writing a technical interface contract is not trivial, many mistakes can be made.

The **Json Schema Specification Toolkit** (short spec-toolkit) is a CLI program that helps you do that, based and expanded on the widespread [JSON Schema](https://json-schema.org/) standard.

It supports the JSON Schema specification creation and automatically generates documentation (in markdown format) out of the JSON Schema specification.

Other output formats like Typescript types, markdown mermaid diagrams, csv for tabular data etc. are supported via plugins.

### Contact

Create a GitHub PR or [issue](https://github.com/open-resource-discovery/spec-toolkit/issues) if you have questions or want to propose changes.
