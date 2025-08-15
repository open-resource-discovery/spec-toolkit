---
title: FAQ
sidebar_position: 22
---

# FAQ

#### Q: Should I write the spec in YAML or JSON

Both is possible. YAML has some [quirks that you need to be aware of](https://sidneyliebrand.medium.com/the-greatnesses-and-gotchas-of-yaml-5e3377ef0c55).

The advantage over JSON is that it's easy to add comments and especially to have information **reuse** through YAML anchors for merging data.
When writing the spec, it's very important to not duplicate information where possible, to avoid inconsistencies.

#### Q: Do you have a library for language XYZ?

Spec JSON Schema itself is described as standard JSON Schema and therefore the entire JSON Schema ecosystem can be used.
Of course the Spec-Toolkit specific JSON Schema additions will not be supported by general purpose libraries.
The specs written with the spec-toolkit are also exported as regular JSON Schema.

Consider using standard JSON Schema validators and converter tools like [quicktype](https://quicktype.io/).
VSCode and other IDEs also provide validation and code intelligence by pointing to a JSON Schema file in the root of a JSON document.
For YAML, the [Red Hat YAML](https://marketplace.visualstudio.com/items?itemName=redhat.vscode-yaml) extension will be necessary.
