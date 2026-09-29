# MAXos Daily Options Opportunity Scan

Use this protocol when the task is to find the best options opportunity for Max today. This file stores process only. Never store live balances, holdings, account identifiers, trade history, tax lots, credentials, or private Notion content here.

## Objective

Search both Max's current holdings and the broader liquid U.S. stock/ETF options market. Always produce a ranked **Play of the Day candidate**, plus a backup, a watch setup, and rejected leaders.

A candidate is not automatically executable. It must pass the live-chain, liquidity, evidence, portfolio-fit, and max-loss gates before being called an executable play.

The goal is to search broadly enough to find the best available opportunity without lowering the quality bar merely to force a trade.

## Core sequence

`Live portfolio -> Market regime -> Sector map -> Two-universe scan -> Catalyst/evidence screen -> Candidate triage -> Deep research -> Live options chain -> Risk structure -> Option math -> Portfolio fit -> Daily decision card -> Post-trade learning`

## 1. Live portfolio state

When portfolio fit matters, pull current holdings, cash, open option risk, and relevant transactions from the authorized connected financial source.

Do not use GitHub, cached chat context, or dated Notion snapshots as live portfolio state.

Portfolio ownership is one input, not the search universe. A stock Max does not own may be the best options candidate.

## 2. Market regime first

Before scanning individual tickers, classify the tape using the strongest current sources available.

Check, where relevant:
- SPY / S&P 500 direction and breadth
- QQQ / Nasdaq direction
- IWM / small-cap risk appetite
- VIX / volatility regime
- Treasury yields and major rate moves
- dollar, oil, gold, and other macro prices when relevant
- scheduled macro releases and central-bank events
- major overnight and same-day news
- market breadth, volume, gaps, and leadership

Classify the regime as broadly:
- **risk-on**
- **risk-off**
- **mixed / rotational**
- **event-dominated**

The regime should influence whether the scan favors bullish, bearish, event-driven, or sector-relative setups.

## 3. Sector map

Rank major sectors and active themes by current relative strength/weakness, participation, catalysts, news flow, earnings revisions when available, macro sensitivity, and policy exposure.

Important groups include, when relevant:
- semiconductors / AI
- software / cloud
- financials
- energy
- industrials / defense / aerospace
- healthcare / biotech
- consumer discretionary / staples
- communications
- utilities
- materials
- real estate
- crypto-linked equities
- nuclear / uranium
- quantum
- infrastructure / grid / power

Do not assume Max's favorite themes are today's best themes.

## 4. Two-universe candidate search

Run both lanes every scan.

### A. Owned lane
Current Robinhood holdings that:
- have listed options;
- have sufficient liquidity;
- have a live catalyst, trend, dislocation, or event worth trading.

Ownership does not automatically improve rank.

### B. Open-market lane
Liquid U.S. stocks, ETFs, and indexes Max does not currently own.

Prefer names with:
- active options chains;
- tight enough bid/ask spreads;
- meaningful volume/open interest where available;
- a real catalyst or defensible technical/macro setup;
- a structure capable of fitting the current max-loss rule.

## 5. Candidate discovery signals

Use the smallest relevant evidence stack. Signals may include:
- earnings, guidance, investor days, product launches, regulatory decisions, FDA events, M&A, litigation, restructurings, financing, or other dated company catalysts;
- SEC 8-K, 10-Q, 10-K, Form 4, and other material filings;
- insider purchases/sales where relevant;
- federal awards and spending through official government sources / USAspending when economically material;
- congressional financial disclosures as a secondary signal;
- policy, legislation, agency actions, tariffs, rates, commodities, and macro releases;
- credible breaking news and company investor-relations releases;
- unusual volume, gaps, breakouts/breakdowns, support/resistance, trend, momentum, volatility, and relative strength;
- sector rotation and cross-asset read-throughs.

### Congressional-trading rule

When congressional transactions matter, use official House Clerk and Senate financial-disclosure records as the primary evidence whenever practical.

Treat congressional Periodic Transaction Reports as **lagged disclosure data**, not live order flow. A disclosed trade can be reported after the actual transaction date.

Use congressional activity to:
- surface themes;
- strengthen or contradict an existing thesis;
- identify names worth deeper research.

Never use it as the sole reason for a same-day options trade.

Distinguish:
- Member versus spouse/dependent owner;
- purchase versus sale;
- stock versus option or other security;
- transaction date versus disclosure date;
- disclosed dollar range rather than pretending an exact amount is known.

## 6. Candidate triage

Reduce the broad scan to roughly 3-5 finalists before spending time on individual option chains.

Evaluate each finalist on:
1. **Market / sector alignment** — does the proposed direction fit the tape?
2. **Catalyst / why now** — is there a concrete reason for movement during the intended trade horizon?
3. **Price / technical location** — is the entry defensible rather than chasing an exhausted move?
4. **Evidence quality** — primary filings, company releases, official government data, credible current reporting, insider/congressional context when relevant.
5. **Options suitability** — usable chain, acceptable spread, sufficient time, reasonable volatility, and a structure that can fit the risk ceiling.
6. **Portfolio fit** — does it create redundant exposure or improve opportunity versus what Max already owns?

Congressional activity, insider activity, and unusual options activity are supporting signals, not mandatory scoring categories and not substitutes for a real thesis.

## 7. Deep research on finalists

Use only the tools that can materially change the decision.

### OpenBB / current market providers
Use for:
- market regime;
- current/historical prices;
- earnings calendar;
- volatility context;
- live options chains where supported;
- cross-provider market research.

### EdgarTools / SEC
Use for:
- 8-K / 10-Q / 10-K review;
- Form 4 insider activity;
- dilution, financing, debt, acquisitions, and material corporate changes;
- primary-source confirmation of headlines.

### USAspending / official government sources
Use when a federal contract, award, program, or spending trend is economically material to the thesis.

### Current news + company IR
Use to confirm catalyst timing, management statements, breaking developments, and market interpretation.

### House / Senate financial disclosures
Use to validate congressional trading evidence when it matters.

### PyPortfolioOpt
Use only when correlation, concentration, or portfolio construction could materially change which candidate should be chosen.

Do not run every engine mechanically.

## 8. Robinhood-compatible option construction

The scanner may choose **bullish or bearish** exposure based on evidence. Max does not need to own the underlying.

### Risk rule
- Maximum loss per trade must remain **at or below $20** under the current Opportunity Playbook.
- Aggregate open-options risk must remain within the current portfolio-sleeve rule.

### Contract mechanics
For a standard U.S. equity option, the displayed premium is normally quoted per share and a contract usually represents 100 shares. A quoted premium of **$0.20** therefore generally means about **$20** of premium for one long contract before applicable fees.

Do not describe this as a fractional option contract. The account buys one whole contract when its total premium fits the budget.

### Permission-aware structures
Do not assume Max has advanced multi-leg options approval.

If permissions are unknown:
- use a **single-leg long call or long put** as the implementation baseline when the premium and liquidity fit the $20 max-loss rule.

If appropriate spread approval is confirmed:
- consider **defined-risk debit spreads** when they materially improve strike quality, probability, time-to-thesis, or affordability while keeping maximum loss at or below $20.

Never use naked short options.

### Expiration selection
Expiration follows the thesis.
- 30-45 DTE is a useful starting window for repeatable setups.
- shorter expirations are acceptable for genuinely near-term catalysts when time decay and gap risk are understood;
- do not use 0DTE merely to manufacture a cheap contract.

Reject options whose apparent affordability comes mainly from:
- being extremely far out of the money;
- unusably wide bid/ask spreads;
- negligible liquidity;
- insufficient time for the thesis;
- volatility so expensive that the expected move does not justify the premium.

## 9. Live-chain gate

Before calling a setup executable, verify:
- current underlying price and timestamp;
- exact expiration;
- exact strike(s);
- bid / ask;
- realistic limit-price assumption;
- volume and open interest when available;
- IV / volatility context;
- earnings and major event dates;
- exact maximum loss;
- assignment/exercise/expiration mechanics relevant to the structure.

If the live chain cannot be verified, label the idea **conditional / research-only**.

## 10. OptionLab pre-flight

After live chain validation, use OptionLab-style analysis when available for:
- payoff profile;
- breakeven;
- max gain / max loss;
- Greeks;
- probability-style metrics;
- expected outcome under stated assumptions;
- exit scenarios.

Never invent premiums, Greeks, fills, probabilities, or liquidity.

## 11. Daily output

Every completed scan should return:

### 🥇 Play of the Day
- ticker / underlying;
- bullish or bearish;
- why now;
- market/sector context;
- strongest evidence;
- exact verified option terms if executable;
- entry assumption;
- max loss;
- breakeven / payoff where relevant;
- invalidation;
- exit plan;
- confidence;
- execution status: **Executable** or **Conditional**.

### 🥈 Backup Play
The next-best differentiated setup, not merely a copy of the same sector exposure.

### 👀 Watch Setup
A candidate waiting for a price, catalyst, chain, liquidity, or volatility trigger.

### 🚫 Rejected leaders
List 2-4 tempting candidates rejected for concrete reasons such as:
- poor liquidity;
- excessive IV;
- no real catalyst;
- bad technical location;
- weak primary evidence;
- redundant portfolio exposure;
- contract cannot fit the $20 ceiling without becoming lottery-like.

### Market + sector view
State the regime and sector leadership that drove the scan.

## 12. Post-trade learning

After outcomes are available:
- pull actual investment transactions where authorized;
- compare thesis, planned risk, and actual result;
- grade process separately from outcome;
- use QuantStats after enough observations exist;
- use vectorbt when a recurring pattern becomes a testable rule;
- tighten or retire patterns that repeatedly fail.

## Principle

**Market first. Sector second. Stock third. Option last.**

The option is the expression of the thesis, not the thesis itself.