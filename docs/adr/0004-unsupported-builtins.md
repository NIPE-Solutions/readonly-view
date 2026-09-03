# 0004: Reject unsafe built-ins

Status: Accepted

Native objects often hide mutable state in internal slots. A generic proxy can expose methods that mutate those slots or can fail receiver brand checks. Map, Set, and Date therefore have dedicated adapters. Other internal-slot built-ins are rejected with `UnsupportedTypeError` unless their readonly semantics are deliberately implemented.

An explicit error is safer than returning an object that only appears readonly.
