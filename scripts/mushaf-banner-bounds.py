"""Locate the color artwork around the surah titles using Python and Pillow."""

import json
from pathlib import Path

from PIL import Image, ImageChops

root = Path(__file__).resolve().parents[1]
pages = root / "public/mushaf/dar-al-marefa"
chapters = json.loads((root / "src/assets/chapters.json").read_text(encoding="utf-8"))


def banner_bounds(image):
    red, green, blue, opacity = image.convert("RGBA").split()
    green_over_red = ImageChops.subtract(green, red).point(lambda value: 255 if value > 25 else 0)
    green_over_blue = ImageChops.subtract(green, blue).point(lambda value: 255 if value > 20 else 0)
    green_ink = ImageChops.multiply(ImageChops.multiply(green_over_red, green_over_blue), opacity)
    row_density = green_ink.resize((1, image.height), Image.Resampling.BOX).tobytes()
    bands = []
    for y, density in enumerate(row_density):
        if density < 35:
            continue
        # Join the small gaps between the top, middle, and bottom of the ornament.
        if bands and y - bands[-1][1] <= 8:
            bands[-1][1] = y + 1
        else:
            bands.append([y, y + 1])

    bounds = []
    for top, bottom in bands:
        if bottom - top < 90:
            continue
        left, _, right, _ = green_ink.crop((0, top, image.width, bottom)).getbbox()
        bounds.append([max(0, left - 6), max(0, top - 6), min(image.width, right + 6), min(image.height, bottom + 6)])
    return bounds


# Some banners are at the bottom of the page before the surah's first ayah.
candidates = {c["page"] + delta for c in chapters for delta in (-1, 0, 1)}
artwork = [[] for _ in range(604)]
for page in sorted(candidates):
    if 3 <= page <= len(artwork):
        with Image.open(pages / f"{page}.png") as image:
            artwork[page - 1] = banner_bounds(image)
assert sum(map(len, artwork)) == len(chapters) - 2

# The opening pages have inset title panels and a continuous decorative frame.
for page in (1, 2):
    with Image.open(pages / f"{page}.png") as image:
        artwork[page - 1] = [
            [0, 0, image.width, 449],
            [0, 449, 275, 1498],
            [1069, 449, image.width, 1498],
            [0, 1498, image.width, image.height],
        ]

destination = root / "src/assets/mushaf-banner-bounds.json"
destination.write_text(json.dumps(artwork, separators=(",", ":")) + "\n")
