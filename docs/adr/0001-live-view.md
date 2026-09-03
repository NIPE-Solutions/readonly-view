# 0001: Use a live view

Status: Accepted

ReadonlyView observes the owner's current data instead of cloning a snapshot. The owner retains the source reference and mutation authority; consumers receive a runtime-enforced readonly projection. This preserves updates, identity relationships, and cheap initial creation.

The tradeoff is per-access proxy overhead. Code that needs versioned immutable values or structural sharing should use a state-management tool instead.
