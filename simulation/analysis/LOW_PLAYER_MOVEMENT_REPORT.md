# LOW-PLAYER MOVEMENT BONUS DIAGNOSTIC

Date: 2026-11-10.

Status: diagnostic only. Canonical rules unchanged.

## Setup

512 simulations per configuration.

Canonical 20-day rules, ordinary randomness, global planner, ST-NEUTRAL, approved hero profiles cycled across combinations.

No extra activations.
No capital DC changes.
No energy changes.
No map changes.

Only a flat bonus was added to every ordinary movement roll:
- 2p: +1 or +2;
- 3p: +1;
- 4p split: +0 control.

## Results

| Players / mode | Movement bonus | Wins / 512 | Win rate | Mean stable capitals at Day 20 | Mean POI | Mean Trust | Mean Energy | Mean crossings |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 2 together | +1 | 0 | 0.0% | 2.14 | 7.91 | 0.91 | 3.97 | 22.62 |
| 2 together | +2 | 1 | 0.2% | 2.47 | 8.05 | 0.94 | 3.97 | 22.72 |
| 3 together | +1 | 0 | 0.0% | 2.56 | 11.76 | 1.59 | 5.89 | 22.43 |
| 4 split control | +0 | 8 | 1.6% | 3.59 | 19.46 | 3.87 | 7.46 | 25.54 |

The single 2p/+2 win finished on Day 19.

## Interpretation

Flat movement speed is not the principal bottleneck.

For 2p, +2 raises average base movement very substantially, yet the group still stabilizes only about 2.5 of 5 capitals by Day 20. Energy is already close to the final requirement, while Trust and capital completion remain low.

For 3p, +1 movement similarly fails to create a meaningful win corridor.

The strongest contrast remains action throughput:
- one 2p/3p group receives one normal group activation per day;
- 4p split can operate two groups in parallel during the same world day.

Movement bonuses improve local travel but do not create additional opportunities to:
- resolve enough POIs;
- build Trust;
- perform capital work;
- pursue two distant objectives in parallel.

## Conclusion

Reject flat +1/+2 movement as a standalone balance fix.

Do not change canonical movement from this diagnostic.

The next useful diagnostic should separate the components of a full extra activation and identify which part causes the large win-rate jump: extra travel/exploration, extra POI resolution, or extra capital action. The aim is to create the smallest low-player compensation that increases task throughput without simply granting a second unrestricted activation every day.
