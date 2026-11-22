# Content Services

Long-lived site features run on a unified `ISOLATED`-world host (`startContentHost`) so Chrome extension installs and updates hot-unload old instances and mount new ones without requiring a page refresh.

## Architecture

- **Host registry (`src/common/contentHosts.ts`)**: Single source of truth for reinjectable site hosts (`id`, `scriptFile`, `matches`). Chrome `host_permissions`, background reinjection, and content entrypoints read from here.
- **Chrome reinjection (`src/entrypoints/background/reinject.ts`)**: On `runtime.onInstalled` (`install` / `update`), Chrome queries tabs matching each registered host and injects `host.scriptFile` via `browser.scripting.executeScript`. Firefox auto-reinjects static content scripts on update, so Chrome-only reinjection stays gated behind `import.meta.env.CHROME`.
- **Site host (`src/content-runtime/host.ts`)**: Generates an `instanceId`, dispatches `ampk:content-host-handover` for the logical `hostId` to dispose any running instance synchronously, purges stale `[data-ampk-host]` DOM nodes, runs a single `MutationObserver` + `wxt:locationchange` reconciliation loop, routes `browser.runtime.onMessage` by `message.type`, and checks `ctx.isInvalid` on `focus` / `visibilitychange`.
- **Service scope (`src/content-runtime/scope.tsx`)**: Owns every side effect for one mounted `ContentService` and disposes them in reverse order on unmount, handover, or context invalidation.

## Where new code goes

- **New feature on an existing site host (e.g. Google Search AI Mode)**: Implement a `ContentService<AiModeSnapshot>` and register it in `src/entrypoints/ai-mode.content.tsx`.
- **New long-lived site host**: Add a new entry to `reinjectableContentHosts` in `src/common/contentHosts.ts` and a matching `<site>.content.tsx` entrypoint calling `startContentHost`. Run `pnpm exec wxt prepare` so `ScriptPublicPath` updates.
- **One-off page scripts** (such as `src/entrypoints/agent-draft.content.tsx`): Keep as standalone entrypoints outside `reinjectableContentHosts` so we do not request unnecessary `host_permissions`.

## Adding a `ContentService`

```tsx
import type { ContentService } from '@/content-runtime'
import type { AiModeSnapshot } from '../ai-mode/snapshot'

export function createExampleService(): ContentService<AiModeSnapshot> {
  return {
    id: 'example-feature',
    shouldMount: (snapshot) => snapshot.isAiMode && snapshot.main !== null,
    mount(scope, snapshot) {
      const ui = scope.mountShadowUi({
        id: 'example',
        attach: (host) => snapshot.main?.prepend(host),
        render: () => <ExampleWidget />,
      })

      scope.onMessage('example:ping', () => Boolean(ui.host.isConnected))
    },
    update(snapshot, scope) {
      // Optional lightweight sync while remaining mounted.
    },
  }
}
```

## Lifecycle rules

- **Allocate through `scope` only**: Use `scope.addEventListener`, `scope.observeMutation`, `scope.setTimeout`, `scope.setInterval`, `scope.requestAnimationFrame`, `scope.onMessage`, `scope.mountShadowUi`, and `scope.onDispose`. Do not register bare global listeners, timers, `browser.runtime.onMessage` listeners, or `createRoot` calls inside a service.
- **Keep `hostId` stable**: Handover matches `options.id` (e.g. `'ai-mode'`), not the entrypoint filename, so refactors still evict older running instances.
- **No MV3 keep-alive Ports**: Do not use `browser.runtime.connect()` `onDisconnect` to detect extension updates or uninstalls; MV3 Service Worker idle suspension drops Ports during normal browsing.
- **Reserved `MAIN`-world bridge (`MainBridgeProbe`)**: When future features need `fetch` or `XHR` interception, keep the `MAIN` script a thin, stateless proxy versioned by an explicit revision. `startContentHost` accepts an optional `mainBridge` probe (`status(): 'ready' | 'unavailable' | 'outdated'`, `mute?()`). Outdated bridges are muted on startup and invalidation; `MAIN`-dependent services check `scope.getMainBridgeStatus()` and prompt for a page refresh only when `'unavailable'` or `'outdated'`, leaving DOM-only services hot-reloaded.
