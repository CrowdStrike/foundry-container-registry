const assert = require("node:assert/strict");
const test = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");

const filename = path.resolve(__dirname, "../src/app/Dashboard/ImageItem.tsx");
const componentModule = new Module(filename, module);
componentModule.filename = filename;
componentModule.paths = Module._nodeModulePaths(path.dirname(filename));
const previousCssLoader = require.extensions[".css"];
require.extensions[".css"] = () => {};
componentModule._compile(ts.transpileModule(fs.readFileSync(filename, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
}).outputText, filename);
if (previousCssLoader) {
  require.extensions[".css"] = previousCssLoader;
} else {
  delete require.extensions[".css"];
}
const { ImageItem } = componentModule.exports;

function variant(repository, latest) {
  return { repository, latest, tags: [] };
}

const multiCloud = variant("registry.example.com/release/sensor", "multi-latest");
const regional = variant("registry.example.com/us-2/release/sensor", "regional-latest");

function renderGroup(variants) {
  return renderToStaticMarkup(React.createElement(ImageItem, {
    group: { name: "Sensor", description: "Description", ...variants },
  }));
}

test("paired registries show each path beside its latest tag only in its registry section", () => {
  const markup = renderGroup({ multiCloud, regional });
  const [summary, multiSection, regionalSection] = markup.split("<section>");
  assert.ok(!summary.includes("Image path"));
  assert.ok(!summary.includes(multiCloud.repository));
  assert.ok(!summary.includes(regional.repository));
  for (const [section, image, other] of [
    [multiSection, multiCloud, regional],
    [regionalSection, regional, multiCloud],
  ]) {
    assert.ok(section.includes("Image path"));
    assert.ok(section.includes(`<code>${image.repository}</code>`));
    assert.ok(section.includes(`<code>${image.latest}</code>`));
    assert.ok(!section.includes(other.repository));
    assert.ok(section.includes("registry-variant-info"));
  }
});

for (const [label, variants, image] of [
  ["multi-cloud", { multiCloud }, multiCloud],
  ["cloud-specific", { regional }, regional],
]) {
  test(`a single ${label} registry shows its path beside the name and description`, () => {
    const [summary, details] = renderGroup(variants).split("<section>");
    assert.ok(summary.includes("Image path"));
    assert.ok(summary.includes(`<code>${image.repository}</code>`));
    assert.ok(summary.includes(`<code>${image.latest}</code>`));
    assert.ok(!details.includes("Image path"));
  });
}