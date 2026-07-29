# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

`paganel-ui` is a design-system library built on Tailwind CSS v4: component classes (`.card`, `.btn`, `.badge`, `.alert`, `.dropdown`) authored with `@apply`, plus vanilla-JS behaviors (currently: dropdown open/close) driven by HTML `data-*` attributes. It's framework-agnostic — meant to be consumed by Rails (via a Node-based Tailwind pipeline like `cssbundling-rails`), a plain HTML page, or any JS-toolchain frontend. Distribution is npm-only — no CDN/no-Node fallback path.

## Commands

```sh
npm install              # installs root + demo workspace (npm workspaces)
npm run build            # tsup -> dist/{index.js,index.cjs,index.d.ts,index.global.js}
npm run dev              # tsup --watch
npm run typecheck        # tsc --noEmit
npm test                 # vitest run (jsdom)
npm run test:watch       # vitest (watch mode)
npx vitest run tests/disclosure.test.ts        # single test file
npx vitest run tests/disclosure.test.ts -t "closes on Escape"   # single test by name
```

Demo app (npm workspace consuming the root package, for visual/manual verification):
```sh
cd demo
npm run dev      # Vite dev server with @tailwindcss/vite
npm run build    # production build; compiled CSS lands in demo/dist
```

Resolver sanity check (mirrors what `cssbundling-rails` actually invokes — worth re-running after any change to `css/` or the `exports` map, since Vite's resolver can be more lenient than the plain CLI):
```sh
cd demo && npx @tailwindcss/cli -i src/tailwind.css -o /tmp/check.css
```

## Architecture

The package is two independent halves that are built and shipped completely differently:

**CSS (`css/`)** is published as unbundled **source**, untouched by any build step. This is deliberate: Tailwind v4 must compile `@theme`/`@apply` inside the *consumer's own* Tailwind build (it can't be pre-resolved without knowing the consumer's project). `css/index.css` just chains `@import`s of `tokens.css` (the `@theme` block: brand/neutral/success/warning/danger scales, `--radius-ds-*`, `--shadow-ds-*`) and each `components/*.css` partial. A consumer must `@import "tailwindcss"` **before** `@import "paganel-ui/css"` — that first import establishes the `theme, base, components, utilities` cascade layer order that this package's `@layer components` rules depend on.

No `@source` directives are needed anywhere: every class is hardcoded via `@apply` directly in the shipped CSS rather than discovered by scanning template strings, so Tailwind's content-detection (which doesn't scan `node_modules` anyway) is irrelevant here.

Component CSS follows a **compositional** pattern — a base class plus independent variant/size classes combined in markup (`class="btn btn-primary btn-md"`), never one custom class `@apply`-ing another custom class. Chaining `@apply` across custom (non-utility) classes is unreliable in Tailwind v4; this is a hard rule for any new component, not a style preference.

The package is **icon-agnostic and ships no icon set**. `css/components/icon.css` defines `.icon`/`.icon-sm`/`.icon-lg` — a fixed-size *slot* a consumer combines in markup with whatever icon library they chose (an icon-font `<i>`, an inline `<svg>`, a text glyph). The hard rule: nothing in `css/` may reference an icon library, and no component may depend on an icon being present — every component must render correctly with an icon, without one, and with icons from any source. (`.icon` deliberately uses `inline-block` rather than `inline-flex`; the cascade reason is in the file.)

`demo/` uses **inline SVG** (Heroicons v2, MIT © Tailwind Labs) for every icon, and carries no icon dependency of any kind — no npm package, no webfont, no external request. That is deliberate: the demo doubles as the reference for what a consumer should do, and inline SVG is the option that needs no asset-pipeline wiring on their side. If an icon library is ever added to `demo/`, note the workspace hoisting footgun it creates: a root `npm install` hoists it into the **root** `node_modules/`, so a stray `@import` of it inside `css/` would resolve locally, in CI, *and* in the `npx @tailwindcss/cli` sanity check below — while breaking every real consumer.

`demo/` is a static **multi-page** site, not an SPA: one real HTML file per component (`card.html`, `button.html`, `form.html`, …) navigated by ordinary `href` links with full page loads, plus a slim `index.html` that is only an intro and a grid of links. The shared chrome lives in `demo/partials/sidebar.html` and `demo/partials/header.html`, inlined at dev/build time by the local `htmlInclude()` `transformIndexHtml` plugin in `demo/vite.config.ts`; the active sidebar link and its `aria-current` are derived there from `data-page="<id>"` on each page's `<html>` element. That inlining is deliberately build-time rather than runtime: the demo doubles as the reference for what a consumer should paste, so every page has to end up as plain static HTML. Adding a component page means two edits — the page file, and an `<a data-page="…">` entry in `partials/sidebar.html`. The `build.rollupOptions.input` map is derived by `readdirSync` of the demo root (Vite only auto-discovers `index.html`, and a page missing from that map would work under `npm run dev` then silently vanish from `npm run build` — CI never builds the demo). Two markup invariants per page: the content wrapper must be `<div class="pt-16 lg:ml-60">`, or the fixed `.header`/`.sidebar` overlap it; and element `id`s used by behaviors must be unique page-wide — the header partial ships `id="user-menu"` on every page, and `disclosure.ts` resolves panels through `getElementById`/`[aria-controls]`, so a duplicate silently wires a trigger to the wrong panel.

**JS (`src/`)** is TypeScript, bundled by `tsup.config.ts` in two passes: ESM+CJS+`.d.ts` (`clean: true`) and a minified IIFE global (`clean: false`, so it doesn't wipe the first pass). Behaviors are built on a single delegated listener architecture:
- `src/core/delegate.ts` — `onDelegate()`, the generic reusable primitive (one listener, `closest()` matching, returns a disposer).
- `src/behaviors/disclosure.ts` — the generic open/close engine. **All state lives in DOM attributes** (`aria-expanded`, `hidden`), never in JS-side instance maps — this is what makes it Turbo Drive/Hotwire-safe: swapped-in markup after a page navigation is indistinguishable from initial markup, so there's no "instance" to lose and no re-init hook needed. It installs exactly one `click`/`keydown`/`focusout` listener on `document` per registered behavior `name`, regardless of how many matching elements exist or get swapped in.
- `src/behaviors/dropdown.ts` registers `"dropdown"` against the disclosure engine — the pattern to follow when adding a new disclosure-style component (accordion, modal, etc.): register a new `name` so it responds to its own `data-ds-toggle="<name>"`/`data-ds-panel="<name>"` attributes.
- `src/core/init.ts` — `initPaganelUI()` is idempotent via a flag stored **on `document` itself** (not module-level state), so it stays correct even if bundled into multiple chunks on one page.
- `src/index.ts` auto-runs `initPaganelUI()` on import, guarded by `typeof document !== "undefined"` for SSR/non-DOM safety.

Two invariants enforced in `package.json` that must not regress:
- `sideEffects: true` (or omitted) — if set to `false`, tree-shaking bundlers are entitled to delete `import "paganel-ui"` since nothing is destructured from it, silently breaking auto-init.
- The `./css` and `./css/*` entries in `exports` must stay **plain strings**, never conditional `{import, require}` objects — Tailwind v4's CSS `@import` resolver rejects conditional exports for CSS subpaths (this mirrors how the `tailwindcss` package itself exposes `./theme.css` etc).

`tailwindcss` is a devDependency only (used by the demo and CLI check) — nothing in `src/` ever imports it; it's referenced purely via CSS `@import`, resolved by the consumer's own toolchain.

`demo/` depends on the root package via `"paganel-ui": "file:.."`, not `"*"` — npm does not auto-link the root package into a nested workspace member by name, only `file:` resolves reliably here.

## Testing

Vitest + jsdom (`vitest.config.ts`, tests in `tests/`). The key test is `tests/turbo-swap.test.ts`: it replaces `document.body.innerHTML` mid-test (simulating a Turbo Drive swap) with no re-init call, confirms the new markup still works, and spies on `document.addEventListener` to prove exactly one `click`/`keydown`/`focusout` listener exists regardless of how many times `initPaganelUI()` is called or how many dropdown instances render/swap. Any change to `src/core/init.ts` or `src/behaviors/disclosure.ts` should keep this test meaningful, not just passing.
