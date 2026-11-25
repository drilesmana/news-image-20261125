#!/usr/bin/env python3
"""
Render 1024x1024 news summary image for 25 November 2026 using PIL.
Uses DejaVu Sans font. Deterministic output.
"""

from PIL import Image, ImageDraw, ImageFont
import os
import hashlib

WIDTH = 1024
HEIGHT = 1024

# Colors
BG_COLOR = (15, 20, 35)
TOP_BAR_COLOR = (25, 35, 60)
DIVIDER_COLOR = (100, 150, 255)
CARD_BG = (30, 40, 70)
TEXT_WHITE = (255, 255, 255)
TEXT_LIGHT = (200, 215, 245)
TEXT_MUTED = (150, 180, 240)
ATTRIB_BG = (20, 25, 45)
ACCENT_BLUE = (100, 150, 255)

# News stories with factual short headlines
STORIES = [
    {
        "headline": "Saudi-Houthi clashes threaten\nRed Sea shipping corridor",
        "category": "CONFLICT",
        "location": "STRAIT OF HORMUZ",
        "accent": (220, 60, 60),
    },
    {
        "headline": "Australia, Solomon Islands sign\nsecurity pact blocking foreign bases",
        "category": "DIPLOMACY",
        "location": "INDO-PACIFIC",
        "accent": (60, 180, 100),
    },
    {
        "headline": "Ukrainian drones strike two major\nRussian oil refineries in Samara",
        "category": "CONFLICT",
        "location": "SAMARA, RUSSIA",
        "accent": (220, 60, 60),
    },
    {
        "headline": "Pakistan's first astronaut launches\naboard Shenzhou-24 to Tiangong",
        "category": "SPACE",
        "location": "JIUQUAN, CHINA",
        "accent": (100, 150, 255),
    },
    {
        "headline": "US jury convicts Huawei on 10 of\n12 counts in sanctions case",
        "category": "TECH",
        "location": "WASHINGTON, DC",
        "accent": (255, 180, 40),
    },
    {
        "headline": "Sudan fighting displaces thousands\nmore; famine risk escalates",
        "category": "HUMANITARIAN",
        "location": "KHARTOUM, SUDAN",
        "accent": (255, 100, 150),
    },
    {
        "headline": "China investigates Politburo member\nChen Jining for discipline violations",
        "category": "POLITICS",
        "location": "SHANGHAI, CHINA",
        "accent": (200, 100, 255),
    },
    {
        "headline": "California braces for king tides\nand flooding from El Nino surge",
        "category": "ENVIRONMENT",
        "location": "CALIFORNIA, USA",
        "accent": (60, 220, 200),
    },
]


def load_fonts():
    """Load DejaVu Sans fonts at various sizes."""
    font_dir = "/usr/share/fonts/truetype/dejavu/"
    fonts = {}
    try:
        fonts["title"] = ImageFont.truetype(os.path.join(font_dir, "DejaVuSans-Bold.ttf"), 36)
        fonts["headline"] = ImageFont.truetype(os.path.join(font_dir, "DejaVuSans-Bold.ttf"), 20)
        fonts["category"] = ImageFont.truetype(os.path.join(font_dir, "DejaVuSans-Bold.ttf"), 13)
        fonts["location"] = ImageFont.truetype(os.path.join(font_dir, "DejaVuSans.ttf"), 14)
        fonts["attrib"] = ImageFont.truetype(os.path.join(font_dir, "DejaVuSans.ttf"), 16)
    except OSError:
        # Fallback
        fonts["title"] = ImageFont.load_default()
        fonts["headline"] = ImageFont.load_default()
        fonts["category"] = ImageFont.load_default()
        fonts["location"] = ImageFont.load_default()
        fonts["attrib"] = ImageFont.load_default()
    return fonts


def draw_card(draw, fonts, x0, y0, col_width, row_height, story):
    """Draw a single news card."""
    x1 = x0 + col_width
    y1 = y0 + row_height
    accent = story["accent"]

    # Card background
    draw.rectangle([x0, y0, x1, y1], fill=CARD_BG)

    # Top accent bar
    draw.rectangle([x0, y0, x1, y0 + 6], fill=accent)

    # Category label
    cat_bbox = draw.textbbox((x0 + 10, y0 + 10), story["category"], font=fonts["category"])
    draw.rectangle([cat_bbox[0] - 4, cat_bbox[1] - 2, cat_bbox[2] + 4, cat_bbox[3] + 2],
                   fill=accent)
    draw.text((x0 + 10, y0 + 10), story["category"], font=fonts["category"], fill=TEXT_WHITE)

    # Headline (multi-line)
    headline = story["headline"]
    y_text = y0 + 38
    for line in headline.split("\n"):
        draw.text((x0 + 14, y_text), line, font=fonts["headline"], fill=TEXT_WHITE)
        y_text += 26

    # Visual separator line
    draw.line([(x0 + 14, y0 + 220), (x1 - 14, y0 + 220)], fill=accent, width=2)

    # Location tag at bottom
    loc_y = y1 - 30
    draw.text((x0 + 14, loc_y), story["location"], font=fonts["location"],
              fill=TEXT_MUTED)


def main():
    # Create image
    img = Image.new("RGB", (WIDTH, HEIGHT), BG_COLOR)
    draw = ImageDraw.Draw(img)
    fonts = load_fonts()

    # Top bar with title
    draw.rectangle([0, 0, WIDTH, 110], fill=TOP_BAR_COLOR)
    title = "25 NOVEMBER 2026 — WORLD NEWS"
    title_bbox = draw.textbbox((0, 0), title, font=fonts["title"])
    title_w = title_bbox[2] - title_bbox[0]
    draw.text(((WIDTH - title_w) // 2, 35), title, font=fonts["title"], fill=TEXT_WHITE)

    # Divider line
    draw.line([(0, 110), (WIDTH, 110)], fill=DIVIDER_COLOR, width=3)

    # Grid: 4 cols x 2 rows
    col_width = 220
    row_height = 400
    start_y = 140
    gap = 24

    for row in range(2):
        for col in range(4):
            idx = row * 4 + col
            if idx >= len(STORIES):
                continue
            story = STORIES[idx]
            x0 = col * (col_width + gap) + gap
            y0 = start_y + row * (row_height + gap)
            draw_card(draw, fonts, x0, y0, col_width, row_height, story)

    # Bottom attribution
    draw.rectangle([0, 980, WIDTH, HEIGHT], fill=ATTRIB_BG)
    attrib = "make.fun • 25 NOV 2026"
    attrib_bbox = draw.textbbox((0, 0), attrib, font=fonts["attrib"])
    attrib_w = attrib_bbox[2] - attrib_bbox[0]
    draw.text(((WIDTH - attrib_w) // 2, 1000), attrib, font=fonts["attrib"], fill=ACCENT_BLUE)

    # Save
    output_path = os.path.join(os.path.dirname(__file__), "entry.png")
    img.save(output_path, "PNG", optimize=True)

    # Verify determinism by computing hash
    with open(output_path, "rb") as f:
        content = f.read()
    sha256 = hashlib.sha256(content).hexdigest()
    print(f"Saved: {output_path}")
    print(f"SHA256: {sha256}")
    print(f"Size: {len(content)} bytes")

    return content


if __name__ == "__main__":
    main()