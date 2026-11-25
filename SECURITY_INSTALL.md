# Dependency installation security

Use npm 11.20.0 or later for repository development.
CI bootstraps npm 11.20.0 before npm commands.
Published consumer engine requirements are unchanged.

Install from the committed lockfiles with npm ci.
npm applies the two-day minimum release age when it resolves versions, including lockfile updates.
When npm ci reuses a valid lockfile, it does not independently recheck release age.
Dependency lifecycle scripts and automatic pre/post hooks are disabled during installation.
Run `npm run setup:hooks` after `npm ci` to install local Husky hooks.
Run repository build and generation commands explicitly.
Review a dependency script and its registry identity/integrity before changing its entry to true.
Avoid scope-wide age exceptions, and use a documented package/version exception only for an urgent reviewed security fix.

Policy roots:

- .

After updating dependencies, review lockfile packages marked hasInstallScript and update the version-specific decisions.
Verify npm config get min-release-age and npm config get strict-allow-scripts in every install root.
Unsupported clients may ignore these controls; the documented development client and CI pin are part of the policy.
