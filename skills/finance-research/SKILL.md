# MAXos Finance Research Skill

Use this protocol for portfolio, stock, catalyst, dividend, and options research for Max. This file exists to guide AI research sessions. It is not a trading bot and must never contain brokerage credentials, account IDs, live balances, holdings, private trade history, or secret values.

## Mission

Produce evidence-backed investment decisions by combining Max's current portfolio state with current market data, primary-source company information, government policy/spending and congressional-trading context, options math, portfolio-risk analysis, and post-trade performance learning.

The goal is not to run every tool on every question. Use the smallest set that can answer the decision correctly, then escalate to specialist tools when the decision type requires them.

## Source-of-truth order

1. **Finances / connected brokerage data** — current holdings, account cash, investment transactions, dividends, and portfolio weights.
2. **Primary company and regulatory sources** — SEC filings, company investor relations, earnings releases, official government data.
3. **Current market data** — price, volume, earnings calendar, volatility, options chain, rates, and macro data from current providers.
4. **GitHub research engines** — analytics and structured extraction tools described below.
5. **News and secondary research** — context and sentiment, never a substitute for primary evidence.
6. **Notion Money OS / Opportunity Playbook** — current portfolio philosophy, user-specific risk limits, decision rules, and historical decisions.

Never treat a GitHub repository, README, sample dataset, backtest, or cached output as proof of a current market fact.

## Approved finance research toolkit

### 1. OpenBB — market-data and research routing
Repository: `OpenBB-finance/OpenBB`

Use for:
- historical and current market-data workflows
- earnings calendars and estimates
- fundamentals where provider coverage is appropriate
- derivatives/options-chain retrieval when a supported provider is available
- macro/economic context
- cross-provider research workflows

Default role: **market-data router and broad research layer**.

Required behavior:
- record provider and as-of time when using time-sensitive data
- verify stale, delayed, or provider-limited fields before making a trade-specific claim
- for options, require current bid/ask, expiration, strike, open interest/volume when available, and event timing before treating a setup as executable

Do not use OpenBB output as the only evidence for a company thesis when a filing or company release is available.

### 2. EdgarTools — SEC filing and company-change engine
Repository: `dgunning/edgartools`

Use for:
- 10-K / 10-Q financial statements
- 8-K event checks
- Form 4 insider activity
- 13F institutional holdings when relevant
- proxy and other SEC filing analysis
- extracting structured filing text for AI review

Default role: **primary-source thesis verification**.

Run EdgarTools when:
- considering a meaningful add, trim, or exit in a U.S. SEC filer
- earnings or a material filing could change the thesis
- dilution, debt, acquisition, insider activity, or capital allocation matters
- a news headline needs confirmation against the actual filing

For foreign issuers or unsupported filing types, use the issuer's regulatory filings / investor relations materials instead of forcing an EDGAR-only workflow.

### 3. USAspending API — government-money catalyst engine
Repository: `fedspendingtransparency/usaspending-api`

Use for:
- federal awards and spending trends
- government-contractor exposure
- sector/theme confirmation in defense, space, AI, semiconductors, cybersecurity, nuclear, quantum, infrastructure, biotech, and other policy-sensitive areas
- distinguishing a real dollar-flow catalyst from a policy headline

Default role: **government-spending evidence**.

Trigger only when government spending is material to the thesis. Do not run it for every company.

When used, ask:
- Is the company or a meaningful subsidiary/recipient actually receiving awards?
- Is the award new, growing, recurring, or one-time?
- Is the amount material relative to company revenue/backlog?
- Is the public company the direct beneficiary, a subcontractor, or merely thematically related?

Never turn a government announcement into an investment recommendation without testing economic materiality.

### Government + congressional intelligence — standing evidence lane

For every serious finalist, perform a quick **government/congressional sweep** before the final recommendation or options-chain decision. This is a context lane, not an automatic trade signal.

Government context may include, when relevant:
- new legislation, appropriations, budget language, executive actions, tariffs, export controls, sanctions, tax rules, and policy changes;
- agency actions, investigations, approvals, enforcement, rulemaking, procurement, grants, loans, and contracts;
- DoD, DOE, HHS/FDA, Commerce, Treasury, FTC, FCC, EPA, SEC, NASA, DHS, and other agency developments that can materially affect the company or sector;
- USAspending or other official award data when actual federal dollars matter;
- policy-sensitive sector read-throughs in defense, space, AI/semiconductors, cybersecurity, nuclear/uranium, quantum, infrastructure/grid/power, biotech/healthcare, energy, materials, and other exposed industries.

For each government item, distinguish:
- **direct beneficiary / target** from **supplier / subcontractor** from **sector-sympathy exposure**;
- announced policy from implemented policy;
- authorization/appropriation from an actual award or cash flow;
- headline size from economically material value to the public company.

Congressional-trading context:
- check recent House and Senate financial disclosures for serious finalists when practical;
- prefer official House Clerk and Senate disclosure records as primary evidence;
- distinguish Member versus spouse/dependent ownership, purchase versus sale, stock versus option/other security, transaction date versus disclosure date, and disclosed dollar range;
- look for repeated/clustered activity and whether it aligns with or contradicts the fundamental thesis;
- never imply insider knowledge, causation, or real-time signaling from a congressional trade;
- never use a congressional transaction as the sole reason for a same-day options trade.

A company with no meaningful government or congressional signal should simply be marked **none / not material** rather than forcing a narrative.

### Optional Hugging Face financial catalyst triage

Use a lightweight financial-text classifier only as a **discovery accelerator** when the news/filing volume is large. Appropriate examples include financial-news sentiment classifiers such as `mrm8488/distilroberta-finetuned-financial-news-sentiment-analysis` or `ProsusAI/finbert`.

Use it to:
- deduplicate or cluster related headlines/events;
- classify positive / negative / mixed directional language;
- flag potentially material company-specific items for deeper review;
- help prioritize which tickers deserve primary-source validation.

Do **not** use model sentiment as a trade trigger, probability estimate, or substitute for primary evidence. A model may score a sector-sympathy headline as positive even when the named company is not the direct economic beneficiary.

### 4. OptionLab — options payoff and probability engine
Repository: `rgaveiga/optionlab`

Use for:
- defined-risk option structures
- debit/credit calculation
- payoff profile and breakeven
- Greeks
- probability-of-profit style analysis
- expected profit/loss and max/min outcomes

Default role: **options pre-flight math**.

OptionLab comes after, not before, live chain validation.

Required input before an implementation-ready options idea:
- underlying current price and timestamp
- exact expiration
- exact legs and strikes
- current bid/ask or realistic limit-price assumption
- implied volatility / Greeks when available
- liquidity evidence
- earnings and known event dates
- maximum loss under the current Opportunity Playbook

Never invent a premium, Greek, probability, spread fill, or live option term.

If live option data is unavailable, label the idea **conditional / research-only**, not executable.

### 5. PyPortfolioOpt — portfolio construction referee
Repository: `PyPortfolio/PyPortfolioOpt`

Use for:
- concentration diagnostics
- covariance/correlation-aware portfolio construction
- Hierarchical Risk Parity
- Black-Litterman scenario work
- testing whether a proposed basket improves risk efficiency

Default role: **second-opinion portfolio math**, not portfolio dictator.

Only run after pulling Max's actual current holdings and weights.

Do not let an optimizer erase thesis quality, taxes, liquidity, catalysts, conviction, account size, dividend goals, or user-defined position roles. Optimization output is an input to judgment, not the recommendation itself.

### 6. QuantStats — realized-performance and risk scorecard
Repository: `ranaroussi/quantstats`

Use for:
- realized strategy performance
- win/loss statistics
- Sharpe / Sortino / drawdown
- payoff and profit factor
- rolling/monthly returns
- benchmark comparison
- Monte Carlo risk-of-bust / goal analysis when return history is adequate

Default role: **post-trade learning and strategy accountability**.

Run when there is enough clean trade/return history to make the statistic meaningful. Do not manufacture precision from a tiny sample.

Segment results when possible by play type, for example:
- long-term/core growth
- dividend/income
- catalyst/event
- speculative asymmetry
- options

The purpose is to discover which decision patterns actually work for Max and which repeatedly destroy capital.

### 7. vectorbt — hypothesis testing / backtest engine
Repository: `polakowo/vectorbt`

Use for:
- repeatable rule-based strategies
- parameter sweeps
- signal testing
- walk-forward analysis
- robustness testing
- comparing a proposed rule against simple benchmarks

Default role: **Proof Engine for repeatable rules**.

Do not use vectorbt for a one-off narrative stock opinion.

A backtest must include, where applicable:
- transaction costs / spreads
- realistic entry and exit rules
- no look-ahead leakage
- out-of-sample or walk-forward testing
- parameter-sensitivity checks
- a simple benchmark

If a strategy only works at one narrow parameter setting, treat it as fragile rather than proven.

## Excluded / low-priority tools

### Random Robinhood trading bots
Do not use unofficial auto-trading repos as an execution layer. They add credential, reliability, API-change, and order-risk without improving the research edge. Research and recommendation remain separate from brokerage execution.

## Decision routing

Classify the request before doing research.

### A. Current portfolio review / rebalancing
Required:
1. Pull current holdings, cash, and weights from Finances.
2. Identify concentration, tiny-position fragmentation, theme duplication, income contribution, and speculative overlap.
3. Use PyPortfolioOpt only when correlation/weight optimization would change the decision.
4. Use current company research / EdgarTools on material names whose thesis drives the rebalance.
5. Return a role-based action set: **keep / add on weakness / trim / consolidate / exit / watchlist**.

Do not optimize stale holdings.

### B. Single-stock add / trim / exit decision
Required:
1. Confirm whether Max already owns it and the current position size.
2. Pull current price and recent market context.
3. Check latest earnings / guidance / valuation-relevant facts.
4. Use EdgarTools for SEC-filer thesis verification.
5. Run the government/congressional sweep; use USAspending or agency/official sources when government exposure is material, and check recent congressional disclosures as supporting context.
6. Compare expected upside, downside, catalyst timing, and opportunity cost against existing holdings.
7. State what would invalidate the thesis and, when useful, a valuation/price ceiling or review trigger.

### C. New idea / watchlist candidate
Required:
1. Identify why the idea exists now.
2. Verify fundamentals and balance-sheet runway.
3. Identify concrete catalysts and dates.
4. Run the government/congressional sweep, including policy/agency news and recent congressional disclosures when available; escalate to USAspending when actual federal dollars matter.
5. Compare against current portfolio overlap.
6. Prefer a short ranked candidate list over adding many tiny positions.

A good story without a differentiated catalyst, financial support, or favorable asymmetry stays on the watchlist.

### D. Options play
Required sequence:
1. **Underlying thesis** — no option before the stock/event thesis.
2. **Event map** — earnings, economic releases, product/regulatory decisions, known catalysts.
3. **Government/congressional sweep** — check policy/agency developments, government-dollar exposure, and recent congressional disclosures for the finalists before chain selection.
4. **Live chain** — current expirations, strikes, bid/ask, IV, liquidity, open interest/volume when available.
5. **Structure selection** — prefer defined-risk structures consistent with the current Opportunity Playbook.
6. **OptionLab pre-flight** — payoff, max loss, breakeven, Greeks, probability/expected outcome where model assumptions are reasonable.
7. **Portfolio fit** — total open-options risk and correlation with existing positions.
8. **Execution status** — executable only if all live terms are verified; otherwise conditional.
9. **Exit plan** — profit target, loss/invalidating condition, event/expiration handling.

Cheap premium is not an edge. A low debit may simply encode a low probability of success.

### E. Government / policy catalyst idea
Required sequence:
1. Identify the policy, award, program, or spending category.
2. Use official government sources / USAspending to confirm actual dollars.
3. Map recipients and subsidiaries to public companies carefully.
4. Compare award value to revenue, backlog, market cap, or segment scale.
5. Verify company disclosure when available.
6. Only then assess the stock/options opportunity.

### F. Strategy or rule claim
Examples: "buy post-earnings dips," "sell after X% run," "this indicator works," "government award winners outperform."

Required:
1. Translate the claim into an explicit testable rule.
2. Pull historical data.
3. Use vectorbt for backtest / robustness work.
4. Use QuantStats for performance and risk reporting.
5. Compare against a simple benchmark.
6. Reject or downgrade results that depend on overfit parameters, look-ahead data, or unrealistic execution.

### G. Post-trade review
Required:
1. Pull actual investment transactions when available.
2. Compare the original thesis and planned risk with the realized outcome.
3. Separate process quality from luck.
4. Use QuantStats after enough observations accumulate.
5. Update the strategy evidence: what kinds of setups are working, failing, or too noisy to judge.

## Standard research pipeline

For a serious investment decision, use this order:

`Portfolio state -> Market context -> Primary filings -> Catalyst evidence -> Government + congressional sweep -> Optional HF catalyst triage when volume is high -> Portfolio fit -> Options chain if relevant -> OptionLab math if relevant -> Decision -> Journal -> QuantStats learning -> vectorbt proof for repeatable rules`

This order matters. Do not start with options math or a backtest before establishing the economic thesis.

## Evidence standard

Every material recommendation should distinguish:
- **Fact** — directly supported by current primary or reliable market data.
- **Inference** — analytical conclusion drawn from facts.
- **Scenario** — conditional outcome, not a prediction.
- **Unknown / unverified** — missing evidence that could change the decision.

Time-sensitive facts must carry an as-of date/time where practical.

For current events, earnings, prices, options chains, laws, government awards, and company developments, refresh current sources instead of relying on chat memory.

## Portfolio philosophy checks

Before recommending a new position, ask:
- What job does this position perform: core growth, income, catalyst/special situation, or speculative asymmetry?
- Does Max already own the same economic exposure elsewhere?
- Is the position large enough to matter if right?
- Is downside defined well enough to survive being wrong?
- Is there a better existing position competing for the same dollar?

Avoid fake diversification: dozens of tiny correlated positions are not necessarily diversified.

## Options safety / quality gate

Do not call an options setup high-quality unless:
- the underlying thesis is explicit
- the catalyst/event calendar is checked
- live chain terms are verified
- the bid/ask spread is acceptable for the account and structure
- max loss is known and within the current Playbook rule
- the total options sleeve remains within the current portfolio-risk rule
- assignment/exercise/expiration mechanics are understood for the structure
- expected upside justifies the probability and loss profile

No naked short options by default. Do not convert a desired weekly-income target into forced trades.

## Output format for decision work

Prefer a compact decision card:

- **Action:** Add / Hold / Trim / Exit / Watch / Conditional option
- **Role:** Core / Income / Catalyst / Speculative
- **Why now:** catalyst or decision trigger
- **Evidence:** 3-5 strongest facts
- **Risk:** 2-4 ways the thesis can fail
- **Portfolio fit:** concentration / overlap / cash / opportunity cost
- **Valuation or price discipline:** ceiling, range, or review trigger when meaningful
- **Options:** only if the live-chain gate passes
- **Confidence:** high / medium / low, with the reason
- **Next review trigger:** date or event

Do not bury the recommendation under research trivia.

## Privacy and repository rule

This repository may be public. Never commit:
- Max's holdings or balances
- brokerage account identifiers
- trade history
- tax lots
- financial account screenshots
- private Notion content
- credentials or API keys

Store user-specific financial state only in authorized connected systems. This skill stores process, not personal data.

## Maintenance rule

When a dependency becomes stale, abandoned, incompatible, materially inaccurate, or superseded:
1. verify the issue from the current repository/release history;
2. identify a maintained replacement;
3. update this skill with the reason and migration path;
4. do not silently continue relying on stale analytics.

## Core principle

**Evidence first, structure second, trade last.**

The GitHub tools exist to improve the quality and repeatability of research. They do not create an obligation to trade.