# Spec: System Review and Cleanup

## 1. Intent
Review the codebase for functionality, optimize Tailwind configuration by migrating to CSS-first approach, and ensure GitHub Pages deployment is robust.

## 2. Requirements
- Remove `tailwind.config.js` and move its configurations to `input.css`.
- Ensure `.github/workflows/pages.yml` works correctly (handle missing `package-lock.json`).
- Verify overall system functionality and compliance with `ARCHITECTURE_RULES.md`.

## 3. Classification
- **Task Group**: development/operations
- **Skills Required**: None

## 4. Affected Components
- `input.css`
- `tailwind.config.js`
- `.github/workflows/pages.yml`
- `package.json` (potentially)

## 5. Execution Steps
1. Migrate theme extensions from `tailwind.config.js` to `@theme` block in `input.css`.
2. Remove `@config` directive from `input.css` and delete `tailwind.config.js`.
3. Update `.github/workflows/pages.yml` to use `npm install` instead of `npm ci` if `package-lock.json` is missing, or generate `package-lock.json`.
4. Review `game.js` and `views/` for any broken references or logic.
5. Build CSS and verify output.

## 6. Verification
- `npm run build:css` completes without errors.
- `assets/css/style.css` contains variables for `panel`, `gamebg`, and `accent`.
- GitHub Actions workflow file is updated.
