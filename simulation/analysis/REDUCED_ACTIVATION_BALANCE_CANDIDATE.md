# REDUCED-ACTIVATION BALANCE CANDIDATE

Date: 2026-11-11.

Status: **DIAGNOSTIC CANDIDATE ONLY. NOT CANONICAL.**

This report records the best reduced-activation balance candidate found after V3 diagnostics. No canonical rules are changed by this file.

## Candidate configuration

### 2 players
- 20-day deadline unchanged.
- One shared bonus full group activation on 3 of every 4 days (no bonus on every 4th day).
- Capital difficulty shift: -3.
- All other tested systems unchanged.

### 3 players
- 20-day deadline unchanged.
- One shared bonus full group activation on 5 of every 6 days (no bonus on every 6th day).
- Capital difficulty shift: -3.
- All other tested systems unchanged.

### 4 players
- 20-day deadline unchanged.
- One shared bonus team activation every 2nd day.
- Group-of-4 capital difficulty remains canonical.
- When a pair of two heroes performs a capital team check, capital difficulty shift: -2.
- Split/dynamic play is the intended effective strategy; permanent four-together play is intentionally not balanced to the same win rate.

## 512-run validation

| Players / mode | Wins | Win rate | Mean win day | Median win day | Mean activations to Day 20 | Movement rolls | POI | Capital checks |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 2 together | 296 / 512 | 57.8% | 18.18 | 18 | 32.55 | 65.11 | 8.11 | 15.04 |
| 3 together | 282 / 512 | 55.1% | 18.26 | 19 | 34.19 | 102.56 | 11.90 | 13.88 |
| 4 together | 5 / 512 | 1.0% | 20.00 | 20 | 30.39 | 121.58 | 16.44 | 11.12 |
| 4 split 2+2 | 304 / 512 | 59.4% | 18.09 | 18 | 45.25 | 92.34 | 19.00 | 14.20 |
| 4 dynamic | 320 / 512 | 62.5% | 18.04 | 18 | 44.74 | 91.35 | 18.38 | 14.13 |

## Comparison with Candidate B

Candidate B used one shared bonus activation every day plus lighter capitals.

Candidate B validation:
- 2p: 59.2%, 36.00 activations, 72.00 movement rolls;
- 3p: 57.2%, 36.24 activations, 108.71 movement rolls;
- 4p split: 62.7%, 52.83 activations, 107.73 movement rolls;
- 4p dynamic: 60.7%, 53.13 activations, 108.21 movement rolls.

Selected reduced-activation candidate:
- 2p: 57.8%, 32.55 activations, 65.11 movement rolls;
- 3p: 55.1%, 34.19 activations, 102.56 movement rolls;
- 4p split: 59.4%, 45.25 activations, 92.34 movement rolls;
- 4p dynamic: 62.5%, 44.74 activations, 91.35 movement rolls.

Approximate workload reduction vs Candidate B:
- 2p activations: -9.6%; movement rolls: -9.6%;
- 3p activations: -5.7%; movement rolls: -5.7%;
- 4p split activations: -14.4%; movement rolls: -14.3%;
- 4p dynamic activations: -15.8%; movement rolls: -15.6%.

## Rejected/insufficient diagnostics

The following standalone approaches did not solve the balance problem:
- extending the deadline to 25 or 30 days;
- lowering capital DC alone;
- flat +1/+2 movement;
- one extra activation only every 2/3/4/5 days without complementary scaling;
- only extra travel;
- only extra capital work;
- daily exploration-only bonus without enough capital scaling;
- reducing capital workload alone while keeping one activation/day.

The key structural finding is that one normal group activation per day is insufficient for 2p/3p under the present 20-day map/objective structure. A partial extra-activation schedule plus player-count-sensitive capital difficulty currently produces the cleanest simulated balance.

## Duration caveat

Simulation workload counts are not measured tabletop minutes. This candidate is materially lighter than Candidate B, but no simulation can establish that a physical session stays below 150 minutes. A timed physical or scripted tabletop playtest is still required before approving these rules.

## Status

Do not update RULES.md or canonical balance files from this report without explicit user approval.
