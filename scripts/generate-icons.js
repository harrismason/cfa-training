#!/usr/bin/env node
// Generates branded PNG icons for the CFA Training Tracker PWA.
// Draws a red (#E4002B) rounded-square with a white "L" lettermark.
// Outputs: public/logo512.png, public/logo192.png, public/apple-touch-icon.png

const { createCanvas } = require('@napi-rs/canvas');
const fs = require('fs');
const path = require('path');

const PUBLIC = path.join(__dirname, '..', 'public');
const RED = '#E4002B';

function drawIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const radius = size * 0.18;

  // Background rounded rect
  ctx.beginPath();
  ctx.moveTo(radius, 0);
  ctx.lineTo(size - radius, 0);
  ctx.quadraticCurveTo(size, 0, size, radius);
  ctx.lineTo(size, size - radius);
  ctx.quadraticCurveTo(size, size, size - radius, size);
  ctx.lineTo(radius, size);
  ctx.quadraticCurveTo(0, size, 0, size - radius);
  ctx.lineTo(0, radius);
  ctx.quadraticCurveTo(0, 0, radius, 0);
  ctx.closePath();
  ctx.fillStyle = RED;
  ctx.fill();

  // White "L" lettermark
  const fontSize = Math.round(size * 0.55);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `900 ${fontSize}px "Arial Black", Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('L', size / 2, size / 2 + size * 0.04);

  return canvas.toBuffer('image/png');
}

const sizes = [
  { file: 'logo512.png', size: 512 },
  { file: 'logo192.png', size: 192 },
  { file: 'apple-touch-icon.png', size: 180 },
];

for (const { file, size } of sizes) {
  const buf = drawIcon(size);
  fs.writeFileSync(path.join(PUBLIC, file), buf);
  console.log(`✓ ${file} (${size}×${size})`);
}

console.log('Icons generated successfully.');
