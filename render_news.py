#!/usr/bin/env python3
"""
Render 1024x1024 news summary image for 25 November 2026 using PIL.
Uses DejaVu Sans font. Deterministic output.
"""

from PIL import Image, ImageDraw, ImageFont
import os
import hashlib
import textwrap

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

# News stories with factual headlines and short summaries
STORIES = [
    {
        "headline": "Saudi-Houthi clashes threaten Red Sea shipping corridor",
        "summary": "Fresh attacks on commercial vessels raise energy security concerns; Saudi-Houthi tensions threaten the vital Red Sea corridor.",
        "category": "CONFLICT",
        "location": "STRAIT OF HORMUZ",
        "accent": (220, 60, 60),
    },
    {
        "headline": "Australia, Solomon Islands sign security pact blocking foreign bases",
        "summary": "Comprehensive bilateral treaty establishes Canberra as principal security partner, prohibiting foreign military bases in the islands.",
        "category": "DIPLOMACY",
        "location": "INDO-PACIFIC",
        "accent": (60, 180, 100),
    },
    {
        "headline": "Ukrainian drones strike two major Russian oil refineries in Samara",
        "summary": "Zelensky indicates US seeks peace progress by January; EU delegation to join talks as energy infrastructure hit.",
        "category": "CONFLICT",
        "location": "SAMARA, RUSSIA",
        "accent": (220, 60, 60),
    },
    {
        "headline": "Pakistan's first astronaut launches aboard Shenzhou-24 to Tiangong",
        "summary": "Muhammad Zeeshan Ali becomes first foreign astronaut in China's crewed space programme, marking historic cooperation.",
        "category": "SPACE",
        "location": "JIUQUAN, CHINA",
        "accent": (100, 150, 255),
    },
    {
        "headline": "US jury convicts Huawei on 10 of 12 counts in sanctions case",
        "summary": "CIA and ODNI cyber intrusions reported; Nvidia leadership return sparks export-control controversy amid tech tensions.",
        "category": "TECH",
        "location": "WASHINGTON, DC",
        "accent": (255, 180, 40),
    },
    {
        "headline": "Sudan fighting displaces thousands more; famine risk escalates",
        "summary": "Gaza faces rising meningitis cases among infants; Yemen prices surge amid renewed hostilities worsening humanitarian crisis.",
        "category": "HUMANITARIAN",
        "location": "KHARTOUM, SUDAN",
        "accent": (255, 100, 150),
    },
    {
        "headline": "China investigates Politburo member Chen Jining for discipline violations",
        "summary": "Shanghai party chief probed as anti-corruption drive continues; signals shifting power dynamics ahead of leadership meetings.",
        "category": "POLITICS",
        "location": "SHANGHAI, CHINA",
        "accent": (200, 100, 255),
    },
    {
        "headline": "California braces for king tides and flooding from El Nino surge",
        "summary": "Powerful waves damage Peru coastline; dozens of ports closed as climate patterns intensify coastal flood risks.",
        "category": "ENVIRONMENT",
        "location": "CALIFORNIA, USA",
        "accent": (60, 220, 200),
    },
]

# Card dimensions
COL_WIDTH = 220
ROW_HEIGHT = 400
GAP = 24
START_Y = 140
CARD_PADDING = 14
HEADLINE_MAX_WIDTH = COL_WIDTH - 2 * CARD_PADDING  # 192px


def load_fonts():
    """Load DejaVu Sans fonts at various sizes."""
    font_dir = "/usr/share/fonts/truetype/dejavu/"
    fonts = {}
    try:
        fonts["title"] = ImageFont.truetype(os.path.join(font_dir, "DejaVuSans-Bold.ttf"), 36)
        fonts["headline"] = ImageFont.truetype(os.path.join(font_dir, "DejaVuSans-Bold.ttf"), 18)
        fonts["summary"] = ImageFont.truetype(os.path.join(font_dir, "DejaVuSans.ttf"), 14)
        fonts["category"] = ImageFont.truetype(os.path.join(font_dir, "DejaVuSans-Bold.ttf"), 12)
        fonts["location"] = ImageFont.truetype(os.path.join(font_dir, "DejaVuSans.ttf"), 13)
        fonts["attrib"] = ImageFont.truetype(os.path.join(font_dir, "DejaVuSans.ttf"), 16)
    except OSError:
        # Fallback
        fonts["title"] = ImageFont.load_default()
        fonts["headline"] = ImageFont.load_default()
        fonts["summary"] = ImageFont.load_default()
        fonts["category"] = ImageFont.load_default()
        fonts["location"] = ImageFont.load_default()
        fonts["attrib"] = ImageFont.load_default()
    return fonts


def wrap_text(draw, text, font, max_width):
    """Wrap text to fit within max_width, return list of lines."""
    words = text.split()
    lines = []
    current_line = []

    for word in words:
        test_line = " ".join(current_line + [word])
        bbox = draw.textbbox((0, 0), test_line, font=font)
        if bbox[2] - bbox[0] <= max_width:
            current_line.append(word)
        else:
            if current_line:
                lines.append(" ".join(current_line))
            current_line = [word]

    if current_line:
        lines.append(" ".join(current_line))

    return lines


def draw_card(draw, fonts, x0, y0, story):
    """Draw a single news card with wrapped headline and summary."""
    x1 = x0 + COL_WIDTH
    y1 = y0 + ROW_HEIGHT
    accent = story["accent"]
    max_text_width = HEADLINE_MAX_WIDTH

    # Card background
    draw.rectangle([x0, y0, x1, y1], fill=CARD_BG)

    # Top accent bar
    draw.rectangle([x0, y0, x1, y0 + 6], fill=accent)

    # Category label
    cat_text = story["category"]
    cat_bbox = draw.textbbox((x0 + CARD_PADDING, y0 + 10), cat_text, font=fonts["category"])
    draw.rectangle([cat_bbox[0] - 4, cat_bbox[1] - 2, cat_bbox[2] + 4, cat_bbox[3] + 2],
                   fill=accent)
    draw.text((x0 + CARD_PADDING, y0 + 10), cat_text, font=fonts["category"], fill=TEXT_WHITE)

    # Headline (wrapped)
    headline_lines = wrap_text(draw, story["headline"], fonts["headline"], max_text_width)
    y_text = y0 + 38
    for line in headline_lines[:3]:  # Max 3 lines for headline
        draw.text((x0 + CARD_PADDING, y_text), line, font=fonts["headline"], fill=TEXT_WHITE)
        y_text += 24

    # Visual separator line
    sep_y = y0 + 120
    draw.line([(x0 + CARD_PADDING, sep_y), (x1 - CARD_PADDING, sep_y)], fill=accent, width=2)

    # Summary (wrapped, 1-2 lines in middle space)
    summary_lines = wrap_text(draw, story["summary"], fonts["summary"], max_text_width)
    y_summary = sep_y + 12
    for line in summary_lines[:2]:  # Max 2 lines for summary
        draw.text((x0 + CARD_PADDING, y_summary), line, font=fonts["summary"], fill=TEXT_LIGHT)
        y_summary += 20

    # Location tag at bottom
    loc_y = y1 - 28
    draw.text((x0 + CARD_PADDING, loc_y), story["location"], font=fonts["location"],
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
    for row in range(2):
        for col in range(4):
            idx = row * 4 + col
            if idx >= len(STORIES):
                continue
            story = STORIES[idx]
            x0 = col * (COL_WIDTH + GAP) + GAP
            y0 = START_Y + row * (ROW_HEIGHT + GAP)
            draw_card(draw, fonts, x0, y0, story)

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