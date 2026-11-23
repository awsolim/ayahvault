"""Locate the visible ayah-number medallions in the bundled Mushaf images.

Run with Python and Pillow after importing the page artwork.
"""

import json
from pathlib import Path

from PIL import Image

root = Path(__file__).resolve().parents[1]
pages = root / "public/mushaf/dar-al-marefa"

# The publisher's ending boxes for these ayahs point to the adjacent text.
corrected_search_boxes = {
    (13, 7): (1206, 498, 1292, 618),
    (27, 29): (512, 1000, 601, 1126),
    (27, 30): (711, 1126, 799, 1252),
    (67, 29): (1210, 498, 1296, 625),
}


def marker_bounds(alpha, box):
    x1, y1, x2, y2 = box
    left, top = max(0, x1 - 7), max(0, y1 - 10)
    crop = alpha.crop((left, top, min(alpha.width, x2 + 10), min(alpha.height, y2 + 10)))
    width, height = crop.size
    pixels = crop.tobytes()
    visited = bytearray(width * height)
    largest = (0, 0, 0, 0, 0)

    # The ornament is the largest connected group of ink in the ending box.
    # Its bounds also contain the separate digits inside it.
    for start, value in enumerate(pixels):
        if value < 64 or visited[start]:
            continue
        visited[start] = 1
        group = [start]
        low_x = high_x = start % width
        low_y = high_y = start // width
        for point in group:
            x, y = point % width, point // width
            low_x, high_x = min(low_x, x), max(high_x, x)
            low_y, high_y = min(low_y, y), max(high_y, y)
            for neighbor in (
                point - 1 if x else -1,
                point + 1 if x + 1 < width else -1,
                point - width,
                point + width,
            ):
                if 0 <= neighbor < len(pixels) and not visited[neighbor] and pixels[neighbor] >= 64:
                    visited[neighbor] = 1
                    group.append(neighbor)
        if len(group) > largest[0]:
            largest = (len(group), low_x, low_y, high_x + 1, high_y + 1)

    _, x1, y1, x2, y2 = largest
    if not (55 <= x2 - x1 <= 95 and 80 <= y2 - y1 <= 115):
        raise ValueError(f"Unexpected marker bounds in search box {box}")
    # Include the low-opacity pixels along the antialiased outline.
    return [
        max(0, left + x1 - 2),
        max(0, top + y1 - 2),
        min(alpha.width, left + x2 + 2),
        min(alpha.height, top + y2 + 2),
    ]


markers = {}
for page in range(1, 605):
    endings = json.loads((pages / f"{page}.json").read_text())["endings"]
    with Image.open(pages / f"{page}.png") as image:
        alpha = image.convert("RGBA").getchannel("A")
        for surah, ayah, *box in endings:
            key = (surah, ayah)
            assert key not in markers
            markers[key] = marker_bounds(alpha, corrected_search_boxes.get(key, box))

assert len(markers) == 6236
destination = root / "src/assets/mushaf-marker-bounds.json"
destination.write_text(json.dumps([markers[key] for key in sorted(markers)], separators=(",", ":")) + "\n")
