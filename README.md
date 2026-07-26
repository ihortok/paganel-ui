# Paganel UI

A small design system built on top of Tailwind CSS v4: component classes (`.card`, `.btn`, `.badge`, `.alert`, `.dropdown`) authored with `@apply`, plus a handful of vanilla-JS behaviors (dropdown open/close) driven entirely by HTML `data-*` attributes. Framework-agnostic — works in Rails, a plain HTML page, or any JS-toolchain frontend.

> Built with the help of [Claude Code](https://claude.com/claude-code).

## Requirements

- Tailwind CSS v4, built by *your own* project (this package ships CSS **source**, not a precompiled stylesheet — your Tailwind build compiles it, the same way it compiles Tailwind's own `theme.css`/`utilities.css`).
- A Node/npm toolchain able to resolve `node_modules` (e.g. `cssbundling-rails` + `esbuild`/`jsbundling-rails` for Rails, or any bundler like Vite/webpack for other projects).

## Install

```sh
npm install paganel-ui
```

## CSS setup

In your app's Tailwind entry stylesheet, `@import` this package **after** `@import "tailwindcss"` — Tailwind establishes its `theme, base, components, utilities` cascade layer order from that first import, and this package's `@layer components` rules rely on it:

```css
@import "tailwindcss";
@import "paganel-ui/css";
```

That single import pulls in the design tokens (`css/tokens.css`) and every component partial (`css/components/*.css`). No `@source` directive is needed — every class is hardcoded via `@apply` inside the shipped CSS, not discovered by scanning templates.

## JS setup

```js
import "paganel-ui";
```

Importing the package auto-initializes all behaviors (currently: dropdown). It is:
- **Idempotent** — safe to import more than once (e.g. from separate bundles on the same page).
- **Turbo/Hotwire-safe** — behaviors use a single delegated listener on `document` and keep all state in DOM attributes (`aria-expanded`, `hidden`), so swapped-in markup after a Turbo Drive navigation works immediately with no re-init call.
- **SSR-safe** — the auto-init is a no-op outside a browser (`typeof document === "undefined"`).

For advanced/manual control, `initPaganelUI()` and the generic delegation helper `onDelegate()` are also exported:

```ts
import { initPaganelUI, onDelegate } from "paganel-ui";
```

A minified browser global build is also available for script-tag-only setups (no bundler): `paganel-ui/browser` (exposes `window.PaganelUI`).

## Rails integration

Using `cssbundling-rails` (or any Node-based Tailwind pipeline):

```sh
npm install paganel-ui   # or: yarn add paganel-ui
```

```css
/* app/assets/stylesheets/application.tailwind.css */
@import "tailwindcss";
@import "paganel-ui/css";
```

```js
// app/javascript/application.js
import "paganel-ui"; // auto-initializes; survives Turbo Drive swaps, no turbo:load hook needed
```

## Components

| Class | Notes |
|---|---|
| `.card`, `.card-header`, `.card-body`, `.card-footer` | |
| `.card-media` | Wraps an `<img>`; bleeds it to the card's edges. Combine with `.card`. |
| `.card-horizontal`, `.card-horizontal-media` | Image-on-the-side layout. Combine `.card-horizontal` with `.card`. |
| `.btn` + `.btn-{primary,secondary,danger}` + `.btn-{sm,md,lg}` | Compose in markup, e.g. `class="btn btn-primary btn-md"` |
| `.badge` + `.badge-{brand,success,warning,danger}` | |
| `.alert` + `.alert-{info,success,warning,danger}` | |
| `.dropdown` / `.dropdown-menu` / `.dropdown-item` | See below for the JS wiring |
| `.header`, `.header-brand`, `.header-nav`, `.header-actions` | Top app-bar layout |
| `.sidebar`, `.sidebar-section-title`, `.sidebar-link` (+ `.sidebar-link-active`) | Vertical nav layout |
| `.field`, `.label`, `.input`, `.textarea`, `.select`, `.checkbox`, `.checkbox-label`, `.hint`, `.error-message` | Form controls; add `.input-error`/`.textarea-error`/`.select-error` for the invalid state |

### Dropdown

```html
<div class="dropdown">
  <button class="btn btn-secondary btn-md"
          data-ds-toggle="dropdown" aria-controls="my-menu" aria-expanded="false">
    Open menu
  </button>
  <div id="my-menu" class="dropdown-menu" data-ds-panel="dropdown" hidden>
    <button class="dropdown-item" data-ds-dismiss="dropdown">Profile</button>
    <button class="dropdown-item" data-ds-dismiss="dropdown">Sign out</button>
  </div>
</div>
```

Opens/closes on trigger click, closes on outside click, closes on <kbd>Escape</kbd> (returning focus to the trigger), and closes on `data-ds-dismiss` clicks inside the panel.

## Local development

```sh
npm install          # installs root + demo workspace
npm run build        # tsup -> dist/{index.js,index.cjs,index.d.ts,index.global.js}
npm run typecheck
npm test             # vitest (jsdom) — delegation, dropdown behavior, Turbo-swap resilience
```

`demo/` is an npm workspace that consumes the root package like a real installer would (`"paganel-ui": "file:.."`), for visually checking the compiled CSS and the dropdown behavior in a browser:

```sh
cd demo
npm run dev     # Vite dev server with @tailwindcss/vite
npm run build   # production build, compiled CSS in demo/dist
```

## Extending

New components: add a `css/components/<name>.css` partial (base class + independent variant/size classes — avoid `@apply`-ing one custom class from another) and import it from `css/index.css`.

New JS behaviors: build on `onDelegate()` (generic document-level delegation) or, for open/close-style widgets, follow the `src/behaviors/disclosure.ts` pattern — register a new `name` so it responds to its own `data-ds-toggle="<name>"`/`data-ds-panel="<name>"` attributes, sharing the same click/Escape/outside-click/focusout engine.
