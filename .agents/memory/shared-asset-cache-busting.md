---
name: Shared asset cache busting
description: Cache behavior for CSS and JavaScript injected into the static HTML pages.
---

When a shared stylesheet or script is injected by the static server and served with a long browser cache duration, update its query-string version whenever the shared asset changes.

**Why:** A live preview can continue using an older cached asset even after the workflow restarts, making a correct visual fix appear not to have applied.

**How to apply:** Keep the injected asset version in the server response aligned with the current shared preference/theme assets; bump it after a meaningful change and verify the rendered preview with the new URL.