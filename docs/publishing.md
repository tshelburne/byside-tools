# Publishing to npm

This monorepo uses [Changesets](https://github.com/changesets/changesets) with GitHub Actions to publish packages to npm.

## Authentication

Publishing uses npm Trusted Publishing with OIDC — GitHub Actions authenticates directly with npm without stored tokens.

### Setup (per package)

For each package you want to publish:

1. Go to https://www.npmjs.com → your package → Settings → Publishing access
2. Click "Add trusted publisher" → GitHub Actions
3. Configure:
   - **Repository owner:** tshelburne
   - **Repository name:** byside-tools
   - **Workflow filename:** release.yml

## Workflow

1. Create a changeset: `pnpm changeset`
2. Commit and push to `main`
3. GitHub Actions creates a "Version Packages" PR
4. Merge the PR to publish to npm
