# Contributing to GitStory

Thank you for your interest in contributing to GitStory! We welcome bug fixes, visualization ideas, new metrics, and documentation improvements.

## Development Setup

1. Fork and clone the repository:
   ```bash
   git clone https://github.com/<your-username>/gitstory.git
   cd gitstory
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Setup environment variables:
   ```bash
   cp .env.example .env.local
   ```
   *(Optional)* Add a GitHub token (`GITHUB_TOKEN=ghp_...`) to increase your API rate limit from 60 to 5,000 requests/hour.

4. Start the development server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Code Quality & Standards

- **Strict TypeScript:** No `any` types. Ensure all models and metrics are strongly typed.
- **Testing:** Run `npm run test` to verify unit tests for analytics and milestone algorithms.
- **Type Checking:** Run `npm run typecheck` (`tsc --noEmit`) to verify strict type safety.
- **Conventional Commits:** Use standard conventional commit prefixes (`feat:`, `fix:`, `docs:`, `chore:`, `test:`).

## Pull Request Guidelines

1. Create a feature branch: `git checkout -b feat/my-new-visualization`
2. Write clean code with accompanying tests.
3. Verify `npm run test` and `npm run typecheck` both pass.
4. Open a pull request targeting the `main` branch.

