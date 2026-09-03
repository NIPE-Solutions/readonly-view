# Guarantees and non-guarantees

## Guarantees

Writes through a view are rejected. Supported nested values are protected lazily. The source is never intentionally modified or constrained. Owner changes remain visible. Shared identity is stable within one membrane, cycles work, and unsupported values fail explicitly.

Each top-level call creates an independent membrane. Passing an existing view is idempotent.

## Non-guarantees

ReadonlyView is not a security sandbox. It cannot revoke another source reference. Functions and getters can cause external side effects. Consumer proxies execute arbitrary traps. Private class fields may reject proxy receivers. Unsupported native objects are not made safe by accident.
