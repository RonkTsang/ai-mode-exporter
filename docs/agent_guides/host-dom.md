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

## Adding an AI Mode reply component

1. Implement an `AnswerComponentHandler` in
   `src/entrypoints/ai-mode-continue/answer/`, using `image-gallery.ts` or
   `map.ts` as a reference. Match the component root and serialize the fields
   that belong in the transcript. Reuse `markdown.ts` for URL and image
   serialization, and `context.serializeChildren()` for selected content.
2. Register it in `answerComponentHandlers` in `answer/serialize.ts`. Hidden
   nodes are skipped first. The first matching handler owns its subtree and
   runs before the generic UI filter. Return an empty string to omit the
   component when its content cannot be read.
3. Add a fixture to `dom.test.ts` that exercises `readAiModeConversation`.
   Include surrounding prose and check the output order, expected fallback,
   and any controls that should be omitted.
