/**
 * Regenerates src/render-options.generated.ts from the canonical Zod render
 * options schema in the Urlbox API monorepo.
 *
 * Usage (Node 22+):
 *   node --experimental-strip-types scripts/generate-render-options.ts \
 *     <path to built packages/types/dist> [path to apps/docs/src/lib/options.ts]
 *
 * The docs catalogue is optional; when given, its descriptions and defaults
 * become JSDoc on each field.
 */
import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

type Def = {
  type: string;
  [key: string]: unknown;
};
type Schema = {
  _zod: { def: Def };
  safeParse: (value: unknown) => { success: boolean; data?: unknown };
  description?: string;
};
type DocOption = { name: string; desc?: string; defaultVal?: unknown };

const [distArg, docsArg] = process.argv.slice(2);
if (!distArg) {
  console.error(
    "usage: generate-render-options.ts <types dist dir> [docs options.ts]",
  );
  process.exit(1);
}

const here = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.resolve(here, "../src/render-options.generated.ts");
const SCHEMA_EXPORT = "tightRenderOptionsSchemaNoRequiredOptions";
const REQUIRED_ONE_OF = new Set(["url", "html"]);

const typesModule = await import(
  pathToFileURL(path.resolve(distArg, "render/render.types.js")).href
);
const schema = typesModule[SCHEMA_EXPORT] as Schema & {
  shape: Record<string, Schema>;
};
if (!schema?.shape) {
  throw new Error(`${SCHEMA_EXPORT} not found in ${distArg}`);
}

const docs = new Map<string, DocOption>();
if (docsArg) {
  const docsModule = await import(pathToFileURL(path.resolve(docsArg)).href);
  for (const group of docsModule.options as { options: DocOption[] }[]) {
    for (const option of group.options) {
      if (!docs.has(option.name)) docs.set(option.name, option);
    }
  }
}

const def = (s: Schema): Def => s._zod.def;
const isType = (s: Schema, type: string) => def(s).type === type;
const unionOptions = (s: Schema): Schema[] =>
  isType(s, "union") ? (def(s).options as Schema[]) : [];
const unionOf = (s: Schema, types: string[]) => {
  const options = unionOptions(s).map((o) => def(o).type);
  return (
    options.length === types.length && types.every((t) => options.includes(t))
  );
};
const quote = (value: unknown) => JSON.stringify(value);

/** Coercing union -> transform: decide what the transform produces by running it. */
const coercedType = (pipe: Schema, input: Schema): string | undefined => {
  if (unionOf(input, ["string", "boolean", "number"])) return "boolean";
  if (unionOf(input, ["string", "number"])) {
    const transform = def(def(pipe).out as Schema).transform as (
      value: unknown,
      ctx: unknown,
    ) => unknown;
    const ctx = { issues: [], addIssue: () => {} };
    const numeric = typeof transform("7", ctx);
    const text = typeof transform("top", ctx);
    if (numeric === "number" && text === "string") return "string | number";
    return numeric === "number" ? "number" : "string";
  }
  const strings = unionOptions(input);
  if (
    strings.length === 2 &&
    strings.some((o) => isType(o, "string")) &&
    strings.some((o) => isType(o, "array"))
  ) {
    return "string | string[]";
  }
  return undefined;
};

const objectType = (shape: Record<string, Schema>, indent: string): string => {
  const inner = `${indent}  `;
  const fields = Object.entries(shape).map(
    ([key, value]) =>
      `${inner}${/^[A-Za-z_$][\w$]*$/.test(key) ? key : quote(key)}${isOptional(value) ? "?" : ""}: ${tsType(value, inner)};`,
  );
  return fields.length
    ? `{\n${fields.join("\n")}\n${indent}}`
    : "Record<string, unknown>";
};

const isOptional = (s: Schema): boolean => {
  const t = def(s).type;
  if (t === "optional" || t === "default" || t === "prefault") return true;
  if (t === "nullable" || t === "readonly" || t === "catch") {
    return isOptional(def(s).innerType as Schema);
  }
  return false;
};

const wrap = (type: string) => (/[|&]/.test(type) ? `(${type})` : type);

function tsType(s: Schema, indent = "  "): string {
  const d = def(s);
  switch (d.type) {
    case "optional":
    case "default":
    case "prefault":
    case "catch":
    case "readonly":
    case "nonoptional":
      return tsType(d.innerType as Schema, indent);
    case "nullable":
      return `${tsType(d.innerType as Schema, indent)} | null`;
    case "pipe": {
      const input = d.in as Schema;
      const output = d.out as Schema;
      // z.preprocess(fn, X): the caller sends what X accepts.
      if (isType(input, "transform")) return tsType(output, indent);
      if (isType(output, "transform")) {
        return coercedType(s, input) ?? tsType(input, indent);
      }
      return tsType(input, indent);
    }
    case "union": {
      const parts = [
        ...new Set((d.options as Schema[]).map((o) => tsType(o, indent))),
      ];
      if (parts.includes("unknown")) return "unknown";
      // Keep literal autocompletion when an open string is also accepted.
      const hasLiterals = parts.some((p) => p.startsWith('"'));
      return parts
        .map((p) => (p === "string" && hasLiterals ? "(string & {})" : p))
        .join(" | ");
    }
    case "enum":
      return [...new Set(Object.values(d.entries as object))]
        .map(quote)
        .join(" | ");
    case "literal":
      return (d.values as unknown[]).map(quote).join(" | ");
    case "array":
      return `${wrap(tsType(d.element as Schema, indent))}[]`;
    case "object":
      return objectType(d.shape as Record<string, Schema>, indent);
    case "record":
      return `Record<string, ${tsType(d.valueType as Schema, indent)}>`;
    case "string":
      return "string";
    case "number":
    case "int":
    case "bigint":
      return "number";
    case "boolean":
      return "boolean";
    case "null":
      return "null";
    default:
      return "unknown";
  }
}

const jsdoc = (key: string, s: Schema): string => {
  const doc = docs.get(key);
  const lines: string[] = [];
  const description = doc?.desc ?? s.description;
  if (description) {
    lines.push(
      ...description
        .trim()
        .split("\n")
        .map((l) => l.trimEnd()),
    );
  }
  const defaultVal = doc?.defaultVal;
  if (
    typeof defaultVal === "string" ||
    typeof defaultVal === "number" ||
    typeof defaultVal === "boolean"
  ) {
    lines.push(`@default ${quote(defaultVal)}`);
  }
  if (!lines.length) return "";
  const body = lines
    .map((l) => `   *${l ? ` ${l.replaceAll("*/", "*\\/")}` : ""}`)
    .join("\n");
  return `  /**\n${body}\n   */\n`;
};

const keys = Object.keys(schema.shape).sort();
const fields = keys
  .filter((key) => !REQUIRED_ONE_OF.has(key))
  .map((key) => {
    const field = schema.shape[key];
    return `${jsdoc(key, field)}  ${key}?: ${tsType(field)};`;
  });

const source = `// AUTO-GENERATED by scripts/generate-render-options.ts — do not edit by hand.
// Source: ${SCHEMA_EXPORT} (${keys.length} options) in the Urlbox API.

/** Every render option except \`url\` / \`html\`, all optional. */
export interface GeneratedRenderOptionFields {
${fields.join("\n")}
}

export interface UrlInput {
${jsdoc("url", schema.shape.url)}  url: string;
  html?: never;
}

export interface HtmlInput {
${jsdoc("html", schema.shape.html)}  html: string;
  url?: never;
}
`;

writeFileSync(outPath, source);
console.log(
  `wrote ${path.relative(process.cwd(), outPath)} (${keys.length} options)`,
);
