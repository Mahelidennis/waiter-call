#!/usr/bin/env node

/**
 * Simple icon placeholder generator
 * This creates basic SVG-based PNG icons for PWA development
 * In production, replace with proper designed icons
 */

const fs = require('fs')
const path = require('path')

// Create a simple SVG icon
const createSVGIcon = (size) => {
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${size}" height="${size}" fill="#16a34a"/>
    <text x="50%" y="50%" text-anchor="middle" dy=".3em" font-family="Arial, sans-serif" font-size="${size * 0.4}" fill="white" font-weight="bold">W</text>
  </svg>`
}

// Generate icon sizes
const sizes = [72, 96, 128, 144, 152, 192, 384, 512]
const iconsDir = path.join(__dirname, '../public/icons')

// Ensure icons directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true })
}

console.log('Generating placeholder PWA icons...')

sizes.forEach(size => {
  const svg = createSVGIcon(size)
  const filename = `icon-${size}x${size}.svg`
  const filepath = path.join(iconsDir, filename)
  
  fs.writeFileSync(filepath, svg)
  console.log(`Created ${filename}`)
})

console.log('\nIcon generation complete!')
console.log('Note: These are placeholder SVG icons. For production, replace with proper PNG icons.')
console.log('You can convert these SVGs to PNGs using tools like:')
console.log('- Online converters (e.g., cloudconvert.com)')
console.log('- Command line tools (e.g., rsvg-convert)')
console.log('- Design tools (e.g., Figma, Illustrator)')
