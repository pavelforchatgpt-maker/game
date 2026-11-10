# 25-DAY + CAPITAL SCALING DIAGNOSTIC

Date: 2026-11-10.

Status: diagnostic only. Canonical rules unchanged.

## Setup

512 simulations per configuration, ordinary randomness, global planner, ST-NEUTRAL, approved hero profiles cycled across combinations.

Hypothetical deadline: Day 25.

No extra activations.
No movement compensation.
No energy changes.
No map changes.
Only capital difficulty was shifted for 2p/3p.

## Results

| Players | Capital DC shift | Wins / 512 | Win rate | Mean win day | Mean played days | Mean stable capitals at Day 25 |
|---|---:|---:|---:|---:|---:|---:|
| 2 | -1 | 3 | 0.6% | 24.0 | 24.99 | 2.08 |
| 2 | -2 | 14 | 2.7% | 23.5 | 24.96 | 2.53 |
| 2 | -3 | 30 | 5.9% | 23.57 | 24.92 | 2.72 |
| 3 | -1 | 1 | 0.2% | 25.0 | 25.00 | 2.16 |
| 3 | -2 | 5 | 1.0% | 25.0 | 25.00 | 2.34 |
| 3 | -3 | 3 | 0.6% | 24.33 | 25.00 | 2.37 |

Reference from previous deadline diagnostic with canonical capital DC:
- 4p split at Day 25: 22.7% win rate, mean played days 24.64.
- 4p dynamic at Day 25: 25.2% win rate, mean played days 24.58.

## Interpretation

Capital difficulty is not the principal cause of low 2p/3p feasibility.

Even an aggressive -3 DC shift leaves most games with only about 2.4–2.7 capitals stable by Day 25. Therefore the bottleneck lies earlier in the action economy: travel, POI/resource acquisition, mandatory capital visits and limited number of group activations.

For 3p the non-monotonic -2/-3 result is sampling/policy interaction at very low win rates and does not indicate that harder capitals are beneficial.

## Duration implication

Because almost all 2p/3p games reach Day 25, a 25-day physical game would use essentially the full +25% duration.

If a 20-day game lasts 120–150 minutes, this corresponds to approximately 150–188 minutes (2h30–3h08).

## Conclusion

Reject “25 days + only easier capitals” as a balance solution.

Future diagnostics should target action economy directly, using the weakest possible cadence of additional activation for 2p/3p, while retaining 4p split as the natural four-player strategy.
