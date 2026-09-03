# 0003: Use controlled shadow targets

Status: Accepted

ReadonlyView proxies fresh shadow targets rather than arbitrary source objects directly. Reflection traps synchronize observable shape from the source while descriptors exposed through the view contain wrapped values.

This prevents non-configurable or non-writable source properties from forcing a proxy trap to reveal their original mutable values. Shadows also let frozen, sealed, and non-extensible sources remain untouched while the view satisfies ECMAScript proxy invariants.
