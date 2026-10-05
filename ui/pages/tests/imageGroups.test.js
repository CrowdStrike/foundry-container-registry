const assert = require("node:assert/strict");
const test = require("node:test");
const { groupImages } = require("../src/app/utils/imageGroups.js");

const now = new Date("2026-10-05T00:00:00Z");

function image(name, repository, tags) {
  const latestTag = tags[tags.length - 1];
  return {
    name,
    description: "Description",
    latest: latestTag.name,
    registry: repository.split("/")[0],
    repository,
    digest: latestTag.digest,
    tags,
  };
}

test("groups regional and multi-cloud images under one normalized name", () => {
  const multiCloud = image("Falcon Container Sensor for Linux", "registry.example.com/release/sensor", [
    { name: "8.1.0", digest: "multi-digest", arch: [], buildDate: "2026-01-01T00:00:00Z" },
  ]);
  const regional = image("Falcon Container Sensor for Linux (Regional)", "registry.example.com/us-2/release/sensor", [
    { name: "8.1.0-region", digest: "regional-digest", arch: [], buildDate: "2026-01-01T00:00:00Z" },
  ]);

  const groups = groupImages([regional, multiCloud], now);

  assert.equal(groups.length, 1);
  assert.equal(groups[0].name, "Falcon Container Sensor for Linux");
  assert.equal(groups[0].multiCloud.repository, multiCloud.repository);
  assert.equal(groups[0].regional.repository, regional.repository);
});

test("filters builds older than 18 calendar months and recalculates latest", () => {
  const multiCloud = image("Falcon Sensor for Linux (DaemonSet)", "registry.example.com/release/sensor", [
    { name: "old", digest: "old-digest", arch: [], buildDate: "2025-04-04T23:59:59Z" },
    { name: "undated", digest: "undated-digest", arch: [] },
    { name: "boundary", digest: "boundary-digest", arch: [], buildDate: "2025-04-05T00:00:00Z" },
  ]);

  const [group] = groupImages([multiCloud], now);

  assert.deepEqual(group.multiCloud.tags.map((tag) => tag.name), ["undated", "boundary"]);
  assert.equal(group.multiCloud.latest, "boundary");
  assert.equal(group.multiCloud.digest, "boundary-digest");
});

test("omits an image group when every registry variant has only stale builds", () => {
  const multiCloud = image("Falcon Image Assessment at Runtime (IAR)", "registry.example.com/release/iar", [
    { name: "old", digest: "old-digest", arch: [], buildDate: "2025-04-04T23:59:59Z" },
  ]);
  const regional = image("Falcon Image Assessment at Runtime (IAR) (Regional)", "registry.example.com/us-2/release/iar", [
    { name: "old-region", digest: "old-region-digest", arch: [], buildDate: "2025-01-01T00:00:00Z" },
  ]);

  assert.deepEqual(groupImages([multiCloud, regional], now), []);
});
