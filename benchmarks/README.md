# Benchmarks

Run `npm run benchmark` after `npm run build:dist`.

The harness reports wall-clock timings for plain reads, view creation and reads, arrays, Map, Set, Date, shallow freeze, and recursive deep freeze. It performs correctness checks before reporting and prints the Node/OS environment. Results are diagnostic rather than CI performance thresholds because shared runners are noisy. `npm run benchmark:smoke` verifies that every scenario executes.

## v2 alpha baseline

Measured on Node 24.20.0, macOS arm64, 100,000 iterations:

| Scenario                    |        Time |
| --------------------------- | ----------: |
| Plain nested read           |     0.44 ms |
| Repeated view read          |    15.38 ms |
| View creation               |    26.20 ms |
| First nested access         |    77.04 ms |
| Large object creation       |    25.83 ms |
| Deep nested read            |    23.52 ms |
| Array iteration (100 items) | 1,484.39 ms |
| Map read                    |    20.69 ms |
| Set iteration               |    40.86 ms |
| Date read                   |    15.41 ms |
| Shallow freeze              |     3.14 ms |
| Recursive deep freeze       |    24.79 ms |

These numbers describe one local run and are not performance guarantees. The final reviewed alpha package baseline is 5,807 B minified ESM, 1,900 B minified+gzip, 2,026 B declarations, and a 6,521 B npm tarball. Enforced limits include maintenance headroom and live in `scripts/size-budget.json`.
