import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const root = process.cwd();
const layers = ["app", "pages", "widgets", "features", "entities", "shared"];
const walk = (directory) =>
  fs
    .readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) =>
      entry.isDirectory()
        ? walk(path.join(directory, entry.name))
        : [path.join(directory, entry.name)],
    );
const config = ts.readConfigFile("tsconfig.json", ts.sys.readFile).config;
const { options } = ts.parseJsonConfigFileContent(config, ts.sys, root);
function identity(file) {
  const parts = path.relative(root, file).replaceAll("\\", "/").split("/");
  return parts[0] === "app" ? { layer: "app", slice: null } : { layer: parts[1], slice: parts[2] };
}
const errors = [];
const graph = new Map();
let imports = 0;
for (const directory of fs
  .readdirSync("src", { withFileTypes: true })
  .filter((entry) => entry.isDirectory())) {
  if (!layers.includes(directory.name)) errors.push(`Unexpected src layer: ${directory.name}`);
  if (["pages", "widgets", "features", "entities"].includes(directory.name)) {
    for (const slice of fs
      .readdirSync(`src/${directory.name}`, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())) {
      if (!fs.existsSync(`src/${directory.name}/${slice.name}/index.ts`))
        errors.push(`Missing public API: ${directory.name}/${slice.name}`);
    }
  }
}
for (const file of [...walk("src"), ...walk("app")].filter((file) =>
  /\.[cm]?[jt]sx?$/.test(file),
)) {
  const source = ts.createSourceFile(
    file,
    fs.readFileSync(file, "utf8"),
    ts.ScriptTarget.Latest,
    true,
  );
  const owner = identity(path.resolve(file));
  const absolute = path.resolve(file);
  graph.set(absolute, []);
  function visit(node) {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      const specifier = node.moduleSpecifier.text;
      if (specifier.startsWith("@/") || specifier.startsWith(".")) {
        const resolved = ts.resolveModuleName(specifier, path.resolve(file), options, ts.sys)
          .resolvedModule?.resolvedFileName;
        if (!resolved) {
          if (!specifier.endsWith(".css")) errors.push(`${file}: unresolved ${specifier}`);
        } else {
          imports++;
          const clause = node.importClause;
          const typeOnly =
            node.isTypeOnly ||
            clause?.isTypeOnly ||
            (clause &&
              !clause.name &&
              clause.namedBindings &&
              ts.isNamedImports(clause.namedBindings) &&
              clause.namedBindings.elements.every((element) => element.isTypeOnly));
          if (!typeOnly) graph.get(absolute).push(path.resolve(resolved));
          const target = identity(resolved),
            from = layers.indexOf(owner.layer),
            to = layers.indexOf(target.layer);
          if (from >= 0 && to >= 0 && to < from) errors.push(`${file}: upward import ${specifier}`);
          if (
            owner.layer === target.layer &&
            owner.slice !== target.slice &&
            !["app", "shared"].includes(owner.layer)
          ) {
            const cross = owner.layer === "entities" && specifier.endsWith(`/@x/${owner.slice}`);
            if (!cross) errors.push(`${file}: sibling slice import ${specifier}`);
          }
          if (
            owner.layer !== target.layer &&
            ["pages", "widgets", "features", "entities"].includes(target.layer) &&
            !/[/\\]index\.ts$/.test(resolved) &&
            !specifier.includes("/@x/")
          )
            errors.push(`${file}: bypassed public API ${specifier}`);
        }
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
}
// Type references may form a schema graph; executable modules must be acyclic.
const visited = new Set(),
  active = new Set(),
  stack = [];
function inspect(file) {
  if (active.has(file)) {
    errors.push(
      `Runtime import cycle: ${[...stack.slice(stack.indexOf(file)), file].map((item) => path.relative(root, item)).join(" -> ")}`,
    );
    return;
  }
  if (visited.has(file)) return;
  active.add(file);
  stack.push(file);
  for (const target of graph.get(file) ?? []) inspect(target);
  stack.pop();
  active.delete(file);
  visited.add(file);
}
for (const file of graph.keys()) inspect(file);
if (errors.length) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else console.log(`PASS: FSD layers, slice APIs and ${imports} local imports.`);
