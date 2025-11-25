# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Building
```bash
./build.sh
```
Builds ES5-compatible versions of the SDK using webpack and babel. Creates minified and unminified versions in the `es5/` directory for Identity, Monetization, Payment, and Global bundles. Uses `--openssl-legacy-provider` flag due to older webpack/node compatibility.

### Testing
```bash
npm test              # Run all tests with Jest
npm run cover         # Run tests with coverage report
jest path/to/test.js  # Run a specific test file
```

Tests are located in `__tests__/` directory. Test files follow naming conventions:
- `*.utest.js` - Unit tests
- `*.intest.js` - Integration tests

### Linting
```bash
npm run lint          # Check for linting errors
npm run lint:fix      # Auto-fix linting issues where possible
```

### Documentation
```bash
npm run docs          # Generate JSDoc documentation in docs/
```

### Release Process
```bash
npm version <major|minor|patch>
```
This runs lint and tests, updates package.json version, generates `src/version.js`, commits, tags, and pushes to GitHub. NPM publishing happens automatically via CI/CD.

## Architecture Overview

### Three Main SDK Classes

The SDK exposes three primary classes for browser-based Schibsted Account integration:

1. **Identity** (`src/identity.js`)
   - Core authentication and user management
   - Handles login/logout flows (redirect and popup modes)
   - Session state management via Session Service
   - User profile queries (`getUser()`, `getUserId()`, etc.)
   - Emits events for login/logout state changes
   - Extends `EventEmitter` for event-driven architecture

2. **Monetization** (`src/monetization.js`)
   - Product access and subscription validation
   - Primary method: `hasAccess()` for checking user entitlements
   - Supports both Schibsted Account product IDs and Zuora feature IDs
   - Session Service integration required

3. **Payment** (`src/payment.js`)
   - Payment flow management via paylinks
   - Purchase URLs and popup-based payment flows
   - Voucher redemption and payment history

### Key Architectural Patterns

**Session Service Architecture**
- SDK primarily communicates with Session Service (not directly with Schibsted Account)
- Session Service must be on brand domains (e.g., `id.vg.no`) to avoid third-party cookie blocking
- Session cookie refresh requires full-page redirects on Safari (ITP mitigation) via `/v2/session` endpoint
- Local development requires matching top-level domain with Session Service domain

**Environment Configuration** (`src/config.js`)
- Predefined endpoints for SPiD, BFF, and Session Service across environments
- Supported environments: `LOCAL`, `DEV`, `PRE`, `PRO`, `PRO_NO`, `PRO_FI`, `PRO_DK`
- URL mapping handled by `urlMapper()` in `src/url.js`

**REST Communication** (`src/RESTClient.js`)
- Abstraction layer for all HTTP communication
- Uses browser's native `fetch` API
- Handles parameter encoding and response parsing
- Supports custom logging functions for debugging

**Authentication Flows**
- OAuth2/OpenID Connect based
- Supports multiple authentication methods via `acrValues`:
  - `password` - Traditional username/password
  - `otp-email` - Passwordless email code
  - `eid` - BankID integration (Norway/Sweden)
  - `otp` - Time-based one-time password
  - `sms` - SMS code authentication
  - Multiple methods can be combined (e.g., `password otp sms`)
- State parameter required for CSRF protection

**Event System**
- Each class extends `tiny-emitter` for pub/sub patterns
- Global window events emitted when instances are created:
  - `schIdentity:ready`
  - `schMonetization:ready`
  - `schPayment:ready`

**Caching** (`src/cache.js`)
- Uses browser `sessionStorage` for temporary data caching
- Cache keys namespaced to avoid conflicts

**Popup Management** (`src/popup.js`)
- Handles authentication popup windows
- Fallback to redirect flow if popup blocked
- Uses `postMessage` for cross-window communication via `spidTalk.js`

### Module Organization

**Main Entry Points:**
- `index.js` - ES6+ exports of Identity, Monetization, Payment
- `src/es5/` - Transpiled ES5 versions for legacy browser support
  - `index.js` - All three classes
  - `identity.js`, `monetization.js`, `payment.js` - Individual classes
  - `global.js` - Adds classes to global window object

**Utilities:**
- `src/validate.js` - Input validation and assertions
- `src/object.js` - Object manipulation utilities
- `src/url.js` - URL mapping and validation
- `src/SDKError.js` - Custom error class
- `src/version.js` - Auto-generated version string
- `src/global-registry.js` - Registers instances globally on window

**TypeScript Support:**
- TypeScript definitions (`.d.ts` files) co-located with source
- Root `index.d.ts` exports all public types

### Important Implementation Details

**Session State Methods:**
- `isLoggedIn()` - User has valid Schibsted Account session
- `isConnected()` - User has accepted terms for specific client
- Both methods may trigger Safari redirect for session refresh

**Simplified Login Widget:**
- `showSimplifiedLoginWidget()` - Lightweight login prompt
- Requires no site-specific terms in Schibsted Account flow
- Returns `true` if widget displayed
- Accepts same parameters as `login()` (state parameter required)

**Third-Party Cookie Considerations:**
- Local HTTPS required for development to match Session Service scheme
- Top-level domain must match Session Service domain
- Safari redirects necessary for cookie refresh (ITP mitigation in v5.x)

**Browser Compatibility:**
- Default build uses modern ES2017+ syntax
- ES5 builds available for legacy browsers via `@schibsted/account-sdk-browser/es5/*`
- Polyfills may be needed: Promise, URL, Object.entries, fetch, Number.isFinite, Number.isInteger

## Migration Notes

When migrating to v5.x (ITP support), be aware that `hasSession`-dependent methods (`isLoggedIn`, `isConnected`, `getUser`, etc.) may trigger full-page redirects to refresh Safari session cookies. Use the callback option in Identity constructor to preserve state before redirect.
