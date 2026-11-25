// Simple PNG generator using only Node standard library
// Creates a 1024x1024 news summary image for 24 November 2026

const { createWriteStream } = require('fs');
const { pipeline } = require('stream/promises');
const zlib = require('zlib');

function crc32(buf) {
  let crc = 0xffffffff;
  const table = [];
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

function writeChunk(stream, type, data) {
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

async function createPNG(filename, width, height, drawFn) {
  const fileStream = createWriteStream(filename);

  // PNG signature
  fileStream.write(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 2;  // color type: truecolor
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace
  writeChunk(fileStream, 'IHDR', ihdr);

  // Create image data
  const pixels = Buffer.alloc(width * height * 3);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 3;
      drawFn(x, y, pixels, idx);
    }
  }

  // Apply PNG filter (type 0 - none) and compress
  const filtered = Buffer.alloc(height * (width * 3 + 1));
  for (let y = 0; y < height; y++) {
    filtered[y * (width * 3 + 1)] = 0; // filter type 0
    pixels.copy(filtered, y * (width * 3 + 1) + 1, y * width * 3, (y + 1) * width * 3);
  }

  const compressed = zlib.deflateSync(filtered, { level: 9 });
  writeChunk(fileStream, 'IDAT', compressed);

  // IEND chunk
  writeChunk(fileStream, 'IEND', Buffer.alloc(0));

  await new Promise((resolve, reject) => {
    fileStream.on('finish', resolve);
    fileStream.on('error', reject);
  });
}

// Draw a news summary image
createPNG('entry.png', 1024, 1024, (x, y, pixels, idx) => {
  // Background: dark navy
  let r = 15, g = 20, b = 35;

  // Top bar with date
  if (y < 120) {
    r = 25; g = 35; b = 60;
    // Date text area (simulated with pattern)
    if (y > 30 && y < 90 && x > 100 && x < 924) {
      // Simulate text "24 NOVEMBER 2026" with a pattern
      const charWidth = 40;
      const charIdx = Math.floor((x - 100) / charWidth) % 16;
      const charY = Math.floor((y - 30) / 60);
      if (charY === 0 && (charIdx === 2 || charIdx === 3 || charIdx === 5 || charIdx === 11 || charIdx === 12 || charIdx === 13)) {
        r = 255; g = 255; b = 255; // White text
      }
    }
  }

  // Divider line
  if (y === 120) {
    r = 100; g = 150; b = 255;
  }

  // News sections (4 columns x 2 rows = 8 stories)
  const colWidth = 240;
  const rowHeight = 400;
  const startY = 160;
  const gap = 32;

  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 4; col++) {
      const x0 = col * (colWidth + gap) + gap;
      const y0 = startY + row * (rowHeight + gap);
      const x1 = x0 + colWidth;
      const y1 = y0 + rowHeight;

      if (x >= x0 && x < x1 && y >= y0 && y < y1) {
        // Card background
        r = 30; g = 40; b = 70;

        // Top accent bar (different color per story)
        const storyIdx = row * 4 + col;
        const accentColors = [
          [220, 60, 60],   // Red - conflict/breaking
          [60, 180, 100],  // Green - positive/economy
          [255, 180, 40],  // Orange - politics
          [100, 150, 255], // Blue - tech/science
          [200, 100, 255], // Purple - culture
          [60, 220, 200],  // Teal - environment
          [255, 100, 150], // Pink - health
          [180, 180, 180], // Gray - other
        ];
        const [ar, ag, ab] = accentColors[storyIdx];

        if (y < y0 + 8) {
          r = ar; g = ag; b = ab;
        }

        // Simulate headline (top area)
        if (y > y0 + 20 && y < y0 + 60 && x > x0 + 16 && x < x1 - 16) {
          // Text pattern
          const tx = Math.floor((x - x0 - 16) / 8);
          if (tx % 3 === 0) { r = 220; g = 230; b = 255; }
        }

        // Simulate image/visual (middle area)
        if (y > y0 + 80 && y < y0 + 280 && x > x0 + 16 && x < x1 - 16) {
          // Pattern based on story
          const px = x - x0 - 16;
          const py = y - y0 - 80;
          if ((px + py) % 20 < 10) {
            r = Math.min(255, ar + 40);
            g = Math.min(255, ag + 40);
            b = Math.min(255, ab + 40);
          }
        }

        // Simulate location tag (bottom)
        if (y > y0 + 300 && y < y0 + 340 && x > x0 + 16 && x < x1 - 16) {
          const tx = Math.floor((x - x0 - 16) / 10);
          if (tx % 4 === 0) { r = 150; g = 200; b = 255; }
        }
      }
    }
  }

  // Bottom attribution
  if (y > 980) {
    r = 20; g = 25; b = 45;
    if (y > 1000 && x > 400 && x < 624) {
      // "make.fun" pattern
      const tx = Math.floor((x - 400) / 12);
      if (tx % 2 === 0) { r = 100; g = 150; b = 255; }
    }
  }

  pixels[idx] = r;
  pixels[idx + 1] = g;
  pixels[idx + 2] = b;
});

console.log('Created entry.png');