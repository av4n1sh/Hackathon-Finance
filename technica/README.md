# Harbor Academy

A cream-and-green financial learning prototype with six lessons, six fictional investigations, deterministic ETF and tokenization labs, a Safety Vault, and Money Practice. Written Gemini explanations are optional. No real bank accounts, payments, or trading are connected.

## Start locally

Requires Node.js 18+ (verified on Node 24). Runtime uses built-in Node modules; no runtime dependency installation is needed.

From the workspace root:

```powershell
npm.cmd start
```

Open **http://localhost:3000**. VS Code's Chrome launch points to this port; start the server first or use **Start Harbor Academy server**. If you change the port, also update the Chrome launch URL.

For tests:

```powershell
npm.cmd --prefix technica ci
npm.cmd test
```

## Credentials and product confirmation

Copy `technica/.env.example` to `technica/.env` only if `.env` does not already exist. Enter newly generated credentials directly in that file:

```dotenv
GEMINI_API_KEY=
CAPITAL_ONE_API_KEY=
CAPITAL_ONE_PRODUCT=
GEMINI_MODEL=
PORT=
COOKIE_SECURE=
```

All placeholders above are intentionally empty. `.env` is excluded from version control at both workspace and application levels. Credentials are trimmed and read only on the server. Never put credentials in browser code, messages, screenshots, or logs. Key, model, and product changes in `.env` load on the next API request. Restart the server when changing its port or upgrading server code. Existing externally supplied environment variables take precedence over `.env`.

On **My progress**, each integration shows an actionable diagnostic, the last check time, and a **Test connection** button. Missing credentials do not make a provider request. Enter actual keys in `.env`, not `.env.example`. If an old server process is still running, the browser detects its incompatible API version and prompts a restart instead of showing misleading integration states.

**Capital One product confirmation is required.** The repository did not identify the product that issued the key. The implemented adapter targets **Nessie**, Capital One's synthetic banking sandbox. Confirm that your key came from [Nessie's developer portal](https://nessieisreal.com), then set `CAPITAL_ONE_PRODUCT=nessie`. A key alone does not select a product or prove that it works. If your key came from another portal, leave the product blank and provide that portal URL so the adapter can be reviewed against its actual contract. Do not try unrelated credentials against Nessie.

Use only synthetic practice data in the Nessie sandbox. If it has no checking or savings accounts, create fictional data through the official developer tools, or choose Harbor's local example. Harbor itself makes no provider writes. No additional customer/account ID configuration is required.

`GEMINI_MODEL` is optional; the default is `gemini-3.8-flash`. Current official documentation recommends newer models for new projects; access to the older 2.5 models is restricted to previous users. An override must be a valid Gemini model name supported by your Google project. `PORT` defaults to 3000. Set `COOKIE_SECURE=true` only behind HTTPS.

## What each integration does

| Integration        | Implemented role                                                                                                                                                                 | Honest failure behavior                                                                                                                                                                |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Capital One Nessie | Read-only synthetic checking/savings accounts, reported balances, deposit and withdrawal history                                                                                 | Unconfirmed product, absent key, rejected credentials, empty data, malformed responses, timeouts, and rate limits have explicit states. Local examples require a separate user choice. |
| Gemini             | Written investigation feedback, lesson/concept explanations, terminology, practice questions, reviewed-message guidance, and explanations of displayed Money Practice aggregates | Strict schema and field validation; authored fallback remains available. Failed requests report the problem instead of claiming a live answer.                                         |

Integration status starts **Not tested**. **Last request succeeded** means a relevant request actually completed and passed validation during the current server session. It is not a guarantee about future requests. Loading a local example does not test Capital One. A successful empty sandbox response is distinguished from populated activity. Gemini response provenance and account-data provenance are shown separately.

### Verified provider contracts

Official documentation inspected October 17, 2026:

- [Nessie interactive documentation](https://nessieisreal.com/docs), [published OpenAPI specification](https://nessieisreal.com/nessie-openapi-spec.yaml), and [getting started](https://nessieisreal.com/getting-started).
- The current documentation configures **`https://prod-api.nessieisreal.com`**, also listed in the published specification. The older getting-started example uses a different hostname; the adapter follows the current interactive specification. “Production” here refers to Nessie's hosted synthetic sandbox service, not real consumer banking.
- Authentication is the documented `key` query parameter. Only the server constructs this authenticated URL; it is never returned to the browser, included in Gemini context, or logged. Redirects are rejected to avoid forwarding credentials to another host.
- Requests are restricted to `GET /accounts`, `GET /accounts/{id}/deposits`, and `GET /accounts/{id}/withdrawals`. Accounts are selected from the key-owned listing; the browser receives temporary opaque selection handles. It cannot supply a provider URL or raw provider account ID. Purchases, transfers, bills, account creation, and transaction creation are not implemented.
- [Gemini model documentation](https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash), [generateContent reference](https://ai.google.dev/api/generate-content), and [structured outputs](https://ai.google.dev/gemini-api/docs/structured-output). The adapter uses `POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`, an `x-goog-api-key` header, `systemInstruction`, `contents`, and a JSON Schema in `generationConfig.responseJsonSchema`. Incomplete, malformed, extra-field, or oversized output falls back to authored text.

Provider requests have a 12-second timeout, bounded response sizes, and no automatic retries. API bodies are capped at 16 KB, API traffic at 120 requests per IP per minute, and cross-origin requests are rejected. These are prototype controls, not a production security certification.

## Money Practice

Choose **Load Nessie sandbox** or **Use local example**. Explore an account, inspect activity, compare local categories, answer a largest-outflow question, and try a fictional total-outflow limit. The example does not move funds or modify the account.

Amounts and totals are computed in application code using integer cents. Only `completed` deposits and withdrawals count; pending/cancelled records remain visible and are excluded. Unknown statuses or invalid amounts cause an explicit provider-data failure. No rows are silently truncated: an oversized response fails. The view covers all returned dates and only these two activity types. It is not a monthly statement, complete spending history, or reconciliation of the reported balance.

Categories use local description keyword rules (Food, Transport, Home, Leisure, Uncategorized). They are editable-code educational groupings, may be inaccurate, and are not bank-supplied categories. The budget exercise compares your chosen limit to the displayed completed withdrawals; it is not an income forecast.

Gemini receives the learner's question, data provenance, reported balance, aggregate totals, category totals, and record count. It does not receive account/customer identifiers, account numbers, nicknames, or raw transaction descriptions. The server uses its loaded snapshot, not client-submitted financial totals, and rejects an explanation request if its displayed snapshot is stale. Arithmetic never depends on a model response.

## Local progress and navigation

Lessons, best investigation scores, review notes, preferences, and drafts are saved **in this browser on this site**. There is no cross-device account or synchronization. Clearing browser storage removes local work. If storage is blocked, the interface reports that progress may be lost.

Existing cookie-linked progress files are read only to import previous lesson completions, scores, and notes when no browser snapshot exists. They are not rewritten or erased. The app writes no new disk progress files. During requests, the server keeps a temporary guest session for scoring, provider status, and the currently displayed sandbox snapshot. After a server restart, the browser restores its local learning snapshot. Local scores are editable prototype data, not tamper-proof achievements. Imported old files can be archived manually after verifying the browser copy.

Best-score scoring, sequential unlocks, authored case explanations, and 50 XP per completed lesson are preserved. Token balances remain a local fictional simulation that resets on refresh. ETF mixes, fee assumptions, and saved comparisons persist locally.

Shared tab transitions use 230 ms horizontal slides and gentle fades. Later tabs enter from the right; earlier tabs enter from the left. The outgoing visual copy is inert, hidden from assistive technology, stripped of IDs, and removed after animation. The content area clips horizontal movement and animates measured height changes. New navigation cancels old animation; the active indicator updates immediately. The header stays stationary. Reduced-motion users switch instantly. Detached forms retain their inputs and handlers; late responses cannot replace another screen. Main content receives focus after routing; deep Vault links focus the requested entry.

## Architecture

```text
server.js                 HTTP routes, validation, temporary sessions, static files
lib/providers.js          Gemini request/response validation and redaction
lib/config.js             server-only .env parsing and configuration refresh
lib/money.js              Nessie read-only adapter, normalization, deterministic totals
lib/store.js              temporary sessions, local-snapshot validation, legacy import
lib/scoring.js            deterministic investigation scoring and authored feedback
public/money-view.js      Money Practice, activity tables, budgeting, explanations
public/app.js             shared routing, transitions, drafts, guide, progress
public/lesson-view.js     lesson shortcuts, written checks and feedback
public/content.js         lesson questions and source metadata
public/lesson-details.js  expanded teaching, examples, choice feedback
public/cases.js            fictional evidence cases
public/case-actions.js    case-specific decisions and authored consequences
public/finance.js         ETF allocation, fee projection, token arithmetic
public/token-view.js      guided fictional 100-unit transfer exercise
public/vault.js           searchable sourced terminology and safety topics
public/styles.css         responsive typography and cream/green visual system
test/*.test.js            deterministic, HTTP, mock-provider and DOM checks
```

No runtime provider SDKs or dependencies are required. Development dependencies are jsdom and Prettier. Production authentication, cross-device storage, public hosting, and real financial account access are outside this prototype.

## Demonstration and award evidence

These are descriptions of implemented work, **not award-eligibility claims**. In particular, API integration alone does not establish eligibility for any Capital One award. Check actual event rules separately.

| Demonstration area | Reproducible evidence                                                                                              |
| ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| Education          | Complete a lesson, inspect authored feedback, then revisit a related concept in the Vault.                         |
| Gamification       | Submit an investigation and replay; equal scores do not add XP.                                                    |
| Gemini use         | With working credentials, ask about a lesson or displayed Money Practice totals; verify the actual response state. |
| Capital One use    | With a confirmed Nessie key and synthetic records, load an account and inspect read-only deposits/withdrawals.     |
| Financial learning | Compare fictional ETF costs and losses, investigate a promotional claim, and test a budgeting limit.               |
| UX                 | Navigate forward/backward, rapidly change tabs, return to unfinished work, and test reduced motion.                |

For a three-minute demonstration: complete the first lesson, compare ETF fees, classify a few investigation clues, explore Money Practice (clearly identify its source), request a written explanation, then refresh and show browser-saved progress. Demonstrate local examples honestly if authenticated calls are unavailable.

## Verification and remaining setup

The automated suite covers 15 tests, including the full learning/investigation journey, unchanged scoring, deterministic labs, local snapshot restoration after server restart, legacy import without new file writes, request validation, same-origin controls, rate limiting, and guest separation. Provider tests mock Nessie's documented paths/query authentication and Gemini's request/response schema. They cover credentials rejected, rate limits, timeout, malformed output, empty sandbox, aggregate-only Gemini context, and removed routes returning 404. Configuration tests check blank values, comments, quotes, and whitespace. API and DOM tests cover connection diagnostics, Money Practice, local persistence, forward/backward slide direction, cancellation, inert outgoing views, reduced motion, rapid routing, and preserved forms.

**No authenticated live provider request has been verified in this change.** Documentation retrieval and mock responses are not live integration proof. The user needs to confirm the key's developer portal, enter the new keys in `.env`, and test the relevant buttons. A configured key never automatically marks an integration working.

No connected browser is available in this environment. jsdom does not render CSS: desktop/mobile appearance, smoothness, overflow, actual height interpolation, real keyboard/assistive-technology behavior, and touch interactions still need a manual browser check.

Educational financial references remain linked inside lessons and the Vault. ETF projections use invented repeated returns and simplified annual fees; diversification does not guarantee gains. Token records do not create legal title or liquidity. The ocean image is served locally from `public/assets/coast.jpg`; [original image source](https://images.unsplash.com/photo-1473116763249-2faaef81ccda).
