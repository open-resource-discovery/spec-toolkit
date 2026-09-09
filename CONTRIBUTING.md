# Contributing

## Code of Conduct

All members of the project community must follow the [SAP Open Source Code of Conduct](https://github.com/SAP/.github/blob/main/CODE_OF_CONDUCT.md).
Respectful collaboration helps us maintain a productive community.
Report abusive, harassing, or otherwise unacceptable behavior as described in the Code of Conduct.

## Engaging in Our Project

We use GitHub to manage reviews of pull requests.

- If you are a new contributor, read the [steps to contribute](#steps-to-contribute).

- Before implementing a change, create an issue that describes the problem or proposed enhancement.
  Mention that you are willing to work on it.

- The team will review the issue and decide whether to accept a pull request.
  If accepted, a maintainer will assign the issue to you.
  If not, the team will explain the decision in a comment.

## Steps to Contribute

Before working on an issue, leave a comment to claim it and avoid duplicating another contributor's work.

If you have questions about an issue, ask them in a comment so a maintainer can clarify.

## Contributing Code or Documentation

You are welcome to contribute code or documentation for an accepted issue.

The following rules apply to contributions:

- Contributions must be licensed under the [Apache License 2.0](./LICENSE).
- Contributors must accept the [Developer Certificate of Origin](https://developercertificate.org/) (DCO) when they create their first pull request.
  This happens automatically during submission.
- Contributions created with AI tools must follow the [guidelines for AI-generated code](https://github.com/SAP/.github/blob/main/CONTRIBUTING_USING_GENAI.md).

## Issues and Planning

- We use GitHub issues to track bugs and enhancement requests.

- Provide enough context for a maintainer to understand and reproduce the issue.

## Downstream Compatibility

The public specification compatibility workflow runs the checked-in generation commands from the ORD and CSN Interop repositories against the candidate Spec Toolkit package.
It runs for pull requests, on a weekly schedule, and on demand without publishing the package or accessing private repositories.
The workflow generates each specification twice and compares deterministic outputs, excluding XLSX files whose ZIP metadata contains generation timestamps.

Spec Toolkit maintainers own the initial triage when this workflow fails.
Use the repository revision, schema mode, and command in the workflow summary to reproduce the failure and determine whether it is a toolkit regression or downstream drift.
Fix toolkit regressions before merging the responsible change.
For downstream drift, open or link an issue in the affected public repository and coordinate the compatible change before updating this workflow.
