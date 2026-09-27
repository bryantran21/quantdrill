# QuantDrill

Unlimited, randomized practice for the aptitude assessments prop-trading firms use to screen
interns — probability, number sequences, likelihood ranking, interval estimation, orderbook
arbitrage, and timed reflex games. Every drill generates fresh questions, times you, and scores you.

## ▶ Play it live — **[quant.bhtran.com](https://quant.bhtran.com/)**

No install, no login, no backend. Everything runs in your browser, and nothing leaves your machine.

## Prep by firm

The app opens on a firm directory: pick the firm you're interviewing with and jump straight into
the drills its assessments lean on. Covers **Optiver, Jane Street, Citadel, Two Sigma, Hudson River
Trading, Jump, D. E. Shaw, SIG, IMC, Akuna, and Virtu**.

- **Optiver** is marked *matches OA* — the drills mirror its online assessment section for section.
- The other firms show **focus areas** drawn from publicly shared candidate reports, plus rounds
  this app doesn't cover (usually coding), so you know what else to prepare.

Firm mappings are unofficial and change over time. Firm logos are trademarks of their respective owners, shown only to identify each firm.

## Drills

| Drill | What it trains |
| --- | --- |
| **Sequences** (NumberLogic) | Find the next term: arithmetic, geometric, quadratic, fibonacci, woven (interleaved), fraction sequences, product, geometric-gap, alternating-operation. Fractions compare in lowest terms. |
| **Beat the Odds** | Timed multiple choice across 12 topics: expected value, complement (at-least-one), binomial, Bayes (the "imagine 1000 people" method), conditional without replacement, linearity of expectation, geometric waiting time, gambler's ruin, coupon collector, cards, order statistics (max/min of two dice), and streak waiting times. A worked solution follows every answer, and a pop-open **formula cheat sheet** collects the ~11 core tools. |
| **Likelihood-list** | Rank a set of outcomes from most to least likely — dice totals, coloured-ball draws, coin-flip counts, and **bar-chart reads** (spinner slices, raffle tickets). Weights are exact, so the correct order is unambiguous; **Skip** to pass. |
| **Intervals** | Estimate a value and bracket it with a lower/upper bound. You score only if the answer lands inside, and tighter intervals score more — a wild always-right guess earns almost nothing. |
| **Orderbooks** | A board of commodity cards, each with a buy and sell price; bundles show their contents as repeated emojis (🧂🧂🟠). Trade cards in any quantity so every underlying asset nets flat and you pocket cash — or skip a no-arb board. |
| **Zap** | Two boxes, each with an equation and two arrow rows. Answer the highlighted one: the **top** box asks *is the result odd?*, the **bottom** box asks *do the arrows match?* The active box switches each round. ← Yes / → No. |
| **Arithmetic** | Zetamac-style mental math with configurable per-operation ranges and auto-submitting answers. |

Every drill runs as a **timed session**: pick your options and duration, hit start, race the
countdown, then get a scorecard with your score, accuracy, and personal best. A **Stats** tab tracks
accuracy by drill and question type across sessions (stored locally in your browser).

**Keyboard:** `1`–`9` switch tabs · `Enter` submits · `←` / `→` answer in Zap.

## Built with

- Vite + React + TypeScript, Tailwind CSS v4
- Light and dark themes — persists your choice and respects your system setting
- Pure, unit-tested question generators (Vitest): every answer is checked against a known-correct
  computation, so the maths can't drift
- No backend, no analytics, no tracking

## Disclaimer

A personal study tool. Not affiliated with, endorsed by, or representative of any trading firm or
its assessment process.

## License

[MIT](LICENSE)
