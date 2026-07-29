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

## Icons

**This package ships no icon set and has no icon dependency.** Installing `paganel-ui` will not pull an icon library into your project, and no component requires one to render correctly — every component looks right with an icon, without one, and with icons from any source.

What it does ship is `.icon`, a neutral fixed-size slot you combine in markup with whatever your app uses:

```html
<!-- an inline SVG (Heroicons, Lucide, hand-drawn — no dependency at all) -->
<svg class="icon" viewBox="0 0 24 24" fill="none" stroke-width="1.5" stroke="currentColor" aria-hidden="true">…</svg>

<!-- an icon font's own element -->
<i class="icon <your-icon-classes>" aria-hidden="true"></i>

<!-- or just a text glyph -->
<span class="icon" aria-hidden="true">📚</span>
```

The common box is the point. Left alone, those three size themselves by completely different rules — an icon font sizes in `em` and so drifts with the surrounding font-size, a bare inline `<svg>` has no usable intrinsic size at all, and a text glyph is whatever the font gives. `.icon` puts all of them in one predictable box, so they match each other and align in a column. `.icon-sm` and `.icon-lg` are the modifiers — compose them, e.g. `class="icon icon-sm"`.

`.btn`, `.sidebar-link`, `.dropdown-item` and `.alert` already lay out an icon alongside their label with the right spacing, so no extra markup is needed:

```html
<button class="btn btn-primary btn-md">
  <svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke-width="1.5" stroke="currentColor" aria-hidden="true">
    <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
  Add book
</button>
```

Inline SVG is what the demo uses throughout, and it's the lightest option: no install, no extra network request, nothing to wire into your asset pipeline, and only the icons you actually paste.

### Using an icon font instead

If you'd rather pull in a full icon font, install it into **your own** project — that way you pick the library and version, and your own asset pipeline handles its font files:

```css
@import "tailwindcss";
@import "<your-icon-font>/css/all.css" layer(components);
@import "paganel-ui/css";
```

Two details in that snippet matter:

- **`layer(components)`** — icon-font CSS is normally unlayered, which places it *above* every Tailwind utility in the cascade. Wrapping it in a layer puts it back underneath them.
- **Import it before `paganel-ui/css`** — same layer, same specificity, so the later import wins, letting `.icon` override the icon set's own `line-height`/sizing.

> **Rails note:** icon fonts ship `.woff2` files referenced by relative `url()`. Tailwind rewrites those paths but never *copies* the files, so under `cssbundling-rails` you will need to make the webfont directory reachable by Propshaft/Sprockets (copy it into `app/assets/`, or add it to `config.assets.paths`). Inline SVG icons avoid this entirely.

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
| `.card-meta` | Muted line under `.card-header` — a byline, a date, a read time. |
| `.card-media` | Wraps an `<img>`; bleeds it to the card's edges. Combine with `.card`. |
| `.card-horizontal`, `.card-horizontal-media` | Image-on-the-side layout. Combine `.card-horizontal` with `.card`. |
| `.card-book-cover` | Portrait 2:3 cover image slot. Combine with `.card-horizontal`; pair with `.card-meta` for the byline. |
| `.btn` + `.btn-{primary,secondary,danger}` + `.btn-{sm,md,lg}` | Compose in markup, e.g. `class="btn btn-primary btn-md"` |
| `.badge` + `.badge-{brand,success,warning,danger}` | |
| `.alert` + `.alert-{info,success,warning,danger}` | |
| `.dropdown` / `.dropdown-menu` / `.dropdown-item` | See below for the JS wiring |
| `.header`, `.header-brand`, `.header-nav`, `.header-actions` | Top app-bar layout. `fixed`, `h-16`, `lg:left-60` — see the layout note below |
| `.sidebar`, `.sidebar-section-title`, `.sidebar-link` (+ `.sidebar-link-active`), `.sidebar-footer` | Vertical nav layout. `fixed`, `w-60` — see the layout note below |
| `.sidebar-drawer`, `.sidebar-backdrop`, `.sidebar-toggle` | Off-canvas mobile drawer for `.sidebar` — see below for the JS wiring |
| `.field`, `.label`, `.input`, `.textarea`, `.select`, `.checkbox`, `.checkbox-label`, `.hint`, `.error-message` | Form controls; add `.input-error`/`.textarea-error`/`.select-error` for the invalid state |
| `.avatar` | Circular `<img>`, e.g. for a user menu trigger |
| `.comment`, `.comment-list`, `.comment-author`, `.comment-meta`, `.comment-body` | Comment thread. Bring your own avatar; give it `shrink-0` and the content side `min-w-0 flex-1` |
| `.icon` + `.icon-{sm,lg}` | Neutral fixed-size icon slot — bring your own icon set, see below |

### Header + sidebar layout

Both are `position: fixed`, so they don't take part in normal flow and page content has to clear them itself. `.header` is `h-16` and `.sidebar` is `w-60` (and the header is `lg:left-60` so it starts where the sidebar ends), which makes the wrapper:

```html
<div class="pt-16 lg:ml-60">
  <main>…</main>
</div>
```

Neither component ships responsive behaviour of its own — the demo's `hidden lg:flex` on `.header-nav` is applied in markup, so you decide what collapses and when.

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

### Drawer (off-canvas mobile sidebar)

```html
<button class="btn btn-primary btn-md sidebar-toggle"
        data-ds-toggle="drawer" aria-controls="sidebar-drawer" aria-expanded="false"
        aria-label="Toggle sidebar">
  <svg class="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
  </svg>
</button>

<div id="sidebar-drawer" class="sidebar-drawer" data-ds-panel="drawer">
  <div class="sidebar-backdrop" data-ds-dismiss="drawer"></div>
  <aside class="sidebar">
    <a class="sidebar-link" href="/" data-ds-dismiss="drawer">Dashboard</a>
    <!-- ... -->
  </aside>
</div>
```

Shares the same click/outside-click/<kbd>Escape</kbd>/`data-ds-dismiss` engine as the dropdown above (`.sidebar` is always visible at the `lg` breakpoint and up, no toggle needed there). Unlike the dropdown, it doesn't toggle the `hidden` attribute — Tailwind's Preflight makes `[hidden]` `display: none !important`, which can't be animated — so it drives visibility via a `data-state="open"/"closed"` attribute plus CSS `transform`/`visibility`, letting it slide in/out smoothly.

## Local development

```sh
npm install          # installs root + demo workspace
npm run build        # tsup -> dist/{index.js,index.cjs,index.d.ts,index.global.js}
npm run typecheck
npm test             # vitest (jsdom) — delegation, dropdown/drawer behavior, Turbo-swap resilience
```

`demo/` is an npm workspace that consumes the root package like a real installer would (`"paganel-ui": "file:.."`), for visually checking the compiled CSS and the dropdown behavior in a browser:

```sh
cd demo
npm run dev     # Vite dev server with @tailwindcss/vite
npm run build   # production build, compiled CSS in demo/dist
```

The demo is a multi-page static site: one page per component (`demo/card.html`, `demo/button.html`, …) reachable from the sidebar, with `demo/index.html` as a slim overview. Shared header/sidebar markup lives in `demo/partials/` and is inlined at build time by a small local Vite plugin, so every page ends up as plain HTML you can view-source and copy.

## Extending

New components: add a `css/components/<name>.css` partial (base class + independent variant/size classes — avoid `@apply`-ing one custom class from another) and import it from `css/index.css`.

New JS behaviors: build on `onDelegate()` (generic document-level delegation) or, for open/close-style widgets, follow the `src/behaviors/disclosure.ts` pattern — register a new `name` so it responds to its own `data-ds-toggle="<name>"`/`data-ds-panel="<name>"` attributes, sharing the same click/Escape/outside-click/focusout engine.
