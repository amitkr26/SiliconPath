# Contributing to SiliconPath

Thank you for your interest in contributing to SiliconPath! 

## Branching Strategy

We use a simple feature branch workflow:
1. `main` is the primary production branch. It is protected and deploys automatically to Vercel.
2. For new features or bug fixes, branch off `main` using the following naming convention:
   - `feat/feature-name` for new features.
   - `fix/bug-name` for bug fixes.
   - `docs/doc-name` for documentation updates.

## Commit Conventions

We follow [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/). Please prefix your commit messages appropriately:
- `feat:` A new feature
- `fix:` A bug fix
- `docs:` Documentation only changes
- `style:` Changes that do not affect the meaning of the code (white-space, formatting, etc)
- `refactor:` A code change that neither fixes a bug nor adds a feature
- `perf:` A code change that improves performance
- `test:` Adding missing tests or correcting existing tests
- `chore:` Changes to the build process or auxiliary tools

Example: `feat: add new scraper for IISc Bangalore`

## Local Development Setup

1. **Prerequisites**: You must have Node.js 20+ and `pnpm` installed.
2. **Clone the repo**: `git clone https://github.com/amitkr26/SiliconPath.git`
3. **Install dependencies**: Navigate to the `electrobridge` directory and run `pnpm install`.
4. **Environment Variables**: Copy `.env.local.example` to `.env.local` and add the required database URLs and AI API keys. *(Note: `.env.local.example` does not currently exist in the repo — you may need to create it manually or obtain it from a maintainer.)*
5. **Run the server**: `pnpm dev`

## Running Tests

All new code must be covered by tests. SiliconPath uses Jest.

```bash
# Run the test suite once
pnpm test

# Run tests in watch mode
pnpm run test:watch
```

Ensure `pnpm test` passes and `pnpm build` completes without errors before submitting a PR.

## Pull Request Process

1. Open a Pull Request against the `main` branch.
2. Describe your changes in detail in the PR body.
3. Ensure the Vercel preview deployment builds successfully.
4. Wait for a maintainer to review and merge your code.
