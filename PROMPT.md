TypeScript Conversion Prompt (Optimized)

  I want to convert this JavaScript codebase to TypeScript using a two-commit strategy for easy PR review.

  Critical Requirements

  DO NOT use git reset --hard at any point - it will delete uncommitted work.

  Two-Commit Strategy

  Commit 1: Pure File Renames (No Content Changes)

  1. Use git mv to rename all .js source files to .ts
  2. DO NOT modify file contents - this commit should show 100% similarity for all renames
  3. Commit immediately with message: "refactor: rename all JavaScript source files to TypeScript (.js → .ts)"

  Commit 2: Add TypeScript Types & Configuration

  Only after Commit 1 is complete:
  1. Add TypeScript type annotations to all .ts files
  2. Remove 'use strict'; directives (not needed in TypeScript)
  3. Change imports from './file.js' to './file' (extensionless)
  4. Delete all manual .d.ts files (TypeScript will generate these)
  5. Add configuration files
  6. Commit with message: "feat: add TypeScript type annotations and configuration"

  Files to Convert

  Root level: index.js, identity.js, monetization.js, payment.js
  src/ directory: All .js files (14 files)
  src/es5/ directory: All .js files (5 entry points)
  src/mocks/ directory: RESTClient.js

  TypeScript Settings

  tsconfig.json:
  - Target: ES5
  - Module: ES2015
  - Strictness: Moderate (not full strict mode)
    - Enable: strictNullChecks, strictFunctionTypes, strictBindCallApply, noImplicitThis
    - Disable: strict (set to false)
  - Generate declarations: true
  - Output directory: dist/

  Type Annotations to Add:
  - Function parameters and return types
  - Class property declarations
  - Use any type where appropriate for moderate strictness
  - Add type assertions where needed (e.g., (obj as any) for dynamic properties)

  Configuration Updates

  package.json:
  - Add dependencies: typescript@^5.3.0, @types/node@^20.0.0, @types/jest@^30.0.0
  - Add dependencies: @babel/preset-typescript@^7.23.2
  - Add dependencies: @typescript-eslint/parser@^3.10.1, @typescript-eslint/eslint-plugin@^3.10.1 (v3 for ESLint 6 compatibility)
  - Add scripts: "type-check": "tsc --noEmit", "build:types": "tsc --noEmit"
  - Update version script to use src/version.ts instead of .js
  - Add @babel/preset-typescript to babel.presets array (before @babel/preset-env)

  jest.config.js:
  - Add: moduleFileExtensions: ['js', 'ts', 'json']
  - Add: moduleNameMapper: { '^(\\.{1,2}/.*)\\.js$': '$1' }
  - Add: transform: { '^.+\\.(js|ts)$': 'babel-jest' }

  .eslintrc.yml:
  - Add overrides section for *.ts files with TypeScript parser and rules
  - Use @typescript-eslint/parser with project: "./tsconfig.json"
  - Disable import/extensions for TypeScript files (extensionless imports)
  - Allow @typescript-eslint/no-explicit-any (moderate strictness)

  build.sh:
  - Add npx tsc command at the beginning to compile TypeScript
  - Update all webpack paths from src/es5/*.js to dist/src/es5/*.js
  - Use npx webpack instead of just webpack

  scripts/genversion.js:
  - Change output filename from src/version.js to src/version.ts
  - Remove 'use strict' from generated content

  .gitignore:
  - Add dist/ to gitignore

  types/tiny-emitter/index.d.ts: (create new file)
  - Add type definitions for the tiny-emitter library

  Workflow Steps

  1. Verify current state: Check git status is clean on branch feat/ts-claude
  2. Create Commit 1:
    - Run all git mv *.js *.ts commands for all source files
    - Verify with git status that files show as renamed with R status
    - Commit immediately (don't modify file contents first!)
  3. Create Commit 2:
    - Now modify all .ts files to add type annotations
    - Create all configuration files
    - Stage and commit all changes
  4. Verify: Run npm install, npm run type-check, npm test, npm run lint

  Known Issues to Avoid

  - Don't use git reset --hard - it deletes uncommitted work
  - Don't copy backup files after git mv - modify the renamed files in place
  - Don't run Task tool with model: "haiku" - the model identifier is invalid
  - Don't modify files before committing the rename - git won't detect renames properly
  - ESLint v6 requires @typescript-eslint v3 - not v8 (peer dependency conflict)

  Files That Need Special Attention

  src/identity.ts - Largest file (~1150 lines), may have type assertion issues:
  - Use !!(condition) to ensure boolean type for assertions
  - Use (obj as any).property for dynamic property access
  - Check redirectUri && isUrl(redirectUri) patterns

  src/es5/*.ts - Entry point files:
  - Use require('regenerator-runtime') with (window as any)
  - Export syntax should be ES modules: export { Class } from '../class'

  Success Criteria

  - ✅ Two clean commits in git history
  - ✅ First commit shows 24 files renamed with 100% similarity
  - ✅ npm run type-check passes with no errors
  - ✅ npm test passes (all 264 tests)
  - ✅ npm run lint passes
  - ✅ ./build.sh successfully compiles and bundles