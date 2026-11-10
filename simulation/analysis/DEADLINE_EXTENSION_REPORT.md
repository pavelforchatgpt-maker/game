# DEADLINE EXTENSION DIAGNOSTIC

Date: 2026-11-10.

Status: diagnostic only. Canonical rules are unchanged.

## Setup

512 simulated games per configuration.

Configurations:
- 2 players / together;
- 3 players / together;
- 4 players / split 2+2;
- 4 players / dynamic split/merge.

Model:
- canonical rules;
- ordinary randomness;
- global planner;
- ST-NEUTRAL;
- no balance compensation;
- approved hero profiles cycled across combinations;
- Stage III is extended beyond Day 20 only for the diagnostic horizon.

The 25/30-day deadlines are hypothetical. They are not approved rules.

## Results

| Players / mode | Win by 20 | Win by 25 | Win by 30 | Mean played days @25 | Mean played days @30 |
|---|---:|---:|---:|---:|---:|
| 2 together | 0.0% | 0.2% | 2.5% | 25.00 | 29.97 |
| 3 together | 0.0% | 0.0% | 2.7% | 25.00 | 29.96 |
| 4 split | 1.2% | 22.7% | 60.9% | 24.64 | 27.73 |
| 4 dynamic | 1.2% | 25.2% | 63.3% | 24.58 | 27.58 |

For 4-player successful games:
- split, deadline 25: mean win day 23.41, median 24;
- split, deadline 30: mean win day 26.27, median 27;
- dynamic, deadline 25: mean win day 23.35, median 24;
- dynamic, deadline 30: mean win day 26.17, median 26.

## Relative duration

Relative to a full 20-day game:
- 25-day limit: about +23% for 4p split/dynamic and +25% for 2/3p;
- 30-day limit: about +38% for 4p split/dynamic and almost +50% for 2/3p.

If a 20-day physical session actually lasts 120–150 minutes, the proportional estimate is:

### 25-day limit
- 2/3 players: ~150–188 minutes;
- 4p split/dynamic: ~148–185 minutes.

### 30-day limit
- 2/3 players: ~180–225 minutes;
- 4p split/dynamic: ~166–208 minutes.

These are proportional estimates, not measured tabletop times.

## Conclusion

Increasing the deadline alone is a poor balance fix.

25 days:
- materially lengthens sessions;
- still leaves 2/3-player simulated win rate effectively zero;
- 4-player split rises only to about one quarter.

30 days:
- pushes likely session length well beyond the 2.5-hour target unless the 20-day prototype is substantially faster than 120 minutes;
- 4-player split becomes healthy (~61–63%);
- 2/3 players remain almost unwinnable in this planner (~2.5–2.7%).

Therefore do not change the canonical 20-day limit solely to repair balance. A 25-day limit can remain a future pacing candidate only if physical playtests show the 20-day game is substantially below 2 hours and other balance changes already solve 2/3-player action economy.
