# Harbor Academy · Harborbound

Small games for everyday money choices. **Home** gives a simple introduction and a Start/Continue button. **Play** recommends one activity at a time: make change, build a lantern, then choose a delivery route. The harbor RPG, character options, and extra quests remain available under **Want to explore more?**

**Home · Play · Learn**

```powershell
npm.cmd start
```

Open **http://localhost:3000**. Node.js 18+ is required; runtime has no package dependencies. Keep the terminal running. In VS Code, **Start Harbor Academy server** starts the app; **Launch Chrome against localhost** opens the browser after it starts.

Arrow keys or WASD move your character; **E** starts a nearby conversation. Touch direction buttons, destination buttons, and a travel menu offer alternative controls.

Use **Start playing** on Home. No character form is required. Progress and the Journal are available through the header’s **Progress** menu. Festival challenges use separate practice funds and have no countdowns. Returning Home keeps your saved game intact.

For checks: `npm.cmd --prefix technica ci`, then `npm.cmd test`.

See the [implementation and setup guide](technica/README.md) and [volunteer usability script](technica/USABILITY.md). No account, API key, or real money is needed to play.

Recovery tags preserve the earlier versions: `archive/harbor-before-rpg-2026-10-17` and `archive/harbor-before-adventure-2026-10-17`.
