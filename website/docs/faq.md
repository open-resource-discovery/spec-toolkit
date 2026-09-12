---
title: FAQ
sidebar_position: 22
---

# Frequently Asked Questions

## Should I write a specification in YAML or JSON?

Spec Toolkit accepts both formats.
YAML is often easier to read and supports authoring conveniences such as comments and anchors.
JSON has fewer parsing surprises and is the format produced for downstream consumers.

Both formats represent the same JSON data model during validation.
Do not give contract meaning to YAML comments, anchors, aliases, or scalar presentation because that information does not survive conversion to JSON.

## Which JSON Schema dialect should I use?

Spec Toolkit currently extends JSON Schema draft-07.
Declare the dialect in schema documents with `$schema`, and use the [Spec Toolkit schema](./docs/spec.md) to see the supported keywords and extensions.
Do not assume that keywords introduced in newer JSON Schema drafts are supported.

## What is the difference between `$schema` in a schema and in an instance document?

In a schema document, `$schema` selects the JSON Schema dialect used to interpret that schema.
In an instance document, a `$schema` property can point editors and other tools to the contract that describes the document.
Your schema must explicitly allow that instance property if the containing object rejects unknown fields.

## Does `default` automatically add a missing value?

No.
In JSON Schema, `default` is an annotation.
A consumer may choose to apply it, but validation alone does not modify the document.

## Can I use Spec Toolkit with my programming language?

Specifications created with Spec Toolkit are exported as standard JSON Schema, so they can be consumed by the broader JSON Schema ecosystem.
Spec Toolkit-specific extensions may be ignored by general-purpose libraries.

Use a JSON Schema validator or converter that supports your language.
Editors such as Visual Studio Code can also provide validation and completion when a document points to its schema.
For YAML files in Visual Studio Code, install an extension with JSON Schema support, such as [YAML by Red Hat](https://marketplace.visualstudio.com/items?itemName=redhat.vscode-yaml).
