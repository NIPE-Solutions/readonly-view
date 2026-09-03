# ImmuView v1 to ReadonlyView v2

v2 does one thing: provide a readonly view.

Before:

```ts
import readonly from 'immuview';
const state = readonly(
    { count: 0 },
    { validator: (value) => value.count >= 0 },
);
state.value.count;
state.internalSet({ count: 1 });
```

After:

```ts
import { readonlyView } from '@nipe-solutions/readonly-view';
const source = { count: 0 };
const state = readonlyView(source);
state.count;
source.count = 1;
```

Removed: `internalSet`, `deepMerge`, validators, handlers, validation errors, lifecycle, wrapper `.value`, default export, and implementation exports. Existing users may remain on v1 tags while migrating.
