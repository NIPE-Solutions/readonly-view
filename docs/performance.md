# Performance

ReadonlyView optimizes initial wrapping and identity, not raw proxy reads. Initial creation classifies one value; nested graphs are not walked. First access creates a nested proxy and subsequent access reuses WeakMap identity. Collection adapters iterate lazily.

Every proxy access has overhead and collection iteration allocates protected results. See `benchmarks/README.md`. CI gates artifact size, not noisy timing ratios.
