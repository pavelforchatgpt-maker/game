# SIMULATION V3 — WORKLOG

Дата: 2026-11-10.

Статус: диагностическая работа. Канонические правила игры не изменены.

## Что проверено

1. V2 остаётся структурно валиден после расширения planner:
   - kernel/effects tests проходят;
   - bounds/facts проходят;
   - successful witnesses V2 проходят validator.

2. Старый V3-поиск по 120 порядкам столиц × uniform Trust target 0/1/2:
   - 2 together: лучшие проверенные policy 0/1024 побед;
   - 3 together: 0/1024;
   - 4 together: 0/1024;
   - 4 split/dynamic: около 4% побед.
   
   Следовательно, одним выбором порядка столиц и единого Trust target текущий канон не исправляется.

3. Ускорение движения само по себе недостаточно.
   Старый counterfactual с +1 movement и облегчёнными столицами всё ещё давал 0/256 побед для 2 игроков.
   Главный bottleneck включает число содержательных групповых активаций за 20 суток.

## Action-economy diagnostics

### Две активации каждой существующей группе в сутки

Win by Day 20:
- 2p: 71.1%
- 3p: 57.0%
- 4 together: 35.9%
- 4 split: 98.4%
- 4 dynamic: 99.2%

Вывод: отвергнуть как балансный кандидат — слишком сильно разгоняет 2+2.

### Одна общая бонусная активация команды в сутки + DC по участникам

Win by Day 20:
- 2p: 77.3%
- 3p: 57.0%
- 4 together: 36.7%
- 4 split: 92.2%
- 4 dynamic: 93.0%

Вывод: параллельные пары всё ещё чрезмерно сильны.

### Одна общая бонусная активация команды в сутки + DC по общему числу игроков

Capital DC shift:
- 2p: -2
- 3p: -1
- 4p: 0 независимо от split

Win by Day 20 на фиксированном сравнительном наборе:
- 2p: 58.6%
- 3p: 59.4%
- 4 together: 30.5%
- 4 split: 58.6%
- 4 dynamic: 58.6%

Это лучший найденный по равенству 2/3/4 split кандидат, но 4 together остаётся существенно слабее.

## Exact capital burden

Для Trust=0 ожидаемая суммарная нагрузка столичных проверок при:
- 2p, DC -2: ~8.48
- 3p, DC -1: ~9.02
- 4p together, DC 0: ~9.31

То есть масштабирование столиц 2:-2 / 3:-1 / 4:0 само по себе выравнивает командные проверки достаточно хорошо.
Оставшийся перекос связан преимущественно с движением/синхронизацией и action economy.

## Hero-composition robustness

При цикле утверждённых комбинаций героев вариант shared bonus + total-player capital scaling показал:
- 2p ST-neutral: ~63.5%
- 3p ST-neutral: ~47.9%
- 4p dynamic ST-neutral: ~34.4%

Следовательно, один фиксированный состав героев скрывает значительный разброс. Перед утверждением баланса нужно проверять все составы.

## Four-together movement diagnostic

Постоянный +1 movement только активной группе из 4 при shared team bonus:
- +1 каждый день: 82.8% побед;
- +2 каждый день: 93.0%.

Следовательно, постоянный +1 уже чрезмерен.
Запущена диагностика более мягкого варианта: +1 только через 2/3 суток.

## Текущие расширения planner

В V2/V3 добавлены диагностические параметры:
- per-nation Trust targets;
- split day;
- fixed-pair composition;
- evolutionary policy search;
- periodic four-hero movement bonus.

Это расширение симуляционного пространства решений, а не новые правила игры.

## Следующие проверяемые кандидаты

A. Текущий канон + более сильный policy search.
Цель: выяснить, может ли качество решений само по себе существенно поднять win rate.

B. Одна shared bonus activation/day + упрощённое capital scaling:
- 2p DC -2
- 3p DC -2
- 4p group-of-4 DC 0
- 4p pair DC -1

Цель: проверить, можно ли выровнять 2/3/4 split без отдельного движения для 3 игроков.

C. Для режима 4 together:
+1 movement только периодически (раз в 2 или 3 суток), а не ежедневно.

## Запрет на преждевременное изменение правил

До сравнительного результата V3:
- не менять Day 20;
- не менять карту;
- не менять финальную энергию 4/6/8;
- не менять EVENT SLOT MATRIX;
- не утверждать shared bonus activation;
- не утверждать movement compensation;
- не утверждать новые capital DC.

Все перечисленные варианты пока DIAGNOSTIC ONLY.


## Решение пользователя 2026-11-10: 4 together не балансировать до 2+2

Утверждено как дизайнерское намерение: низкая эффективность постоянной группы из четырёх героев не является дефектом сама по себе. Для четырёх игроков ожидаемая сильная стратегия — разделение 2+2 с возможностью последующего объединения. Игроки должны иметь возможность самостоятельно заметить, что постоянное движение вчетвером теряет темп, ТИ и параллельные активации.

Следовательно:
- больше не искать обязательную компенсацию movement для 4 together;
- periodic +1 movement и другие такие варианты оставить только как архив диагностики, не как кандидаты правил;
- основной баланс V3 сравнивать по 2 together / 3 together / 4 split и 4 dynamic;
- 4 together использовать как контрольную заведомо менее эффективную стратегию, а не как целевой win-rate;
- отдельно проверить, что 2+2 не становится настолько сильным, что снимает напряжение 20 суток.

Канонические правила групп не изменены.


## 2026-11-10 — Low-player movement diagnostic

Flat movement compensation was tested under the canonical 20-day structure, with no extra activations or DC/resource/map changes.

Results (512 each):
- 2p +1 movement: 0.0% win;
- 2p +2 movement: 0.2% win;
- 3p +1 movement: 0.0% win;
- 4p split control: 1.6% win.

Conclusion: local movement speed alone is not the main bottleneck. Even +2 for 2p does not create a viable win corridor. The next diagnostic should decompose the value of a full extra activation into travel/exploration vs POI resolution vs capital work and identify the smallest throughput compensation for low-player games. Canonical movement remains unchanged.


## 2026-11-11 — Candidate B large validation

512-run ST-NEUTRAL validation with approved hero-profile combinations cycled:
- 2p together: 59.2% win, mean win Day 17.48;
- 3p together: 57.2%, Day 17.91;
- 4p together: 26.6%, Day 18.77;
- 4p split: 62.7%, Day 17.55;
- 4p dynamic: 60.7%, Day 17.56.

Candidate B = one shared team bonus activation/day + capital DC -2 for 2/3p + pair DC -1 for 4p; group-of-4 capital DC unchanged. Final DC, energy, map, movement and Day 20 unchanged.

This currently gives the desired strategic asymmetry: 4 together remains weaker while reasonable 2p/3p/4p split strategies cluster near 57–63%. Workload metrics show the bonus mostly increases movement/throughput rather than POI count, so duration must be measured physically rather than assumed to scale linearly with activation count.


## 2026-11-11 — Reduced-activation balance candidate

A 512-run validation produced the current best diagnostic balance profile without changing the 20-day deadline:
- 2p: bonus activation 3/4 days, capital DC -3 → 57.8% win, 32.55 activations;
- 3p: bonus activation 5/6 days, capital DC -3 → 55.1%, 34.19 activations;
- 4p split: shared bonus every 2nd day, pair capital DC -2 → 59.4%, 45.25 activations;
- 4p dynamic: same → 62.5%, 44.74 activations;
- 4p together: same global 4p schedule but no pair DC shift while together → 1.0%, intentionally inefficient per approved design direction.

Compared with Candidate B, workload falls about 6–16% depending on configuration while preserving the intended ~55–63% win corridor for 2p/3p/4p split/dynamic. This remains diagnostic only; physical duration is not established and canonical rules are unchanged. See simulation/analysis/REDUCED_ACTIVATION_BALANCE_CANDIDATE.md.
