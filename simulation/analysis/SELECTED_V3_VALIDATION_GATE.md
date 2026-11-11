# V3 selected reduced-activation candidate — validation gate

Date: 2026-11-11.

**Status: DIAGNOSTIC ONLY. NOT CANONICAL. Do not change RULES.md, BALANCE_V1.md, or event slot parameters without user approval.**

## Executive finding

The selected reduced-activation V3 candidate passes a **limited numerical stage-difficulty sensitivity test**, but **has not demonstrated simultaneous success on winning probability, intended POI exploration, and first-play duration**.

The most important new finding is a measured trade-off in the simulated planner: encouraging it to collect more Trust / visit more POIs reduces wins sharply. The original POI targets in BALANCE V1 are playtest *targets*, not win conditions, and may need explicit prioritization or revision. Do not reinterpret these results as proof that human players cannot combine exploration and success by a different policy.

## Candidate being tested (unchanged)

- Deadline: Day 20.
- 2 players: one shared bonus activation on 3 days out of 4 (skip every fourth day), capital DC -3.
- 3 players: one shared bonus activation on 5 days out of 6 (skip every sixth day), capital DC -3.
- 4 players: one shared team activation every second day, pair-specific capital DC -2, no shift for group-of-4.
- No change to final DC 8/9/10, final energy 4/6/8, movement, geography, or card slots.
- Permanent group-of-4 play is intentionally inefficient per user-approved direction. It is not a win-rate parity target.

## Test 1 — ST stage-difficulty sensitivity

512 simulations per row, ordinary randomness, global information-limited planner, hero profiles cycled through approved combinations. Other than ST difficulty, all selected-candidate options are fixed. Numeric ST surrogates are not completed event narratives.

| Players / mode | ST-NEUTRAL | ST-MODERATE | ST-HARSH |
|---|---:|---:|---:|
| 2 together | 296/512 = **57.8%** | 295/512 = **57.6%** | 293/512 = **57.2%** |
| 3 together | 282/512 = **55.1%** | 279/512 = **54.5%** | 274/512 = **53.5%** |
| 4 split 2+2 | 304/512 = **59.4%** | 288/512 = **56.3%** | 266/512 = **52.0%** |
| 4 dynamic | 320/512 = **62.5%** | 314/512 = **61.3%** | 294/512 = **57.4%** |

**Interpretation:** Modest stage sensitivity, largest observed decrease in the 4p split mode. This is robustness only to the chosen per-card DC penalties, not to unknown story effects. The ordinary group of 4 remains intentionally low and is excluded from target-rate parity.

Sources:
- Script: [selected_candidate_sensitivity.cjs](selected_candidate_sensitivity.cjs).
- [GitHub Action run — selected V3 sensitivity](https://github.com/pavelforchatgpt-maker/game/actions/runs/43078058499), completed successfully.

## Test 2 — increasing POI exploration / Trust acquisition

384 simulations per row, ST-NEUTRAL, all other selected candidate mechanics identical. Same seed/profile cycling across policy variants. POI figures below are means over **all games**, including losses; wins are counted by Day 20.

The three non-baseline options alter planner preferences (not game rules):
- `marginal`: prioritizes resources by expected benefit versus travel cost;
- `trust1`: pushes towards Trust target 1 per relevant nation;
- `trust2`: pushes towards Trust target 2 per relevant nation.

| Mode | Policy | Mean POI | Wins / 384 | Win rate |
|---|---|---:|---:|---:|
| 2p | legacy baseline | 8.06 | 220 | 57.3% |
| 2p | marginal | 9.23 | 206 | 53.6% |
| 2p | trust1 | 15.91 | 89 | 23.2% |
| 2p | trust2 | 19.57 | 11 | **2.9%** |
| 3p | legacy baseline | 11.88 | 210 | 54.7% |
| 3p | marginal | 14.99 | 155 | 40.4% |
| 3p | trust1 | 19.11 | 77 | 20.1% |
| 3p | trust2 | 23.29 | 13 | **3.4%** |
| 4p split | legacy baseline | 18.91 | 237 | 61.7% |
| 4p split | marginal | 22.07 | 181 | 47.1% |
| 4p split | trust1 | 23.27 | 148 | 38.5% |
| 4p split | trust2 | 25.73 | 103 | 26.8% |

For comparison, approved **BALANCE V1 playtest POI targets** were 18–20 / 23–26 / 29–32 at 2/3/4 players. These are not quotas.

An important selection effect: **wins generally contain fewer POI than losses**, because winning paths finish earlier and optimize for mandatory work. Under baseline selected V3 neutral:
- 2p winning games average 6.72 POIs versus 10.02 in losses.
- 3p winning games average 10.40 versus 13.73 in losses.
- 4p split winning games average 17.15 versus 21.71 in losses.

**Interpretation:** For the tested planner, simply promoting Trust-oriented exploration does not preserve a healthy win corridor. This does not prove a fundamental impossibility, and does not license adding free actions, weakening mandatory tasks, or changing the 88 slots without explicit approval.

Sources:
- Script: [selected_poi_tradeoff.cjs](selected_poi_tradeoff.cjs).
- [GitHub Action run — selected V3 POI tradeoff](https://github.com/pavelforchatgpt-maker/game/actions/runs/43078666299), completed successfully.

## Test 3 — distribution of estimated physical session duration

512 simulated trajectories per mode, ST-NEUTRAL, selected baseline policy. The calculation applies exactly the existing fixed time rates from [DURATION_MODEL_REPORT.md](DURATION_MODEL_REPORT.md) to **each individual simulated trajectory**, including the actual number of final attempts. It is an estimate, not measured tabletop time.

| Mode | Normal family: mean | Normal: >150m | First play: mean | First play: >150m |
|---|---:|---:|---:|---:|
| 2p | 109.7 min | 0/512 = 0% | 154.5 min | 361/512 = 70.5% |
| 3p | 123.3 min | 0/512 = 0% | 173.3 min | 509/512 = 99.4% |
| 4p split | 142.5 min | 128/512 = 25.0% | 200.1 min | 512/512 = 100% |

Distribution tails:
- 4p split, normal: median 143.1, 75th percentile 150.0, 90th percentile 156.8 minutes.
- 4p split, *winning only*: mean 137.5 minutes, 26/304 (8.6%) exceed 150 minutes.
- 3p, normal: 90th percentile 133.9 minutes.
- 2p, normal: 90th percentile 117.9 minutes.

**Interpretation:** Candidate remains compatible with 120–150 minutes at average *experienced normal family pace*, but 4p split has a nontrivial long tail and first play exceeds the target under the model. Fixed overhead, text lengths, card reading, and route-planning time are not measured. Results cannot establish actual physical duration.

Sources:
- Script: [selected_duration_distribution.cjs](selected_duration_distribution.cjs).
- [GitHub Action run — selected V3 duration distribution](https://github.com/pavelforchatgpt-maker/game/actions/runs/43079102652), completed successfully.

## Decision gates and next development step

| Gate | Current status | Reason |
|---|---|---|
| 2p / 3p / 4p split/dynamic win-rate corridor under selected numerical ST | **Provisionally passes** | Rates remain around 52–62.5% in tested scenarios |
| Permanent 4-together equal parity | **Not a gate** | Low efficiency deliberately approved |
| Original POI playtest targets under sensible win-max play | **Does not pass** | Successful sessions visit far fewer POI |
| 120–150 minutes at normal pace | **Borderline for 4p** | 25% modeled sessions exceed 150 |
| 120–150 minutes at first-ever play pace | **Does not pass** | Very high modeled overrun, particularly 3–4 players |
| Hero-composition fairness, full unknown ST narratives, real physical handling | **Unverified** | Existing sampling is not sufficient for per-composition claims; texts and components not physically timed |

**Recommended next step:** Before tuning capital DC or bonus activation cadence further, choose the desired *experiential POI density in a successful normal playthrough*, distinguishing it from older per-game targets that included failed runs. Set a constraint on POI card resolution time; then test one candidate that improves encounter throughput or meaningful value of exploration without silently altering canonical rules. Do not simply extend to 25/30 days: previous diagnostics found poor low-player feasibility and excessive duration.

Until that choice and timed playtests, retain V3 selected reduced-activation as a **diagnostic candidate**. No canonical rules have been changed by these three runs.
