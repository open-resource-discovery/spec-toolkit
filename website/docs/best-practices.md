---
title: Best Practices
sidebar_position: 20
---

# Best Practices

Use these recommendations as a starting point for specifications built with Spec Toolkit.
If your specification belongs to an established ecosystem, follow that ecosystem's conventions first.

## Keep one source of truth

A specification has several representations: its schema, human-readable documentation, examples, and generated types.
Maintaining the same information manually in several places causes those representations to drift apart.

Choose one authoritative source and derive the others from it.
Spec Toolkit supports a schema-first workflow in which JSON Schema drives Markdown documentation, consumable JSON Schema files, and TypeScript types.
If your project is model-first, generate the input schema from the model before running Spec Toolkit.
Document where generated artifacts come from and how contributors can regenerate them.

## Validate early

Validate documents before a system stores, transforms, or acts on them.
Run validation in continuous integration and, where possible, provide feedback in the editor.
JSON Schema validates document structure, but some rules require additional checks, such as relationships between fields or naming conventions.

Provide both complete document examples and focused property examples.
Validate every complete example against the schema so examples remain trustworthy blueprints for users.

## Prefer established conventions

Reuse standard formats and ecosystem conventions before defining a custom representation.
Standard representations are easier to understand and have existing parsers, validators, and editor support.

Model only cases that exist today.
A published property or behavior is a promise to consumers, even when no implementation supports it yet.
If future behavior must be documented, mark it clearly with `x-feature-status` instead of presenting it as available.

## Describe meaning, not only structure

Give every important object and property a clear `title` or `description`.
Explain its meaning, when it should be used, and any units or constraints that its type does not make obvious.
These descriptions become generated documentation and editor hints, so keep them in the schema rather than duplicating them in prose.

A plain `enum` cannot describe each value individually.
When values need separate explanations, use branches with `const` and `description`.

## Choose defaults carefully

Keep the required set small when omission can have a safe, predictable meaning.
Use the JSON Schema `default` keyword for a static default, but do not assume that a validator applies it automatically.
Validation treats `default` as an annotation unless the consuming tool implements defaulting.

Distinguish omitted values from `null`, empty collections, empty strings, zero, and `false`.
Do not rely on a difference that the contract does not explain.

## Define how unknown fields behave

Decide whether consumers reject, preserve, or discard properties that the schema does not describe.
Consumers cannot infer this behavior from an open schema.

For objects with named, contract-defined properties, `additionalProperties: false` catches spelling mistakes and prevents accidental fields.
Decide this policy early because closing an object later is a breaking change.

An intentional map is different from a typed object.
A map has user-defined keys, so keep it open and constrain its values with `additionalProperties` where possible.
Do not use a map merely to postpone defining known fields.

## Reserve space for extensions

Keep extension properties separate from standard properties to prevent future name collisions.
Common approaches include a reserved prefix such as `x-` or a dedicated extension object.
State which namespace is reserved for the specification and ensure consumers preserve supported extension data.

Spec Toolkit plugins use names such as `x-<pluginName>-<propertyName>` for plugin-specific extensions.
Use the same convention consistently throughout a specification.

## Design for compatible evolution

A change is backward compatible when documents that were valid before remain valid and keep the same meaning.
Typical compatible changes include adding optional properties and improving descriptions.

Typical breaking changes include:

- adding a required property;
- removing or renaming a property;
- changing a property's type or meaning;
- tightening a validation constraint;
- closing an object that previously accepted unknown properties; and
- adding a value to an enumeration that consumers were told was closed.

Prefer additive changes and introduce a new major version for incompatible changes.
Remember that documents often remain in source control or storage long after they were created.

Choose shapes that can grow.
For example, model a relationship as an object when it may later need metadata, rather than as a bare string that cannot be extended compatibly.
Avoid multiple ways to express the same fact because every representation becomes part of the compatibility surface.

## Make unions unambiguous

Avoid polymorphic values when one clear shape is sufficient.
When several object shapes are necessary, give every variant a required discriminator such as `type` or `kind`.
Assign a distinct `const` value to each variant and make the branches mutually exclusive.
This makes the intended variant clear to readers, validators, and generated code.

## Constrain what you can guarantee

Use constraints such as `minLength`, `maxLength`, `pattern`, `minimum`, and `required` when they express real guarantees.
Do not invent constraints that implementations cannot uphold.
Although relaxing a constraint usually widens the set of valid documents, consumers may still depend on the old limit, so document compatibility expectations clearly.

Use standard `format` values where they improve documentation and tooling.
Check whether your validator asserts formats, because JSON Schema implementations may treat them as annotations.
Represent integers or decimals that can exceed the precision of common JSON number implementations as strings.

Choose names that map cleanly to generated code.
Names beginning with a letter and containing only letters, digits, and underscores work across most target languages.
Apply casing and terminology consistently throughout related schemas.

## Treat robustness as an explicit contract

Do not interpret "be liberal in what you accept" as permission to ignore schema violations.
Be liberal only where the contract explicitly allows extension or variation, and remain strict about its normative constraints.

State what consumers may rely on and what may change.
As [Hyrum's Law](https://www.hyrumslaw.com/) warns, consumers may otherwise depend on any observable behavior, including behavior the specification never intended to guarantee.
