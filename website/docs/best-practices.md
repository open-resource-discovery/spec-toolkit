---
title: Best Practices
sidebar_position: 20
---

## Best Practices and Paradigms for Writing Specs

> TODO: This are just random thoughts right now, needs proper writing up.

### Paradigms

#### Decouple message format from protocol

#### Validation is Key

#### Lots of Examples

Provide many correct examples.
Make sure to validate the examples against the spec so they never get inconsistent.
Many developers start by copy'n'pasting examples and from there adjusting them until they achieve their goal.
Keep this in mind when designing the examples that they will be effectively blueprints for others.

#### Refer to and build on existing established Specs

Where possible, extend and expand on existing well-established specifications.

#### If in doubt, leave it out

If the need for a feature or how it's to be specified is unclear, better leave it out and add it later.

#### Do not Repeat Yourself (DRY)

While this principle is likely overstretched for programming projects, for specifications it really hits true.
Almost nothing hurts a specification like inconsistencies.

Therefore avoid duplicate information where possible. The spec-toolkit is built to help you with this.

#### Don't get in the way of Business

In the end, we're solving real-world problems and business use-cases.
Technical perfection will not help if those are not met.

### Compatibility and Lifecycle

#### Avoid incompatible Changes

Think forward how to design the spec so you can add features later without introducing breaking changes.
It's important to understand that what constitutes a breaking change may differ from the provider perspective and the consumer perspective.

#### Robustness principle

> "be conservative in what you send, be liberal in what you accept".

The principle is also known as Postel's law, after Jon Postel, who used the wording in an early specification of TCP.

Important to state what consumers have to accept as compatible, otherwise it is difficult to evolve the spec compatibly.

### Hyrims Law

See [hyrumslaw.com](https://www.hyrumslaw.com/)

Therefore it is important to be very precise what the consumer can rely on and what they can't.
