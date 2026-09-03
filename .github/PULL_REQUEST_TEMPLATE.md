## Summary

Describe the user-visible behavior and why it belongs in this focused library.

## Verification

- [ ] `npm run check`
- [ ] Regression test added for every fixed bug
- [ ] Public behavior documented
- [ ] No new runtime dependency
- [ ] Breaking changes called out

## Membrane review

- [ ] No mutable reference escapes through the changed path
- [ ] Source data is not modified
- [ ] Identity, liveness, and proxy invariants remain intentional
