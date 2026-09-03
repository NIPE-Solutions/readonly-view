# 0002: Remove state-management APIs

Status: Accepted

Version 2 removes `internalSet`, validation, deep merge, lifecycle hooks, and the `.value` container. The mutable source is the mutation API. ReadonlyView owns only the boundary that prevents writes through a view.

This is intentionally breaking. A migration guide is preferable to carrying two conflicting ownership models in the core package.
