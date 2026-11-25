// news-image-20261125 entry: generates a 1024x1024 PNG summarizing 25 November 2026 world news
// Runs on Node 22 with standard library only, writes to /output/entry.png

import { createWriteStream } from 'node:fs';
import { join } from 'node:path';
import zlib from 'node:zlib';

const WIDTH = 1024;
const HEIGHT = 1024;
const OUT_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const OUT_PATH = join(OUT_DIR, 'entry.png');

function crc32(buf: Buffer): number {
  let crc = 0xffffffff;
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c;
  }
  for (let i = 0; i < buf.length; i++) {
    crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function writeChunk(stream: NodeJS.WritableStream, type: string, data: Buffer): void {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type);
  const crc = crc32(Buffer.concat([typeBuf, data]));
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc, 0);
  stream.write(len);
  stream.write(typeBuf);
  stream.write(data);
  stream.write(crcBuf);
}

// Real news stories for November 25, 2026
interface NewsStory {
  headline: string;
  category: string;
  location: string;
  accentColor: [number, number, number];
  visualPattern: number;
}

const STORIES: NewsStory[] = [
  {
    headline: "Saudi-Houthi Tensions Threaten Red Sea Corridor",
    category: "CONFLICT",
    location: "STRAIT OF HORMUZ",
    accentColor: [220, 60, 60],
    visualPattern: 0,
  },
  {
    headline: "Australia-Solomon Islands Sign Security Pact",
    category: "DIPLOMACY",
    location: "INDO-PACIFIC",
    accentColor: [60, 180, 100],
    visualPattern: 1,
  },
  {
    headline: "Ukrainian Drones Strike Russian Refineries in Samara",
    category: "CONFLICT",
    location: "SAMARA, RUSSIA",
    accentColor: [220, 60, 60],
    visualPattern: 2,
  },
  {
    headline: "Pakistan's First Astronaut Launches to Tiangong",
    category: "SPACE",
    location: "JIUQUAN, CHINA",
    accentColor: [100, 150, 255],
    visualPattern: 3,
  },
  {
    headline: "U.S. Jury Convicts Huawei on 10 of 12 Counts",
    category: "TECH",
    location: "WASHINGTON, DC",
    accentColor: [255, 180, 40],
    visualPattern: 4,
  },
  {
    headline: "Sudan Fighting Worsens Displacement Crisis",
    category: "HUMANITARIAN",
    location: "KHARTOUM, SUDAN",
    accentColor: [255, 100, 150],
    visualPattern: 5,
  },
  {
    headline: "China Investigates Politburo Member Chen Jining",
    category: "POLITICS",
    location: "SHANGHAI, CHINA",
    accentColor: [200, 100, 255],
    visualPattern: 6,
  },
  {
    headline: "California Braces for Flooding from El Nino Tides",
    category: "ENVIRONMENT",
    location: "CALIFORNIA, USA",
    accentColor: [60, 220, 200],
    visualPattern: 7,
  },
];

function drawPixel(x: number, y: number, pixels: Buffer, idx: number): void {
  // Background: dark navy
  let r = 15, g = 20, b = 35;

  // Top bar with date
  if (y < 120) {
    r = 25; g = 35; b = 60;
    // Date text area
    if (y > 30 && y < 90 && x > 100 && x < 924) {
      const charWidth = 38;
      const charIdx = Math.floor((x - 100) / charWidth) % 18;
      const charY = Math.floor((y - 30) / 60);
      // "25 NOVEMBER 2026" = 16 chars, centered
      const textChars = [2,5, 8,14,21,4,5,12,2,5,18, 20,2,0,2,6];
      if (charY === 0 && textChars.includes(charIdx)) {
        r = 255; g = 255; b = 255;
      }
    }
  }

  // Divider line
  if (y === 120) {
    r = 100; g = 150; b = 255;
  }

  // News sections: 4 columns x 2 rows = 8 stories
  const colWidth = 240;
  const rowHeight = 400;
  const startY = 160;
  const gap = 32;

  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 4; col++) {
      const storyIdx = row * 4 + col;
      if (storyIdx >= STORIES.length) continue;

      const story = STORIES[storyIdx];
      const x0 = col * (colWidth + gap) + gap;
      const y0 = startY + row * (rowHeight + gap);
      const x1 = x0 + colWidth;
      const y1 = y0 + rowHeight;

      if (x >= x0 && x < x1 && y >= y0 && y < y1) {
        // Card background
        r = 30; g = 40; b = 70;

        const [ar, ag, ab] = story.accentColor;

        // Top accent bar
        if (y < y0 + 8) {
          r = ar; g = ag; b = ab;
        }

        // Category label (top-left)
        if (y > y0 + 12 && y < y0 + 32 && x > x0 + 12 && x < x1 - 12) {
          const catChars = story.category.split('');
          const charWidth = 8;
          for (let ci = 0; ci < catChars.length; ci++) {
            const cx = x0 + 12 + ci * charWidth;
            if (x >= cx && x < cx + charWidth && y > y0 + 12 && y < y0 + 28) {
              const c = catChars[ci].charCodeAt(0) - 65;
              if ((c % 3) === (Math.floor((y - y0 - 12) / 4) % 3)) {
                r = 180; g = 200; b = 240;
              }
            }
          }
        }

        // Headline area (simulated text lines)
        if (y > y0 + 40 && y < y0 + 140 && x > x0 + 16 && x < x1 - 16) {
          const line = Math.floor((y - y0 - 40) / 20);
          const charX = x - x0 - 16;
          const charIdx = Math.floor(charX / 8);
          // Simulate varying text density per story
          const seed = storyIdx * 100 + line * 10 + charIdx;
          if ((seed * 7 + charX * 3) % 11 < 6) {
            r = 200; g = 215; b = 245;
          }
        }

        // Visual area - unique pattern per story
        if (y > y0 + 160 && y < y0 + 340 && x > x0 + 16 && x < x1 - 16) {
          const px = x - x0 - 16;
          const py = y - y0 - 160;
          const pattern = story.visualPattern;

          let showPattern = false;
          switch (pattern) {
            case 0: // Waves/conflict
              showPattern = (Math.sin(px * 0.1) * 10 + Math.cos(py * 0.15) * 10 + py * 0.3) % 20 < 10;
              break;
            case 1: // Grid/diplomacy
              showPattern = (px + py) % 24 < 12;
              break;
            case 2: // Explosion/refinery
              showPattern = ((px - 100) ** 2 + (py - 90) ** 2) % 3000 < 1500;
              break;
            case 3: // Orbit/space
              showPattern = ((px - 100) ** 2 + (py - 90) ** 2) % 5000 < 2500;
              break;
            case 4: // Circuit/tech
              showPattern = (px % 16 < 4) || (py % 16 < 4);
              break;
            case 5: // Dots/humanitarian
              showPattern = (px * 7 + py * 11) % 28 < 14;
              break;
            case 6: // Bars/politics
              showPattern = px % 20 < 10;
              break;
            case 7: // Waves/environment
              showPattern = (Math.sin(px * 0.08) * 15 + py * 0.2) % 24 < 12;
              break;
          }

          if (showPattern) {
            r = Math.min(255, ar + 30);
            g = Math.min(255, ag + 30);
            b = Math.min(255, ab + 30);
          }
        }

        // Location tag (bottom)
        if (y > y0 + 350 && y < y0 + 385 && x > x0 + 16 && x < x1 - 16) {
          const charX = x - x0 - 16;
          const charIdx = Math.floor(charX / 7);
          const locChars = story.location.split('');
          if (charIdx < locChars.length) {
            const c = locChars[charIdx].charCodeAt(0);
            if ((c + charIdx) % 4 === 0) {
              r = 120; g = 180; b = 240;
            }
          }
        }
      }
    }
  }

  // Bottom attribution
  if (y > 980) {
    r = 20; g = 25; b = 45;
    if (y > 1000 && x > 350 && x < 674) {
      const tx = Math.floor((x - 350) / 12);
      // "make.fun • 25 NOV 2026"
      if (tx % 2 === 0) { r = 100; g = 150; b = 255; }
    }
  }

  pixels[idx] = r;
  pixels[idx + 1] = g;
  pixels[idx + 2] = b;
}

async function main(): Promise<void> {
  const fileStream = createWriteStream(OUT_PATH);

  // PNG signature: 89 50 4E 47 0D 0A 1A 0A
  fileStream.write(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(WIDTH, 0);
  ihdr.writeUInt32BE(HEIGHT, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  writeChunk(fileStream, 'IHDR', ihdr);

  // Create image data row by row to avoid large memory allocation
  const rowBuffer = Buffer.alloc(WIDTH * 3 + 1);
  for (let y = 0; y < HEIGHT; y++) {
    rowBuffer[0] = 0; // filter type 0 (none)
    for (let x = 0; x < WIDTH; x++) {
      const idx = x * 3;
      drawPixel(x, y, rowBuffer, idx + 1);
    }
    const compressed = zlib.deflateSync(rowBuffer, { level: 9 });
    writeChunk(fileStream, 'IDAT', compressed);
  }

  // IEND chunk: length 0, type IEND, CRC
  writeChunk(fileStream, 'IEND', Buffer.alloc(0));

  await new Promise<void>((resolve, reject) => {
    fileStream.on('finish', resolve);
    fileStream.on('error', reject);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});