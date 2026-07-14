# QuantDrill

Unlimited randomized practice for the aptitude assessments prop trading firms use in intern
screening — sequences, fast probability, orderbook arbitrage, and reflex games, all timed and
scored. Runs entirely in the browser; nothing leaves your machine.

> **Live:** https://&lt;your-github-username&gt;.github.io/quantdrill/

![screenshot placeholder](docs/screenshot.png)

## Drills

| Drill | What it trains |
| --- | --- |
| **Sequences** (NumberLogic) | Find the next term: arithmetic, geometric, quadratic, fibonacci, woven (interleaved), fraction sequences, product, geometric-gap, alternating-operation. Fractions compare in lowest terms. |
| **Beat the Odds** | Multiple choice: expected value, complements, binomial, Bayes (the "imagine 1000 people" method), conditional without replacement, linearity of expectation, geometric distribution. Worked solution after each answer. |
| **Likelihood-list** | Rank a set of outcomes from most to least likely (dice totals, coloured-ball draws, coin-flip counts). Weights are exact, so the correct order is unambiguous. |
| **Intervals** | Estimate a value and bracket it with a lower/upper bound. You score only if the answer lands inside, and tighter intervals score more (up to 10) — a wild always-right guess earns almost nothing. |
| **Orderbooks** | A board of commodity cards, each with a buy and sell price; bundles show their contents as repeated emojis (🧂🧂🟠). Trade cards in any quantity so every underlying asset nets flat and you pocket cash — or skip a no-arb board. The best combination is brute-forced, so grading is exact. Scenarios: components+bundle, crossed items, multiple bundles. |
| **Zap** | Two boxes, each with an equation and two arrow rows. Answer the highlighted one: the **top** box asks *is the result odd?*, the **bottom** box asks *do the arrows match?* The active box switches each round. Answer ← Yes / → No. |
| **Arithmetic** | Zetamac-style mental math with configurable per-operation ranges and auto-submitting answers. |

Every drill runs as a **timed session**: a landing page to pick options and duration, a countdown
run where you answer as many as you can, then a scorecard (score, accuracy, personal best). A
**Stats** tab tracks accuracy by drill and question type, and best/last per timed drill
(localStorage only).

## Run it

```sh
npm install
npm run dev      # dev server
npm test         # generator unit tests (vitest)
npm run build    # static bundle in dist/, served from /quantdrill/
npm run preview  # serve the production build locally
```

## Deploying to GitHub Pages

Pushes to `main` run [.github/workflows/deploy.yml](.github/workflows/deploy.yml): install, test,
build, and deploy to GitHub Pages. One-time setup on the repo: **Settings → Pages → Source →
"GitHub Actions"**. The Vite `base` is set to `/quantdrill/` in
[vite.config.ts](vite.config.ts) — if you fork under a different repo name, change it to match.

## Tech

- [Vite](https://vite.dev) + [React](https://react.dev) + TypeScript (strict)
- [Tailwind CSS v4](https://tailwindcss.com) over a small set of CSS design tokens
  (dark/light themes are a variable swap; choice persists and honors `prefers-color-scheme`)
- [Vitest](https://vitest.dev) — every question generator is a pure function with unit tests
  asserting known-correct answers (binomial, complement, Bayes, arbitrage direction, …)
- No backend, no analytics, no UI kit

Question generators live beside their components in `src/drills/<Drill>/generator.ts`, so they
are testable and reusable independent of React. Shared helpers (`rint`, `pick`, `shuffle`,
`gcd`, `comb`, fraction utils) are in `src/lib/`. The original single-file prototype this was
ported from is kept in [prototype/quantdrill.html](prototype/quantdrill.html).

### Keyboard

`1`–`6` switch drills · `Enter` submits sequences · `←`/`→` answer in Zap

## Roadmap

- [ ] Mock-test mode: all sections back-to-back with per-section timers and a final scorecard
- [x] Likelihood-list and Intervals sections (NumberLogic = the Sequences drill)
- [x] Orderbooks card redesign: commodity cards, bundles with quantities, brute-forced arbitrage engine
- [x] Timed-session model for every drill (landing → countdown → scorecard)
- [x] Harder sequence types (product, geometric-gap, alternating-operation)
- [x] Per-session stats/history (localStorage) by drill and question type
- [x] Zetamac-style arithmetic drill with configurable ranges

## Disclaimer

A personal study tool. Not affiliated with, endorsed by, or representative of any trading firm
or its assessment process.

## License

[MIT](LICENSE)
