# Haachama Radar

Track the Chama are! 🗾

## Disclaimer
```
This project and README contains code and text AI generated.
Please assume they are misleading or features are not implemented.
```

## Dynamic Meta Tags for Static Site Generation

This project uses Next.js with static site generation (`output: 'export'`). To support dynamic meta tags with i18next while ensuring proper social media embedding, we use a hybrid approach:

### How it works:

1. **Static Meta Tags**: The `layout.tsx` uses Next.js metadata API to generate static meta tags in the initial HTML
2. **Dynamic Updates**: The `DynamicMetadata` component updates these meta tags on the client side when the language changes

### Usage:

```tsx
// In layout.tsx - Static meta tags
export const metadata: Metadata = {
  metadataBase: new URL('https://your-domain.com'),
  title: 'Haachama Radar',
  description: 'Find where the Haachama are!',
  // ... other meta tags
};

// In components - Dynamic updates
<DynamicMetadata /> // Uses default translations
<DynamicMetadata 
  title="Custom Title"
  description="Custom description"
  image="/custom-image.jpg"
  url="https://example.com"
/>
```

### Environment Variables:

Set `NEXT_PUBLIC_SITE_URL` to your production domain for proper social media image URLs:

```bash
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

### Features:

- ✅ Static meta tags for social media crawlers
- ✅ Dynamic language switching with i18next
- ✅ Open Graph and Twitter Card support
- ✅ PWA manifest support
- ✅ Custom meta tag overrides

## Project Goals / Feature Targets

- Interactive map of Japan's 47 prefectures
- Highlight prefectures Haachama has visited
- Show trip details (tweets, photos, YouTube streams) on hover/click
- Link to relevant tweets, photos, and YouTube streams for each trip/prefecture
- Allow fan-submitted photos (embedded or linked)
- Checklist of all prefectures (visualize which are visited/unvisited)
- Visualize travel progress (e.g., % complete, which are left)
- Manual content entry (not auto-scraping)

**Current Status:**

- [x] Interactive, cartoon-style map of Japan's prefectures
- [ ] Visited status/highlighting for prefectures
- [ ] Trip details and media links per prefecture
- [ ] Checklist/progress visualization
- [ ] Fan content submission/embedding
- [ ] Manual content management interface

## Getting Started

1. Install dependencies:

   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   # or
   bun install
   ```

2. Start the development server:

   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   # or
   bun dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser to view the app.

---

## Credits / Data Source

- Japanese prefecture boundaries data sourced from [dataofjapan/land](https://github.com/dataofjapan/land/blob/master/japan.geojson)
- The `japan-prefectures.geojson` file was generated using [mapshaper.org](https://mapshaper.org/) with the following process: **explode** (to separate MultiPolygons), **simplify** (to reduce file size while preserving shape), and **dissolve** (to merge features by prefecture name, ensuring each prefecture is a single feature).
- GeoJSON file simplified for web use with [mapshaper.org](https://mapshaper.org/))

This project uses Next.js, React, TypeScript, React Leaflet, and Tailwind CSS. See `src/app/page.tsx` and `src/app/components/JapanMap.tsx` for main logic.
