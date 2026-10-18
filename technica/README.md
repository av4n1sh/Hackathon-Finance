# Harbor Academy · Everyday money practice

Harbor helps people practice everyday money decisions in a welcoming environment. The central activity is **Your Money Adventure**, a connected fictional week with five decisions. The interface has only **Play**, **Learn**, and **Community**; a small header panel holds progress.

## Run

Requires Node.js 18+. From the workspace root, run `npm.cmd start` and open **http://localhost:3000**. No installation or credentials are needed for runtime. The server binds to `127.0.0.1`; `PORT` defaults to 3000. Restart it after changing server code or the port.

For development: `npm.cmd --prefix technica ci`, then `npm.cmd test`. `npm.cmd --prefix technica run format` formats source using Prettier. The only development dependencies are jsdom for DOM checks and Prettier for formatting.

## One complete learning journey

Choose a bag ($48) or raincoat ($42) as the useful purchase in the same five-day story. Start with a clearly labeled simulated $140: $60 set aside for food, shared household costs, and caregiving; $80 available for decisions.

1. Pause or keep a $12 subscription.
2. Pay for an accessible shuttle or rearrange a caregiving visit for a free ride tomorrow.
3. Compare a $12 cash-counter pass with a $15 online option including its fee.
4. Independently verify a suspicious gift-card demand, check with someone, or see the fictional consequence of paying it.
5. Buy a durable item, pay $32 for a secondhand item plus repair, or wait and keep a buffer.

Earlier spending changes which final purchases remain affordable. Unaffordable options explain the gap. Each choice immediately changes the budget and gives an authored consequence. Contextual reflections ask players to identify the actual trade-off; correct reasoning earns a named skill badge regardless of spending. Players can retry the current choice, revisit previous days, or replay a different route. There are no wealth rankings, timers, streaks, or penalties for leaving.

All amounts are integer cents in deterministic code. Restoring a save replays validated choices and recomputes totals rather than trusting saved balances. The ending describes the chosen outcome, costs, and skills. A delayed purchase is a valid ending.

### More ways to play

The harbor map shows five illustrated stops, your current location, and the route you chose. Revisit any completed stop to replay from that day; later decisions and activities reset, while earned learning stamps remain in your passport. Upcoming stops are shown without allowing the story to be skipped.

Three optional hands-on activities make the skills something you do:

- **Envelope arranger (day 1):** move $10 notes between practice envelopes to cover essentials and a purchase. Several splits work. This separate board does not change the story’s established $60/$80 starting split.
- **Receipt builder (day 3):** add and remove the advertised pass and service charges to reveal the full online price.
- **Message detective (day 4):** inspect urgency and a gift-card request, then choose an independent verification route. The message’s deadline is fictional; no timer runs.

Five reasoning badges and these three activities form eight unique passport stamps. Milestones progress from **Ready to explore** to **Curious explorer**, **Money navigator**, and **Everyday explorer**. Stamps reflect demonstrated skills, not money left. They can be earned once each; repeating an activity does not generate extra rewards. A visible stamp meter and dismissible celebration mark progress. The passport also remembers distinct completed choices across replays. Everything stays local to this browser; previous saves are supported. All new controls work with buttons and keyboard focus, with text outcomes and reduced-motion support.

## Learn and inclusion

Six short lessons address planning, fees, safe payments, irregular income, borrowing, and unexpected costs. Each has a direct explanation, fictional example, optional detail, practice with feedback, supporting source, and a link to the relevant story day. Links return to the current saved decision; they do not skip forward or overwrite the story.

Content includes cash payments, changing income, shared bills, caregiving, transport access, and time costs. It does not assume a bank account, credit card, car, fixed salary, family support, or a fixed savings percentage. Feedback explains resource gaps respectfully and treats access and enjoyment as valid factors.

The interface uses a system sans-serif with Georgia reserved for major headings, cream and forest green, large targets, semantic headings, labeled controls, a skip link, visible keyboard focus, text descriptions of all budget information, live feedback, responsive layouts, and reduced-motion CSS. Three-tab transitions slide in the navigation direction. Game state survives tab changes and refresh; contribution drafts remain in memory across tabs, without storing potentially private text in localStorage.

English interface and learning copy are centralized in `public/content.js` where practical. App interface strings remain English in `app.js`; a full localization pass must extract those too. No additional language is offered: a translation must include the interface, stories, feedback, consent, removal, and core lessons and receive human review before release.

Supporting primary sources checked October 17, 2026:

- [CFPB Your Money, Your Goals toolkit](https://www.consumerfinance.gov/consumer-tools/educator-tool/your-money-your-goals/toolkit/) supports spending plans, cash-flow timing, fees, and borrowing-cost comparisons.
- [CFPB emergency fund guide](https://www.consumerfinance.gov/an-essential-guide-to-building-an-emergency-fund/) supports adapting savings to circumstances and planning for unexpected costs.
- [FTC gift-card impersonation warning](https://consumer.ftc.gov/consumer-alerts/2026/01/no-thats-not-your-boss-asking-you-buy-gift-cards) supports pausing urgent requests, independent verification, and contacting a gift card company after a scam.

Amounts, narrative, questions, and choices are authored fictional examples, not quotations or personal financial recommendations. Educational content remains available without AI.

## A real contribution path

Community prominently invites an everyday situation, what makes it difficult, what someone should understand, and optional wording or accessibility improvements. No demographic, contact, or account information is requested. The form asks contributors to leave private details out and permits a nickname or anonymous public credit.

The workflow is **Submit → Review → Edit into a learning scenario → Publish with permission**:

- `POST /api/community` validates fields and required adaptation consent, generates a receipt, and persists a private original. Public-publication consent is separate and optional.
- `GET /api/community` exposes only published, edited learning notes and the contributor’s chosen credit. Original text, review state, and removal hashes never appear there.
- A reviewer uses **Reviewer access** in the footer (`/review.html`). Authentication is checked on every reviewer API action. The secret stays in page memory, is cleared on locking/leaving, and is never put in browser storage.
- Reviewers mark a submission reviewed, save a learning draft with a fictional situation, explanation, and description of its contribution, then explicitly confirm source/privacy review before publishing. The server refuses skipped stages and publication without the contributor’s permission. Reviewers can unpublish or decline a suggestion.
- Published adaptations become **Community learning notes**, visible in Community. Incorporating one into the shipped five-day game requires a deliberate source-code change and review; publication does not silently rewrite the game or claim that it has.
- The submitter receives a one-time removal code and contribution ID, with a downloadable receipt. `POST /api/community/remove` verifies the receipt, then removes both the stored original and any public adaptation from this server. The code itself is never stored, only its SHA-256 hash. Keep the receipt private: no email is collected to recover it. Removal cannot erase copies someone downloaded elsewhere or independently managed backups.

Storage is `technica/data/contributions.json`, excluded from Git. Writes are serialized and use a temporary file plus atomic rename; successful submission is returned only after disk persistence. Corrupt storage produces a failure instead of overwriting records. The local prototype supports **one Node process on a persistent filesystem**, not multiple workers or ephemeral/serverless hosting. Back up this directory privately if operating a real pilot, and apply receipt-based removal to retained backups. The queue is capped at 1,000 records. Suggestions remain stored until receipt-based removal; declining does not delete them.

To enable review, copy `.env.example` to `.env` **only if `.env` does not already exist**, then enter a random `REVIEWER_KEY` of at least 24 characters. For example, generate a new value locally with `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"` and enter it directly in `.env`. Do not commit or share it. Reviewer access fails closed while the key is absent or too short. This shared-secret review model is appropriate for a local hackathon prototype; public hosting needs individual reviewer authentication, HTTPS, and an operational moderation process.

The empty public state explicitly says there are no published contributions. Team-written topic prompts are labeled as prompts. There are no invented contributors or testimonials, and no claim of representing a community.

## Optional Gemini assistance

Set `GEMINI_API_KEY` and an enabled `GEMINI_MODEL` in `.env` to use **Explain more simply** in a lesson. There is no assumed default model. Missing configuration, provider failures, incomplete output, oversized output, new numeric values, and generated source URLs return the authored explanation. Configuration reloads on API requests; externally supplied environment variables take priority.

The server calls Gemini’s documented [generateContent endpoint](https://ai.google.dev/api/generate-content) with a system instruction and authored lesson context. It may include a restored, recomputed fictional consequence and budget; it never sends community suggestions, private financial details, or free-form user prompts. Output is labeled as optional AI and may still contain mistakes. It never controls balances, allowed actions, reflection answers, badges, or saved progress. The authored lesson and its sources remain the reference.

No authenticated Gemini call was made during this rebuild. Provider behavior is verified with mocked success/failure responses, not claimed as live integration proof. The main journey has no provider dependency.

Capital One Nessie was removed because account loading and transaction browsing added setup without helping this fictional decision story. Its adapter, routes, configuration, and main experience are gone. ETF and tokenization labs, investigations, and the separate Safety Vault are removed; useful safety guidance now lives in Learn. ElevenLabs and Backboard remain absent. Obsolete award descriptions have been removed.

## Architecture and boundaries

```text
server.js                 Local HTTP server, same-origin checks, rate/body limits, reviewer auth
lib/community.js          Validated private storage, moderation transitions, removal receipts
lib/guide.js              Optional bounded Gemini rephrasing with authored fallback
lib/config.js             Server-only .env parsing and refresh
public/content.js         English lesson/story/goal/reflection catalogue and sources
public/game.js            Shared deterministic state transitions, restoration, cents arithmetic
public/play.js            Harbor map, hands-on activities, stamp meter, and skill passport
public/app.js             Play/Learn/Community UI, routing, browser progress, draft memory
public/review.html/js      Protected reviewer workflow UI (API access requires the key)
public/styles.css         Responsive cream/green interface and reduced motion
test/*.test.js            Branch arithmetic, API/storage/auth, and DOM journeys
```

Progress and badges belong to this browser and site origin. They are editable prototype data, not secure credentials or verified achievements. Clearing site storage removes them. Old prototype progress is left untouched under its previous keys; it is not converted into badges for new skills. No new disk-based learner profiles or cookies are created. Storage failures are visible and in-memory play still works.

Static files are confined to the public directory, including realpath checks. API requests have a 16 KB body limit, same-origin checks, and an in-memory limit of 100 requests per IP per minute. Reviewer responses and API data are not cached; CSP restricts scripts and network requests to this server. These local prototype controls do not replace production operations.

## Verification and participation plan

Run `npm.cmd test` from the root. Checks cover every affordable game branch for both goals, integer-cent conservation, unaffordable paths, reasoning badges, retry/restoration, lesson links, missing-provider behavior, private contribution persistence across server instances, concurrent submissions, storage failure, moderation authorization, consent/stage enforcement, publication/unpublication, removal, request limits, DOM completion, navigation/focus, input labels, draft preservation, and safe rendering of submitted text.

No connected browser was available during this rebuild. jsdom does not render CSS; desktop/mobile appearance, real keyboard operation, screen-reader behavior, and motion quality still require manual verification. No volunteer usability sessions or demographic effectiveness claims are reported. The [usability script](USABILITY.md) defines the outstanding human checks.

Invite voluntary feedback through local community organizations, disability/accessibility groups, adult learning programs, students, and people with different payment and income arrangements. Ask about access needs and preferred participation format without requiring demographic disclosure. Offer a short session, an asynchronous text version, or an assisted walkthrough. Explain what will be recorded, request consent, allow skipping any task, and offer attribution only with permission. Avoid recruiting through claims that a group is represented here.

Record observed task completion, confusion, inaccessible controls, unfamiliar language, and suggested situations without personal financial details. Review suggestions, prioritize recurring barriers with participants, edit and source-check proposed scenarios, then seek publication permission. Return a plain-language change summary to volunteers who opt in through an independently managed contact process. Keep research notes outside this public repository; publish only consented, anonymous findings. Do not call this plan completed research.

## Recovery and handoff

Before rebuilding, the clean baseline was preserved at commit `84315f4` and tag `archive/harbor-before-adventure-2026-10-17`. The archive retains the earlier implementation and documentation. Current runtime has no external dependencies. This delivery updates the GitHub source repository; it does not create a public hosting deployment.
