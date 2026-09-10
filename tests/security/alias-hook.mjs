/**
 * Test-only module resolver.
 *
 * Maps the project's "@/..." path alias (defined in tsconfig, understood by
 * Next's bundler) onto real files, so application modules can be exercised by
 * the Node test runner exactly as written — no relative-import workarounds in
 * production source, and no extra dependency.
 *
 *   node --import ./tests/security/alias-hook.mjs --test tests/security/
 */
import { register } from "node:module";
import { pathToFileURL } from "node:url";

register(
  "data:text/javascript," +
    encodeURIComponent(`
      import { existsSync } from 'node:fs';
      import { fileURLToPath, pathToFileURL } from 'node:url';
      const root = ${JSON.stringify(pathToFileURL(process.cwd() + "/").href)};
      export async function resolve(specifier, context, next) {
        if (specifier.startsWith('@/')) {
          const base = new URL(specifier.slice(2), root);
          for (const ext of ['.ts', '.tsx', '/index.ts', '']) {
            const cand = new URL(base.href + ext);
            if (existsSync(fileURLToPath(cand))) return next(cand.href, context);
          }
        }
        return next(specifier, context);
      }
    `),
  import.meta.url
);
