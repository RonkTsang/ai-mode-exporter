# Host page DOM

- Inspect the live target before choosing a selector. Anchor queries to a
  stable, scoped container and prefer accessible semantics or stable
  attributes. Handle missing and ambiguous matches.
- Account for single-page navigation and repeated renders. Make mounts
  idempotent and remove observers, listeners, and UI on invalidation.
- Own only the nodes you insert. Keep React, Emotion, and overlays inside
  the extension's Shadow DOM.
- Run the relevant tests and a browser check against the intended page when
  changing a DOM integration. Record the browser, target page, and scenario
  verified.
