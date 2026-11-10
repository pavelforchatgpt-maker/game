# ACTION ECONOMY + CAPITAL SCALING GRID

Date: 2026-11-10.

Status: diagnostic only. Canonical rules unchanged.

## Setup

20-day deadline, ordinary randomness, global planner, ST-NEUTRAL, approved hero profiles cycled across combinations, 512 simulations per cell.

2p/3p:
- one group;
- diagnostic second full activation every day;
- capital DC shift tested at -1/-2/-3.

4p split:
- canonical two pair activations per day;
- no third activation;
- pair-only capital DC shift tested at -1/-2/-3.

## Results

| Players/mode | Capital DC shift | Win rate | Mean winning day | Mean stable capitals at Day 20 |
|---|---:|---:|---:|---:|
| 2 together + daily second activation | -1 | 31.1% | 18.13 | 4.08 |
| 2 together + daily second activation | -2 | 62.9% | 17.68 | 4.80 |
| 2 together + daily second activation | -3 | 78.3% | 17.37 | 4.93 |
| 3 together + daily second activation | -1 | 42.2% | 18.46 | 4.68 |
| 3 together + daily second activation | -2 | 60.5% | 18.05 | 4.87 |
| 3 together + daily second activation | -3 | 64.5% | 17.88 | 4.89 |
| 4 split, canonical two pair activations | -1 | 5.3% | 19.48 | 4.02 |
| 4 split, canonical two pair activations | -2 | 11.9% | 19.44 | 4.42 |
| 4 split, canonical two pair activations | -3 | 17.8% | 18.97 | 4.55 |

Additional 4p split diagnostics:
- at pair shift -2: mean POI 19.22, Trust 4.00, energy at Day 20 6.32 vs required 8;
- at pair shift -3: mean POI 19.26, Trust 3.92, energy at Day 20 5.78 vs required 8.

## Interpretation

For 2p/3p a clean candidate emerges:
- two group activations per world day;
- -2 capital DC.
This produces approximately 63% / 61% win rates across cycled hero compositions.

For 4p split, lowering capital DC alone cannot close the gap. By Day 20 most capitals are already stable, while the shared energy total remains below the 8-energy final requirement in the average failed run. Therefore the next diagnostic isolates the resource requirement before considering any extra third activation.

No rules are approved by this report.
