# Harbor Academy

**Practice everyday money choices. Learn as you play.**

A welcoming financial learning game with three destinations: **Play**, **Learn**, and **Community**. No account, real money, or API key is needed to play.

From this folder, run:

```powershell
npm.cmd start
```

Open **http://localhost:3000** and keep the terminal running. Requires Node.js 18+. Runtime has no package dependencies. In VS Code, **Start Harbor Academy server** starts the app; **Launch Chrome against localhost** opens the browser after the server is running.

For development checks:

```powershell
npm.cmd --prefix technica ci
npm.cmd test
```

See [the application guide](technica/README.md) for the game, contribution review, optional Gemini configuration, architecture, and verification limits. See the [volunteer usability script](technica/USABILITY.md) for the planned human checks.

The previous experience is recoverable at commit `84315f4` and tag `archive/harbor-before-adventure-2026-10-17`. Use `git show archive/harbor-before-adventure-2026-10-17:technica/README.md` to inspect its documentation without replacing your checkout.
