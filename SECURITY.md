# Security Policy

Security fixes are supported for the latest published major version. Report vulnerabilities through GitHub private vulnerability reporting for `NIPE-Solutions/readonly-view`; do not publish exploit details in an issue.

Canonical documentation URL: [readonly-view.nipesolutions.com](https://readonly-view.nipesolutions.com).

ReadonlyView is not a security sandbox. Unexpected source-reference escapes through supported paths, source mutation by the library, prototype pollution, or package-integrity failures are relevant reports. Existing source references, user function/getter side effects, and consumer-proxy behavior are outside the sandbox guarantee but may still reveal correctness defects.
