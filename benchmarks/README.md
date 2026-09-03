# Benchmarks

Run `npm run benchmark` after `npm run build:dist`.

The harness reports wall-clock timings for plain reads, view creation and reads, arrays, Map, Set, Date, shallow freeze, and recursive deep freeze. It performs correctness checks before reporting and prints the Node/OS environment. Results are diagnostic rather than CI performance thresholds because shared runners are noisy. `npm run benchmark:smoke` verifies that every scenario executes.

## v2 alpha baseline

Measured on Node 24.20.0, macOS arm64, 100,000 iterations:

| Scenario                    |        Time |
| --------------------------- | ----------: |
| Plain nested read           |     0.44 ms |
| Repeated view read          |    15.65 ms |
| View creation               |    29.36 ms |
| Array iteration (100 items) | 1,566.84 ms |
| Map read                    |    17.19 ms |
| Set iteration               |    39.36 ms |
| Date read                   |    13.21 ms |
| Shallow freeze              |     3.07 ms |
| Recursive deep freeze       |    25.34 ms |

These numbers describe one local run and are not performance guarantees. The package budget baseline is 5,169 B minified ESM, 1,728 B minified+gzip, 1,643 B declarations, and a 6,945 B npm tarball. Enforced limits include maintenance headroom and live in `scripts/size-budget.json`.
