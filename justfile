# List recipes
default:
    @just --list

# Install deps and generate WXT types
install:
    pnpm install

# Dev build with hot reload (browser: chrome or firefox)
dev browser="chrome":
    pnpm wxt -b {{ browser }}

# Production build for Chrome and Firefox
build:
    pnpm build
    pnpm build:firefox

# Release zips for Chrome and Firefox in .output/
zip:
    pnpm zip
    pnpm zip:firefox

# Lint with Biome
lint:
    pnpm lint

# Apply Biome formatting and safe fixes
format:
    pnpm format

# Typecheck with tsc
typecheck:
    pnpm typecheck

# Run unit tests once
test:
    pnpm test

# Run unit tests in watch mode
test-watch:
    pnpm test:watch

# Run everything CI runs
ci:
    pnpm install --frozen-lockfile
    pnpm lint
    pnpm typecheck
    pnpm test
    pnpm build
    pnpm build:firefox

# Remove build output and generated types
clean:
    rm -rf .output .wxt

# Run the Release workflow on GitHub as a dry run (checks store credentials)
release-dry-run:
    gh workflow run release.yml

# Bump the version (patch, minor or major), tag it, and push to trigger a store release
[confirm("This pushes a tag and submits to the Chrome Web Store. Continue?")]
release bump="minor":
    git diff --quiet && git diff --cached --quiet
    test "$(git branch --show-current)" = master
    pnpm version {{ bump }}
    git push --follow-tags
