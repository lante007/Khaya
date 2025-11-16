# Favicon Setup Guide

## ✅ What's Already Done

1. **SVG Favicon Created** - `/client/public/favicon.svg`
   - Blue house icon representing "Khaya" (home in Zulu)
   - Scalable vector format
   - Works in modern browsers

2. **HTML Updated** - `/client/index.html`
   - References all favicon formats
   - Includes web manifest

3. **Web Manifest Created** - `/client/public/site.webmanifest`
   - PWA support
   - Theme colors configured

## 📋 To Generate PNG Favicons

### Option 1: Online Tool (Easiest)
1. Go to https://realfavicongenerator.net/
2. Upload `/client/public/favicon.svg`
3. Download the generated package
4. Extract these files to `/client/public/`:
   - `favicon-16x16.png`
   - `favicon-32x32.png`
   - `apple-touch-icon.png` (180x180)
   - `favicon.ico` (optional, for old browsers)

### Option 2: Using ImageMagick (Command Line)
```bash
cd /workspaces/Khaya/client/public

# Convert SVG to PNG at different sizes
convert -background none favicon.svg -resize 16x16 favicon-16x16.png
convert -background none favicon.svg -resize 32x32 favicon-32x32.png
convert -background none favicon.svg -resize 180x180 apple-touch-icon.png

# Create ICO file (optional)
convert favicon-16x16.png favicon-32x32.png favicon.ico
```

### Option 3: Using Node.js (Automated)
```bash
# Install sharp
pnpm add -D sharp

# Create conversion script
node scripts/generate-favicons.js
```

## 🎨 Current Favicon Design

**Colors:**
- Primary: `#2563eb` (Blue)
- Secondary: `#ffffff` (White)

**Design:**
- House icon (represents "Khaya" = home)
- Simple, recognizable at small sizes
- Professional and modern

## 🔄 To Update Favicon

1. Edit `/client/public/favicon.svg`
2. Regenerate PNG files using one of the options above
3. Clear browser cache to see changes

## ✅ Browser Support

- **Modern Browsers:** SVG favicon works perfectly
- **Safari/iOS:** Uses apple-touch-icon.png
- **Android:** Uses web manifest icons
- **Old Browsers:** Falls back to favicon.ico

## 📱 PWA Support

The web manifest (`site.webmanifest`) enables:
- Add to home screen on mobile
- Splash screen with theme colors
- Standalone app mode

## 🚀 Deployment

Favicons are automatically deployed with the frontend:
```bash
./deploy-frontend-update.sh
```

All files in `/client/public/` are copied to the production build.

## ✨ Current Status

- ✅ SVG favicon created and working
- ✅ HTML updated with all references
- ✅ Web manifest configured
- ⚠️ PNG files need to be generated (optional, SVG works in modern browsers)

**The SVG favicon will work immediately in all modern browsers!**
