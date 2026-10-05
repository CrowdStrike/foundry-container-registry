/**
 * @typedef {import("../types/Image").default} Image
 * @typedef {{ name: string, description: string, multiCloud?: Image, regional?: Image }} ImageGroup
 */

const regionalSuffix = " (Regional)";

/**
 * @param {Date} date
 * @param {number} months
 * @returns {Date}
 */
function subtractCalendarMonths(date, months) {
  const targetMonth = date.getUTCMonth() - months;
  const targetYear = date.getUTCFullYear() + Math.floor(targetMonth / 12);
  const normalizedMonth = ((targetMonth % 12) + 12) % 12;
  const day = Math.min(
    date.getUTCDate(),
    new Date(Date.UTC(targetYear, normalizedMonth + 1, 0)).getUTCDate()
  );

  return new Date(
    Date.UTC(
      targetYear,
      normalizedMonth,
      day,
      date.getUTCHours(),
      date.getUTCMinutes(),
      date.getUTCSeconds(),
      date.getUTCMilliseconds()
    )
  );
}

/**
 * Groups registry variants under one display name and removes stale tags.
 * @param {Image[]} images
 * @param {Date} [now]
 * @returns {ImageGroup[]}
 */
function groupImages(images, now = new Date()) {
  const cutoff = subtractCalendarMonths(now, 18);
  const groups = new Map();

  for (const image of images) {
    const isRegional = image.name.endsWith(regionalSuffix);
    const name = isRegional
      ? image.name.slice(0, -regionalSuffix.length)
      : image.name;
    const tags = image.tags.filter((tag) => {
      if (!tag.buildDate) return true;
      const buildDate = new Date(tag.buildDate);
      return !Number.isFinite(buildDate.getTime()) || buildDate >= cutoff;
    });

    if (tags.length === 0) continue;

    const latestTag = tags[tags.length - 1];
    const filteredImage = {
      ...image,
      latest: latestTag.name,
      digest: latestTag.digest,
      tags,
    };
    const group = groups.get(name) || {
      name,
      description: image.description,
    };

    if (isRegional) {
      group.regional = filteredImage;
    } else {
      group.multiCloud = filteredImage;
    }
    groups.set(name, group);
  }

  return [...groups.values()].sort((first, second) =>
    first.name.localeCompare(second.name, undefined, { sensitivity: "base" })
  );
}

module.exports = { groupImages };