export type Region = [
  surah: number,
  ayah: number,
  line: number,
  left: number,
  top: number,
  right: number,
  bottom: number,
];
export type Ending = [
  surah: number,
  ayah: number,
  left: number,
  top: number,
  right: number,
  bottom: number,
];
export type Glyph = [
  surah: number,
  ayah: number,
  word: number,
  line: number,
  left: number,
  top: number,
  right: number,
  bottom: number,
];
export type PageData = {
  width: number;
  height: number;
  regions: Region[];
  endings?: Ending[];
  glyphs?: Glyph[];
};
export type ConcealedBounds = [
  left: number,
  top: number,
  right: number,
  bottom: number,
];
// Partition each line through its whitespace, rather than just covering glyph
// bounding boxes: printed ink can extend beyond those approximate boxes.
function concealmentCells(
  rows: {
    key: string;
    left: number;
    top: number;
    right: number;
    bottom: number;
    line: number;
  }[],
  width: number,
  height: number,
) {
  const lines = new Map<number, typeof rows>();
  for (const row of rows) {
    const group = lines.get(row.line) || [];
    group.push(row);
    lines.set(row.line, group);
  }
  return [...lines.values()].flatMap((group) => {
    group.sort((a, b) => a.left - b.left);
    const top = Math.max(0, Math.min(...group.map((r) => r.top)) - 6),
      bottom = Math.min(height, Math.max(...group.map((r) => r.bottom)) + 6);
    return group.map((r, i) => ({
      key: r.key,
      bounds: [
        i ? Math.max(0, (group[i - 1].right + r.left) / 2) : 0,
        top,
        i + 1 < group.length
          ? Math.min(width, (r.right + group[i + 1].left) / 2)
          : width,
        bottom,
      ] as ConcealedBounds,
    }));
  });
}
export function concealmentBounds(
  data: PageData,
  visible: (key: string) => boolean,
  anchor: string,
  partialWords: number | null,
  concealHeadings = false,
): ConcealedBounds[] {
  const hidden: ConcealedBounds[] = [];
  if (concealHeadings) {
    // Non-ayah lines contain the printed surah banners and opening basmallahs.
    // Use the neighbouring full line bands so the artwork stays in place.
    const lines = new Map<number, { top: number; bottom: number }>();
    for (const [, , line, , top, , bottom] of data.regions) {
      const previous = lines.get(line);
      lines.set(line, {
        top: Math.min(previous?.top ?? top, top),
        bottom: Math.max(previous?.bottom ?? bottom, bottom),
      });
    }
    let previousLine = 0;
    let previousBottom = 0;
    for (const [line, bounds] of [...lines].sort(([a], [b]) => a - b)) {
      if (line > previousLine + 1 && bounds.top > previousBottom)
        hidden.push([0, previousBottom, data.width, bounds.top]);
      previousLine = line;
      previousBottom = bounds.bottom;
    }
  }
  const cells = concealmentCells(
    data.regions.map(([s, a, line, left, top, right, bottom]) => ({
      key: s + ":" + a,
      line,
      left,
      top,
      right,
      bottom,
    })),
    data.width,
    data.height,
  );
  for (const { key, bounds } of cells) {
    if (
      !visible(key) ||
      (key === anchor &&
        partialWords !== null &&
        (partialWords === 0 || !data.glyphs))
    )
      hidden.push(bounds);
  }
  if (partialWords !== null && partialWords > 0 && visible(anchor)) {
    const glyphs = data.glyphs || [];
    const words = concealmentCells(
      glyphs.map(([s, a, word, line, left, top, right, bottom], i) => ({
        key: s + ":" + a + ":" + word + ":" + i,
        line,
        left,
        top,
        right,
        bottom,
      })),
      data.width,
      data.height,
    );
    for (const { key, bounds } of words) {
      const [s, a, word] = key.split(":").map(Number);
      if (s + ":" + a === anchor && (word === 0 || word > partialWords))
        hidden.push(bounds);
    }
  }
  return hidden;
}

export type LineFit = {
  top: number;
  bottom: number;
  scale: number;
  offset: number;
};
export type MarkerBounds = [
  left: number,
  top: number,
  right: number,
  bottom: number,
];
export type ArtworkOverlay = {
  key: string;
  bounds: MarkerBounds;
  linked: boolean;
};

function median(values: number[]) {
  return values.sort((a, b) => a - b)[Math.floor(values.length / 2)];
}

export function fitArtworkLines(data: PageData) {
  const lines = new Map<number, Region[]>();
  for (const region of data.regions) {
    const row = lines.get(region[2]);
    if (row) row.push(region);
    else lines.set(region[2], [region]);
  }
  const bounds = [...lines].map(([line, regions]) => ({
    line,
    edge: regions.reduce((leftmost, region) =>
      region[3] < leftmost[3] ? region : leftmost,
    ),
    right: Math.max(...regions.map((r) => r[5])),
    top: Math.min(...regions.map((r) => r[4])),
    bottom: Math.max(...regions.map((r) => r[6])),
  }));
  const full = bounds.filter(
    ({ edge, right }) =>
      edge[3] < data.width * 0.056 && right > data.width * 0.93,
  );
  const fits = new Map<number, LineFit>();

  if (full.length >= 4) {
    const leftMargin = median(full.map(({ edge }) => edge[3]));
    const rightMargin = median(full.map(({ right }) => right));
    for (const { line, edge, right, top, bottom } of bounds) {
      const [surah, ayah, , left] = edge;
      const indent = left - leftMargin;
      // The publisher leaves a small left indent on some lines ending in a stop mark.
      if (indent < 22 || indent > 110 || Math.abs(right - rightMargin) > 18)
        continue;
      const continues =
        lines.get(line + 1)?.some(([s, a]) => s === surah && a === ayah) ||
        (line === 15 &&
          data.endings &&
          !data.endings.some(([s, a]) => s === surah && a === ayah));
      // Chapter endings and centered lines are part of the printed layout.
      if (!continues) continue;
      const scale = (right - leftMargin) / (right - left);
      fits.set(line, { top, bottom, scale, offset: right * (1 - scale) });
    }
  }

  const fitX = (line: number, x: number) => {
    const fit = fits.get(line);
    return fit ? x * fit.scale + fit.offset : x;
  };
  const regions = data.regions.map(
    ([surah, ayah, line, left, top, right, bottom]): Region => [
      surah,
      ayah,
      line,
      fitX(line, left),
      top,
      fitX(line, right),
      bottom,
    ],
  );
  return { fits: [...fits.values()].sort((a, b) => a.top - b.top), regions };
}

export function fitMarkerBounds(
  [left, top, right, bottom]: MarkerBounds,
  fits: LineFit[],
): MarkerBounds {
  const center = (top + bottom) / 2;
  const fit = fits.find((line) => center >= line.top && center < line.bottom);
  return fit
    ? [
        left * fit.scale + fit.offset,
        top,
        right * fit.scale + fit.offset,
        bottom,
      ]
    : [left, top, right, bottom];
}
