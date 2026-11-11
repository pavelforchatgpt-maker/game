# DURATION MODEL — REDUCED-ACTIVATION CANDIDATE

Date: 2026-11-11.

Status: **ESTIMATE ONLY. NOT MEASURED TABLETOP TIME.**
Canonical rules remain unchanged.

## Input workload from the 512-run reduced-activation validation

| Mode | Mean win day | Activations | Movement rolls | POI | Capital checks |
|---|---:|---:|---:|---:|---:|
| 2 players | 18.18 | 32.55 | 65.11 | 8.11 | 15.04 |
| 3 players | 18.26 | 34.19 | 102.56 | 11.90 | 13.88 |
| 4 players, split 2+2 | 18.09 | 45.25 | 92.34 | 19.00 | 14.20 |

These counts come from the current reduced-activation diagnostic candidate:
- 2p: shared bonus activation on 3 of every 4 days, capital DC -3;
- 3p: shared bonus activation on 5 of every 6 days, capital DC -3;
- 4p split: shared bonus activation every 2nd day, pair capital DC -2.

## Timing assumptions

Because the 88 event texts and final visual components do not exist yet, tabletop duration cannot be measured exactly. Three timing profiles are used.

### Experienced / fast
- activation-level decision: 20 s;
- movement roll + moving the figure: 7 s;
- POI card: 70 s;
- capital check: 50 s;
- day administration: 10 s;
- final check: 60 s;
- setup / rules / non-counted overhead: 10 min;
- general cooperative discussion: 10 min.

### Normal family pace
- activation-level decision: 35 s;
- movement roll + moving the figure: 10 s;
- POI card: 120 s;
- capital check: 85 s;
- day administration: 15 s;
- final check: 90 s;
- setup / rules / non-counted overhead: 15 min;
- general cooperative discussion: 20 min.

### First play / slow
- activation-level decision: 50 s;
- movement roll + moving the figure: 14 s;
- POI card: 165 s;
- capital check: 120 s;
- day administration: 20 s;
- final check: 120 s;
- setup / rules / non-counted overhead: 20 min;
- general cooperative discussion: 30 min.

## Estimated session duration

| Mode | Experienced | Normal family pace | First play |
|---|---:|---:|---:|
| 2 players | ~66 min | **~110 min** | ~155 min |
| 3 players | ~74 min | **~123 min** | ~173 min |
| 4 players, split 2+2 | ~85 min | **~142 min** | ~200 min |

## Interpretation

The reduced-activation candidate is compatible with the target 120–150 minute session for a normal-family pace:
- 2p: ~1h50;
- 3p: ~2h03;
- 4p split: ~2h22.

The four-player split mode is the main duration ceiling. It remains just under 2.5 hours in the normal model.

The first ever play can exceed 2.5 hours, especially at 3–4 players, because rules reading, card reading and cooperative discussion dominate more than the raw simulation workload.

## Design constraints implied by this estimate

To preserve the 120–150 minute target:
1. POI card text should stay concise enough to resolve in roughly 1.5–2 minutes at normal pace.
2. Capital checks should not require long multi-step lookup or arithmetic.
3. Day/stage administration should remain very lightweight.
4. Avoid adding new per-activation bookkeeping.
5. The 4p split activation count should not grow materially above the current ~45 per winning game.

## Conclusion

The reduced-activation candidate is **not rejected on duration grounds**.

It is viable for the desired feature-film-length session if:
- event text remains concise;
- the rules are reasonably learned;
- 4p split does not gain more mandatory actions.

Before approval, run at least one timed scripted playthrough for 2p, 3p and 4p split. The most important physical benchmark is the 4p split session; if it exceeds 150 minutes under normal play, reduce interaction/reading overhead before increasing the 20-day limit or removing necessary actions.
