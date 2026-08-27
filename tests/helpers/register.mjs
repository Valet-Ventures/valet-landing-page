/**
 * Resolves extensionless relative imports to `.ts` so `node --test` can run the app's modules
 * unchanged. The source keeps Next-idiomatic extensionless specifiers; only the test runner
 * needs this, since Node's ESM resolver requires explicit extensions.
 */
import { registerHooks } from "node:module";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith(".") && path.extname(specifier) === "") {
      const parent = context.parentURL
        ? path.dirname(fileURLToPath(context.parentURL))
        : process.cwd();
      for (const candidate of [`${specifier}.ts`, path.join(specifier, "index.ts")]) {
        const abs = path.resolve(parent, candidate);
        if (existsSync(abs)) return nextResolve(pathToFileURL(abs).href, context);
      }
    }
    return nextResolve(specifier, context);
  },
});
