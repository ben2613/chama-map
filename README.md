# Haachama Japan Trip Fan Map

A proof-of-concept interactive map to visualize Haachama's (Akai Haato) travels across Japan's prefectures, inspired by fan community discussions.

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
