# Harborbound · An everyday money RPG

Harbor Academy now centers on an explorable RPG called **Harborbound**. Create a traveler, walk through Tidehaven, speak to its characters, complete money-decision quests, and collect learning equipment. The three destinations are **Play**, **Learn**, and **Quest Journal**. Community submission and reviewer interfaces have been retired.

## Lanternwake: a playable opening

The primary opening now invites the player to bring three festival lanterns back to life. **Start the festival** begins immediately with a default traveler; character customization remains optional. The festival is available alongside the existing story without requiring its five conversations first. Its objectives appear above the collapsed story tracker.

Three different activities drive progress:

1. **Lantern workshop:** choose a lens, frame, and delivery plan within a separate fictional $20 fund. The reclaimed lens includes both an $8 price and a $3 repair. Parts and delivery choices produce eight combinations, five of which fit the fund. The visible receipt includes every charge. Completing a workable plan lights the cottage lantern.
2. **Festival ticket counter:** sell three $4 tickets to a fictional visitor who paid $20. Build the $8 change using $5, $2, and $1 notes. Undo and clear controls allow trying different combinations. Incorrect change explains the arithmetic and allows a retry. Completion lights the market.
3. **Lantern delivery:** move a crate through a small grid with blocked stairs. The short route takes six steps and uses a $2 bridge pass; a free detour takes eight steps. Both are valid. The separate delivery fund is $2, and its pass is charged once per attempt. Direction buttons and arrow keys move the crate without moving the overworld character. Completion lights the pier.

The harbor’s lanterns, light glows, and colored bunting change as challenges are completed. The world heading and objective list react to completion, and the Journal records the restored lights. Story choices also leave a short visible record under the world. No challenge changes the main quest wallet or uses a countdown.

Five hidden postcards provide authored learning reminders. Pick them up by stepping onto their tile or using their named map button. Each grants 5 XP once; finding three unlocks a cosmetic fox companion. A gull is available from the start, and players can travel alone. Companions follow the character without changing money rules or quest access.

Each unique festival challenge grants 30 XP once. Restoring all three discovers the **Lanternwake pin**, bringing the equipment catalogue to nine items. Current challenge inputs are stored separately from first successful solutions. Replay can try another build, note combination, or route while retaining the original completion reward; it cannot produce repeated XP. Restore validates the saved costs and route evidence rather than trusting a completed flag. Corrupt festival data resets independently of valid story and character data.

## Run

Requires Node.js 18+. From the repository root, run `npm.cmd start`, then open **http://localhost:3000**. There are no runtime package dependencies or required credentials. The server binds to `127.0.0.1`; `PORT` defaults to 3000. Restart after server changes.

For development: `npm.cmd --prefix technica ci`, then `npm.cmd test`. `npm.cmd --prefix technica run format` formats source. jsdom and Prettier are the only development dependencies.

## Explore Tidehaven

Choose a nickname and one of three roles: **Wayfinder**, **Keeper**, or **Tinkerer**. Roles change the character’s appearance and framing; every role has access to all quests. No real name or account is needed.

The 16-by-11 tile world includes paths, a grove, cottages, a market, a garden, and a harbor pier. Trees, buildings, water, and characters block movement. Shortest-path search finds a clear adjacent tile when using destination controls.

- Focus the world and use **arrow keys or WASD** to walk one tile at a time. **E** speaks to a neighboring character.
- Use the visible direction buttons on touch or with a keyboard.
- Click a walkable tile to move there, or a character to travel beside them and open a conversation. Destination travel is immediate rather than a timed walking sequence.
- The **Travel to a character** menu provides named destinations and an alternative to precise map selection. Future quest givers can be visited; they explain the current prerequisite instead of letting the main story be skipped.

Walking updates the existing player sprite so movement can interpolate without rebuilding the map. Movement controls are active only while focus is in the world or direction controls, and do not intercept typing in a form. Reduced-motion styles stop interpolation and ambient animation.

## Main quest chain

Choose a useful bag ($48) or raincoat ($42). Start with a simulated $140: $60 protected for food, shared household costs, and caregiving, and $80 for the main quest decisions.

| Quest giver | Decision | Equipment discovery |
| --- | --- | --- |
| Mara, lighthouse keeper | Pause or keep a $12 subscription | Planner’s compass |
| Jo, ferry guide | Pay for an accessible trip or rearrange a visit | Flexible-route boots |
| Inez, ticket merchant | Compare a $12 counter pass with a $15 online pass including its fee | Full-price lens |
| Wren, postmaster | Independently verify a suspicious gift-card demand or see its fictional consequence | Verification lantern |
| Tavi, repair merchant | Buy a durable item, buy secondhand with a repair, or wait | Repairer’s kit |

Choices immediately affect the fictional wallet and which later purchases are affordable. Consequences explain access, time, enjoyment, quality, and cost without treating the least expensive choice as universally correct. Reflections ask players to explain the actual trade-off. Reconsidering a decision is allowed. A delayed purchase is a valid ending.

Three optional activities remain inside the relevant conversations: move $10 notes between practice envelopes, build the full-price receipt, and inspect suspicious-message clues. The envelope board is separate from the established story budget and says so explicitly.

The **Quest Journal** replaces Community. It contains festival progress and the postcard album, the current story objective, completed decisions and their consequences, side quests, all nine equipment items, people met, and the existing skill-stamp passport. Replaying a completed chapter clears later current-story choices and activities; collected learning achievements remain.

## Optional side quests

- **Pip’s scattered ledger:** collect three receipts ($7, $5, $3) to reconstruct a $15 spending record and discover the Receipt pouch.
- **Fern’s garden delivery:** choose drinking water and a step-free delivery route within $18 of separate fictional garden funds. A refill plus delivery costs $10 and takes extra time; sealed water plus delivery costs $15. Both work. Choosing both water options plus delivery exceeds the budget. Completing a workable kit discovers the Garden crest.
- **Sol, harbor cartographer:** explains exploration, the journal, and how equipment opens field notes.

Side activities never debit the main wallet. Current side-quest selections and lifetime achievements are stored separately, so trying a different kit does not erase an earned reward or incorrectly change the underlying success rules.

## Experience, levels, and equipment

All progression is deterministic and local to this browser:

- First conversation with each of eight characters: **5 XP once**.
- Each unique main chapter completed: **20 XP once**.
- Each demonstrated reasoning skill: **25 XP once**.
- Each of three hands-on activity stamps: **30 XP once**.
- Each of two optional side quests: **40 XP once**.
- Each of three festival challenges: **30 XP once**; each hidden postcard: **5 XP once**.

Levels begin at 1 and advance every 100 XP, up to level 6. XP is derived from unique discoveries, not an incrementable cash-like counter. Repeated conversation, replay, alternate choices within the same chapter, or toggling an activity cannot generate repeated rewards. There is no leaderboard, combat, health tied to wealth, mandatory countdown, streak, or penalty for leaving.

Equipment is a learning reminder. Equip an unlocked tool in the Journal, then use its field note from the quest tracker or inventory. The tools do not alter balances, bypass verification, or provide real-world financial powers. A notebook is available from the start. The original eight reasoning/activity stamps remain a separate view of practiced skills.

## Learn and inclusion

Six short lessons cover spending plans, fees, suspicious requests, irregular income, borrowing, and unexpected costs. Each has an explanation, fictional example, optional detail, practice feedback, source link, and a return link. Leaving a conversation for Learn preserves the decision, practice inputs, character position, and conversation; these also restore after refresh.

The story includes cash, shared costs, caregiving, changing income, time, and accessibility without requiring a bank account, card, car, predictable salary, or family support. No fixed savings percentage is prescribed. A shortage of resources is not described as a personal failure.

The cream/forest-green interface uses system sans-serif controls, visible focus, labeled inputs and buttons, text descriptions of positions and funds, live feedback, a skip link, touch direction controls, named destinations, responsive layouts, and reduced-motion support. Small decorative map labels have a named destination-menu alternative. English lesson and world catalogues live in `content.js` and `world.js`; interface strings also require extraction and human review for a full translation. No unreviewed language selector is offered.

Supporting primary sources checked during the preceding rebuild on October 17, 2026 remain linked in the lessons:

- [CFPB Your Money, Your Goals toolkit](https://www.consumerfinance.gov/consumer-tools/educator-tool/your-money-your-goals/toolkit/): planning, timing, fees, and borrowing comparisons.
- [CFPB emergency fund guide](https://www.consumerfinance.gov/an-essential-guide-to-building-an-emergency-fund/): variable circumstances and unexpected expenses.
- [FTC gift-card impersonation warning](https://consumer.ftc.gov/consumer-alerts/2026/01/no-thats-not-your-boss-asking-you-buy-gift-cards): urgency, gift-card demands, and independent verification.

Quests, amounts, characters, and place names are fictional authored content. They do not claim community participation or represent testimonials.

## Optional Gemini field notes

Only **Explain more simply** in Learn uses Gemini. Copy `.env.example` to `.env` only if `.env` does not already exist. Configure both `GEMINI_API_KEY` and an enabled `GEMINI_MODEL` to enable it. No default model is assumed; missing configuration returns authored guidance. Configuration refreshes on API requests; externally supplied environment variables take priority.

The server uses the documented [generateContent endpoint](https://ai.google.dev/api/generate-content), with authored lesson context and, when relevant, a restored fictional consequence and recomputed amount. Character names, role, movement, inventory, side quests, private financial information, and free-form user text are not sent. Incomplete, oversized, failed, new-number, or generated-source-URL responses fall back to authored material. AI output is labeled, may make mistakes, and never controls arithmetic, XP, levels, equipment, quest transitions, or answers. No authenticated provider call was made during this rebuild; success/failure behavior is tested with mocks.

Capital One, ETF/tokenization labs, investigations, ElevenLabs, and Backboard remain absent.

## Retired Community data

The contribution form, public listing, moderation APIs, reviewer pages, and reviewer-key configuration are removed. `GET/POST /api/community` and reviewer routes return 404. Old `#community` links open the Journal. No existing private records are loaded by normal play, published, or deleted as part of the upgrade.

The footer’s **Past contribution removal** link (`/remove.html`) retains a minimal receipt-based removal flow at `POST /api/community/remove`. It checks the original contribution ID and hashed removal code, serializes writes, and atomically updates the ignored `data/contributions.json` file. It cannot create, list, review, or publish anything. Private files and any independently managed backups remain the operator’s responsibility; a removal should also be applied to those backups. The current app requires no reviewer secret.

## Architecture

```text
server.js                 Local static HTTP server, bounded API requests, same-origin checks
lib/config.js             Server-only optional configuration
lib/guide.js              Bounded optional Gemini explanation with authored fallback
lib/legacy-removal.js      Receipt-only removal of old private contributions
public/content.js         Money story, lessons, reflections, practice activities, sources
public/game.js            Integer-cent money rules, activities, story restore and rewind
public/world.js           Terrain, characters, roles, side quests, and equipment catalogue
public/rpg.js             Collision/pathfinding, character restore, side quests, unique XP
public/rpg-view.js        Overworld, conversations, quest tracker, inventory, Journal
public/festival.js        Lantern builds, cash drawer, delivery routes, postcards, validation
public/festival-view.js   Festival challenges, changing world, companions, postcard album
public/learn-view.js      Beginner lessons and return links
public/play.js            Shared practice-activity and skill-passport views
public/app.js             Routing, input, local persistence, movement updates, UI coordination
public/*.css              Cream/green interface, tile world, festival, responsive controls
test/*.test.js            Deterministic, HTTP, legacy-removal, provider, and DOM checks
```

Runtime has no external packages, downloaded game engine, external font, remote graphics, or audio requirement. The tile world and sprites are drawn in HTML, CSS, and inline SVG. The previous standalone illustration remains in Git history; the active RPG uses its own world graphics.

The existing `harbor-adventure-v1` browser save is migrated in place. Earlier stories and stamps remain valid; a missing character save creates a traveler. Invalid character data resets the character independently of valid story progress. Progress is browser-local, editable prototype data, with no account synchronization or secure achievements. Clearing site storage removes it. Blocked storage shows a message and allows in-memory play.

API bodies are capped at 16 KB and requests at 100 per IP per minute. Static paths are confined to the public directory with realpath checks, and CSP confines scripts and connections to this server. Legacy disk removal assumes one Node process on persistent local storage. Public hosting is not configured by this delivery.

## Validation and handoff

Automated tests cover all affordable main-story branches, integer-cent conservation, reflections, restoration/rewind, activity outcomes, world dimensions, collisions, reachable destinations, side-quest totals, unique rewards, locked equipment, character restore, retired endpoints, legacy receipt removal, request limits, provider failures, character creation, keyboard/touch events, full NPC quest completion, Learn return, Journal replay, and stored-progress compatibility. Festival checks cover all eight workshop combinations, several valid exact-change combinations, both delivery routes, bridge-pass reuse, collision, invalid solution rejection, reachable postcards, fox unlock, all three world-light transitions, unchanged story funds, modal cancellation, reward uniqueness, and restoration after refresh.

No connected browser was available. jsdom cannot verify rendered art, phone overflow, real keyboard timing, screen-reader interaction, or animation quality. These are outstanding manual checks, not claimed completed. No volunteer research or demographic effectiveness is fabricated. See [the usability script](USABILITY.md).

The pre-festival RPG is preserved at `archive/harbor-before-lanternwake-2026-10-17` (commit `995a7b7`). The pre-RPG experience remains at `archive/harbor-before-rpg-2026-10-17` (commit `ea69b92`), with the original baseline at `archive/harbor-before-adventure-2026-10-17`. This change is delivered through the existing GitHub repository, without a separate hosting deployment.
