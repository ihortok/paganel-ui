import fs from "node:fs";
import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, type Plugin } from "vite";

const root = import.meta.dirname;
const partialsDir = path.join(root, "partials");

/* Root-level *.html are pages; partials/*.html are fragments and stay out of the build.
   Derived rather than hardcoded, so adding a page needs no config edit — Vite only
   auto-discovers index.html, and a page missing here would work in dev then silently
   vanish from the build. */
const pages = Object.fromEntries(
  fs
    .readdirSync(root)
    .filter((f) => f.endsWith(".html"))
    .map((f) => [path.basename(f, ".html"), path.join(root, f)]),
);

const INCLUDE_RE = /^([ \t]*)<!--\s*@include\s+(\S+?)\s*-->[ \t]*$/gm;

/*
 * Inlines `<!-- @include partials/x.html -->` at dev-serve and build time, then marks the
 * active sidebar link from `data-page="<id>"` on the page's <html> element.
 *
 * This happens at build time rather than at runtime on purpose: the demo doubles as the
 * reference for what a consumer should paste, so every page has to end up as plain static
 * HTML with the chrome and the active state already in it.
 */
function htmlInclude(): Plugin {
  const expand = (html: string, from: string, depth = 0): string => {
    if (depth > 5) throw new Error(`@include nested too deeply in ${from}`);
    return html.replace(INCLUDE_RE, (_match, indent: string, rel: string) => {
      const file = path.resolve(root, rel);
      if (!file.startsWith(root) || !fs.existsSync(file)) {
        throw new Error(`@include: cannot resolve "${rel}" (from ${from})`);
      }
      const body = expand(fs.readFileSync(file, "utf8").trimEnd(), file, depth + 1);
      // Re-indent to the directive's own depth, skipping blank lines so they don't
      // become trailing whitespace in the emitted page.
      return body.replace(/^(?=.)/gm, indent);
    });
  };

  const markActive = (html: string): string => {
    const page = /<html[^>]*\sdata-page="([^"]+)"/.exec(html)?.[1];
    if (!page) return html;
    return html.replace(
      new RegExp(`(<a\\b[^>]*\\bdata-page="${page}"[^>]*)(>)`),
      (_match, open: string, close: string) =>
        `${open.replace(
          /class="sidebar-link/,
          'class="sidebar-link sidebar-link-active',
        )} aria-current="page"${close}`,
    );
  };

  return {
    name: "paganel-demo-html-include",
    // "pre" so the injected markup still goes through Vite's own asset-URL rewriting.
    transformIndexHtml: {
      order: "pre",
      handler: (html, ctx) => markActive(expand(html, ctx.filename)),
    },
    // Editing a partial changes no module in the graph, so dev would otherwise keep
    // serving stale chrome until a manual reload.
    configureServer(server) {
      server.watcher.add(partialsDir);
      server.watcher.on("change", (file) => {
        if (file.startsWith(partialsDir)) server.hot.send({ type: "full-reload" });
      });
    },
  };
}

export default defineConfig({
  plugins: [htmlInclude(), tailwindcss()],
  // rolldownOptions, not rollupOptions: Vite 8 bundles with Rolldown and deprecated the
  // old name. Requires Vite >= 8, which demo/package.json pins.
  build: { rolldownOptions: { input: pages } },
});
