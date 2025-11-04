# PWA Icons

To optimize the PWA experience, you should replace these placeholder icons with properly sized versions of your logo.

## Recommended Icon Sizes

The following icon sizes are required for the PWA:
- 72x72
- 96x96
- 128x128
- 144x144
- 152x152
- 192x192
- 384x384
- 512x512

## How to Generate Icons

You can use online tools like:
- https://www.pwabuilder.com/imageGenerator
- https://realfavicongenerator.net/

Or use ImageMagick locally:

```bash
# Install ImageMagick first
# Then run:
convert public/images/logo2.png -resize 72x72 public/icons/icon-72x72.png
convert public/images/logo2.png -resize 96x96 public/icons/icon-96x96.png
convert public/images/logo2.png -resize 128x128 public/icons/icon-128x128.png
convert public/images/logo2.png -resize 144x144 public/icons/icon-144x144.png
convert public/images/logo2.png -resize 152x152 public/icons/icon-152x152.png
convert public/images/logo2.png -resize 192x192 public/icons/icon-192x192.png
convert public/images/logo2.png -resize 384x384 public/icons/icon-384x384.png
convert public/images/logo2.png -resize 512x512 public/icons/icon-512x512.png
```

## Current Status

Placeholder icons have been created using the favicon. For best results, replace these with properly sized, optimized icons that:
- Have a square aspect ratio
- Use a transparent or solid background
- Are optimized for mobile display
- Follow the "maskable" icon guidelines for Android
