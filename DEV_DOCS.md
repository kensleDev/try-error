# Development Documentation

## Overview

This package uses GitHub Actions for automated publishing to npm. The workflow supports both beta releases (from main branch) and official releases (from git tags).

## Development Workflow

### 1. Regular Development (Beta Releases)

1. Make your code changes
2. Update the version in `package.json` if needed
3. Commit and push to main branch
4. GitHub Action automatically publishes with `beta` tag

```bash
# Make changes, then:
git add .
git commit -m "feat: add new feature"
git push origin main
```

### 2. Official Releases

1. Update the version in `package.json` to the release version
2. Commit the version change
3. Run the tagging script to create and push a version tag
4. GitHub Action automatically publishes as `latest` version

```bash
# Update version in package.json, then:
git add package.json
git commit -m "chore: bump version to 1.0.0"
npm run tag
```

## Available Scripts

- `npm run build` - Build the TypeScript package
- `npm run tag` - Create and push a git tag based on package.json version
- `npm run prepare` - Build package (runs automatically on npm install)
- `npm run prepublishOnly` - Build package before publishing

## GitHub Actions

The `.github/workflows/publish.yml` workflow automatically:

- Triggers on pushes to `main` branch and version tags (`v*`)
- Sets up Node.js 18 environment
- Installs dependencies with `npm ci`
- Builds the package with `npm run build`
- Runs tests if available
- Publishes to npm:
  - Main branch pushes → publishes with `beta` tag
  - Version tags → publishes as `latest` version

## Setup Requirements

1. **NPM Token**: Create an automation token at npmjs.com
2. **GitHub Secret**: Add the token as `NPM_TOKEN` secret in your GitHub repository settings

## Version Management

- Manual version control via `package.json`
- Use semantic versioning (e.g., `1.0.0`, `1.0.1`, `1.1.0`)
- Beta releases help test changes before official release
- Official releases should be well-tested and documented

## Publishing Strategy

- **Beta releases**: For testing new features and changes
- **Official releases**: For stable, production-ready versions
- Both use the same build process to ensure consistency
-
