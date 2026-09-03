# FAQ

## Is this a frozen clone?

No. The source stays mutable and live.

## Is this a state manager?

No subscriptions, mutations, validation, patches, or lifecycle exist.

## Why reject built-ins?

Proxy does not automatically protect native slots or mutable memory. Explicit failure is safer.

## Why can private fields fail?

Private fields brand-check receivers; passing the proxy preserves safety but can fail.

## Are repeated calls identical?

Separate calls create separate membranes. Re-wrapping a view is idempotent.
