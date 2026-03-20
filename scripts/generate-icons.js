#!/usr/bin/env node
// Generates branded PNG icons and splash screen for the CFA Training Tracker PWA.
// Outputs: public/logo512.png, public/logo192.png, public/logo167.png,
//          public/apple-touch-icon.png, public/splash.png

const { createCanvas } = require('@napi-rs/canvas');
const fs = require('fs');
const path = require('path');

const PUBLIC = path.join(__dirname, '..', 'public');
const RED = '#E4002B';

function drawIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const radius = size * 0.18;
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
  const fontSize = Math.round(size * 0.55);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `900 ${fontSize}px "Arial Black", Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('L', size / 2, size / 2 + size * 0.04);
  return canvas.toBuffer('image/png');
}

function drawSplash() {
  const W = 2048, H = 2732;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = RED;
  ctx.fillRect(0, 0, W, H);
  const logoSize = 300;
  const lx = (W - logoSize) / 2;
  const ly = (H - logoSize) / 2 - 40;
  const r = logoSize * 0.18;
  ctx.beginPath();
  ctx.moveTo(lx + r, ly);
  ctx.lineTo(lx + logoSize - r, ly);
  ctx.quadraticCurveTo(lx + logoSize, ly, lx + logoSize, ly + r);
  ctx.lineTo(lx + logoSize, ly + logoSize - r);
  ctx.quadraticCurveTo(lx + logoSize, ly + logoSize, lx + logoSize - r, ly + logoSize);
  ctx.lineTo(lx + r, ly + logoSize);
  ctx.quadraticCurveTo(lx, ly + logoSize, lx, ly + logoSize - r);
  ctx.lineTo(lx, ly + r);
  ctx.quadraticCurveTo(lx, ly, lx + r, ly);
  ctx.closePath();
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `900 ${Math.round(logoSize * 0.55)}px "Arial Black", Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('L', W / 2, ly + logoSize / 2 + logoSize * 0.04);
  ctx.font = `700 72px Arial, sans-serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('CFA Training Tracker', W / 2, ly + logoSize + 80);
  ctx.font = `400 48px Arial, sans-serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.fillText('Lucent Technologies', W / 2, ly + logoSize + 148);
  return canvas.toBuffer('image/png');
}

const sizes = [
  { file: 'logo512.png', size: 512 },
  { file: 'logo192.png', size: 192 },
  { file: 'logo167.png', size: 167 },
  { file: 'apple-touch-icon.png', size: 180 },
];

for (const { file, size } of sizes) {
  const buf = drawIcon(size);
  fs.writeFileSync(path.join(PUBLIC, file), buf);
  console.log(`✓ ${file} (${size}×${size})`);
}

const splash = drawSplash();
fs.writeFileSync(path.join(PUBLIC, 'splash.png'), splash);
console.log('✓ splash.png (2048×2732)');
console.log('All assets generated successfully.');
