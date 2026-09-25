/**
 * Theme consistency guard.
 *
 * styles/theme/tokens.css is the single source of truth for colour, and
 * components/ui/button.tsx is the single source of truth for buttons. This
 * suite fails when a page routes around either one, so drift is caught in CI
 * instead of in a screenshot:
 *
 *   - no hue in the brand accent ramp
 *   - no raw Tailwind palette class, hex or rgb() literal in UI code
 *   - no inline `style` prop
 *   - no raw <button> outside components/ui
 *   - no colour / size / radius / type overrides on a <Button> — placement only
 *   - no link hand-painted as a button (use <Button asChild>)
 *   - lib/theme/palette.ts (for email and canvas, where CSS variables cannot
 *     reach) stays identical to the tokens it mirrors
 *
 *   node --import ./tests/security/alias-hook.mjs --test tests/design/
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (p.endsWith(".tsx")) out.push(p);
  }
  return out;
}

const uiFiles = [...walk(join(ROOT, "app")), ...walk(join(ROOT, "components"))]
  .map((p) => ({ path: relative(ROOT, p), src: readFileSync(p, "utf8") }))
  // Comments may name the things they replaced. A comment opener must follow
  // whitespace or `{`, so string contents like accept="image/*" or a URL's
  // "https://" are not mistaken for one and swallow the code after them.
  .map((f) => ({
    ...f,
    code: f.src.replace(/(^|[\s{])\/\*[\s\S]*?\*\//g, "$1").replace(/(^|\s)\/\/.*$/gm, "$1"),
  }));

const lineOf = (src: string, index: number) => src.slice(0, index).split("\n").length;

function report(hits: string[], what: string) {
  assert.equal(hits.length, 0, `${hits.length} ${what}:\n  ${hits.join("\n  ")}`);
}

/* ─── Tokens ────────────────────────────────────────────────────────────── */

const tokensCss = readFileSync(join(ROOT, "styles/theme/tokens.css"), "utf8");
const tokenTriplets = [...tokensCss.matchAll(/--([\w-]+):\s*(\d+) (\d+) (\d+);/g)].map((m) => ({
  name: m[1],
  rgb: [Number(m[2]), Number(m[3]), Number(m[4])] as [number, number, number],
}));

function hueSat([r, g, b]: [number, number, number]) {
  const [R, G, B] = [r / 255, g / 255, b / 255];
  const max = Math.max(R, G, B), min = Math.min(R, G, B), d = max - min;
  if (d === 0) return { hue: 0, sat: 0 };
  const l = (max + min) / 2;
  const sat = d / (1 - Math.abs(2 * l - 1));
  let hue = max === R ? ((G - B) / d) % 6 : max === G ? (B - R) / d + 2 : (R - G) / d + 4;
  hue = (hue * 60 + 360) % 360;
  return { hue, sat };
}

describe("tokens", () => {
  it("keep the brand accent ramp monochrome", () => {
    const hits = tokenTriplets
      .filter(({ name, rgb }) => name.startsWith("accent-") && hueSat(rgb).sat > 0.05)
      .map(({ name, rgb }) => `--${name}: ${rgb.join(" ")} (hue ${Math.round(hueSat(rgb).hue)}°)`);
    report(hits, "colored brand accents in styles/theme/tokens.css");
  });

  it("are mirrored exactly by lib/theme/palette.ts", () => {
    const palette = readFileSync(join(ROOT, "lib/theme/palette.ts"), "utf8");
    const tokens = new Map(tokenTriplets.map((t) => [t.name, t.rgb]));
    const entries = [...palette.matchAll(/\/\/ --([\w-]+)\n\s*[\w]+: "#([0-9a-f]{6})"/g)];
    assert.ok(entries.length > 0, "palette.ts has no token-annotated entries");
    const hits = entries
      .map(([, name, hex]) => {
        const rgb = tokens.get(name);
        if (!rgb) return `palette.ts names --${name}, which tokens.css does not define`;
        const want = rgb.map((c) => c.toString(16).padStart(2, "0")).join("");
        return want === hex ? null : `--${name}: palette.ts #${hex} ≠ tokens.css #${want}`;
      })
      .filter(Boolean) as string[];
    report(hits, "palette.ts entries out of sync with tokens.css");
  });
});

/* ─── Colour in UI code ─────────────────────────────────────────────────── */

const HUES =
  "slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose";
const RAW_PALETTE = new RegExp(`\\b[a-z-]*-(?:${HUES})-(?:50|[1-9]00|950)\\b`, "g");
const REMOVED_TOKENS = /\b[a-z:-]*-(?:info|profile|social)(?:-[\w-]+)?\b/g;
const LITERAL_COLOUR = /#[0-9a-fA-F]{3,8}\b|\brgba?\(\s*\d|\bhsla?\(\s*\d/g;

describe("UI code", () => {
  it("uses semantic tokens, never raw Tailwind palette colours", () => {
    const hits = uiFiles.flatMap((f) =>
      [...f.code.matchAll(RAW_PALETTE)].map((m) => `${f.path}:${lineOf(f.code, m.index!)}  ${m[0]}`)
    );
    report(hits, "raw palette classes");
  });

  it("uses no removed blue/purple token (info, profile, social)", () => {
    const hits = uiFiles.flatMap((f) =>
      [...f.code.matchAll(REMOVED_TOKENS)].map((m) => `${f.path}:${lineOf(f.code, m.index!)}  ${m[0]}`)
    );
    report(hits, "removed-token classes");
  });

  it("carries no hex / rgb() / hsl() colour literal", () => {
    const hits = uiFiles.flatMap((f) =>
      [...f.code.matchAll(LITERAL_COLOUR)]
        // `rgb(var(--token)/…)` inside an arbitrary value still resolves to a token.
        .filter((m) => !/^rgba?\(\s*var/.test(f.code.slice(m.index!, m.index! + 12)))
        .map((m) => `${f.path}:${lineOf(f.code, m.index!)}  ${m[0]}`)
    );
    report(hits, "colour literals");
  });

  it("has no inline style props", () => {
    const hits = uiFiles.flatMap((f) =>
      [...f.code.matchAll(/\sstyle=\{/g)].map((m) => `${f.path}:${lineOf(f.code, m.index!)}`)
    );
    report(hits, "inline style props");
  });
});

/* ─── Buttons ───────────────────────────────────────────────────────────── */

// Classes that belong to the Button's variant/size/shape, not to a call site.
const LOOK = /(?:^|\s)(?:[a-z0-9-]+:)*(?:bg|from|via|to|text|border|rounded|h|min-h|px|py|p|pt|pb|pl|pr|font|shadow|ring|leading|tracking)(?:-[^\s]+)?(?=\s|$)/;
// Placement-only classes that happen to share a prefix above.
const PLACEMENT_OK = /^(?:[a-z0-9-]+:)*(?:text-left|text-center|text-right)$/;

function classNameOf(attrs: string): string {
  const m =
    attrs.match(/className="([^"]*)"/) ??
    attrs.match(/className=\{\s*`([^`]*)`\s*\}/) ??
    attrs.match(/className=\{\s*cn\(([\s\S]*?)\)\s*\}/);
  return m ? m[1].replace(/\$\{[\s\S]*?\}/g, " ").replace(/["'`,]/g, " ") : "";
}

/** Walk to the end of a JSX opening tag, skipping `>` inside `{…}`. */
function openingTag(code: string, start: number): string {
  let depth = 0;
  for (let i = start; i < code.length; i++) {
    const c = code[i];
    if (c === "{") depth++;
    else if (c === "}") depth--;
    else if (c === ">" && depth === 0) return code.slice(start, i);
  }
  return code.slice(start);
}

describe("buttons", () => {
  it("never render a raw <button> outside components/ui", () => {
    const hits = uiFiles
      .filter((f) => !f.path.startsWith("components/ui/"))
      .flatMap((f) => [...f.code.matchAll(/<button\b/g)].map((m) => `${f.path}:${lineOf(f.code, m.index!)}`));
    report(hits, "raw <button> elements — use <Button>");
  });

  it("take placement classes only; the look comes from variant / size / shape", () => {
    const hits: string[] = [];
    for (const f of uiFiles) {
      if (f.path.startsWith("components/ui/")) continue;
      for (const m of f.code.matchAll(/<Button\b/g)) {
        const tag = openingTag(f.code, m.index!);
        if (/\sunstyled\b/.test(tag)) continue;
        const bad = classNameOf(tag)
          .split(/\s+/)
          .filter((c) => c && LOOK.test(` ${c} `) && !PLACEMENT_OK.test(c));
        if (bad.length) hits.push(`${f.path}:${lineOf(f.code, m.index!)}  ${bad.join(" ")}`);
      }
    }
    report(hits, "Buttons repainted at the call site");
  });

  it("are not re-drawn on links — a link that looks like a button is <Button asChild>", () => {
    const hits: string[] = [];
    for (const f of uiFiles) {
      if (f.path.startsWith("components/ui/")) continue;
      for (const m of f.code.matchAll(/<(?:Link|a)\b/g)) {
        const cls = classNameOf(openingTag(f.code, m.index!));
        const filled = /(?:^|\s)bg-(?!transparent|clip)/.test(cls);
        const padded = /(?:^|\s)(?:px-|h-1[0-2]\b|py-[2-4]\b)/.test(cls);
        const rounded = /(?:^|\s)rounded/.test(cls);
        if (filled && padded && rounded) hits.push(`${f.path}:${lineOf(f.code, m.index!)}`);
      }
    }
    report(hits, "links hand-styled as buttons");
  });
});
