# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev              # Start development server
npm run build            # Build for production (runs prebuild hook to generate sample data)
npm run lint             # Run ESLint
npm run generate-sample  # Generate sample data from data/ folder
```

No test framework is configured. Linting uses ESLint 9 with Next.js config.

## Architecture

This is a **client-side analytics dashboard** for legal call center data. It transforms JSON call metadata + TXT transcripts into interactive Sankey diagrams, heatmaps, and filterable call records. There is no database - all data is uploaded by users or loaded from pre-generated samples.

### Tech Stack
- **Framework**: Next.js 16 with App Router, React 19, TypeScript 5
- **State**: Zustand with localStorage persistence (`store/callDataStore.ts`)
- **UI**: Tailwind CSS 4 + shadcn/ui (Radix primitives)
- **Charts**: Plotly.js + D3 Sankey

### Key Directories

- `app/dashboard/` - Dashboard pages: flow (Sankey), heatmap, deep-dive (file browser), info (definitions)
- `lib/` - Core logic:
  - `parser.ts` - JSON/TXT file parsing
  - `filters.ts` - 7-axis filter implementation (all filters AND-ed together)
  - `sankey.ts` - Sankey data transformation with 5 preset flows
  - `heatmap.ts` - Heatmap cell calculations
  - `definitions.ts` - Controlled vocabularies (caller_type, primary_intent, resolution_type, etc.)
- `store/callDataStore.ts` - Global Zustand store holding files, filters, stats, and UI preferences
- `components/charts/` - PlotlySankey, PlotlyHeatmap, Heatmap3D visualization components

### Data Flow

1. User uploads folder or loads sample → `parser.ts` extracts FileInfo
2. Data stored in Zustand → triggers stats computation
3. Filters applied via `applyAllFilters()` → filtered files flow to all pages
4. Visualizations (Sankey/Heatmap) consume filtered data

### State Management Pattern

```typescript
import { useCallDataStore } from '@/store/callDataStore';
const { files, filters, setFiles, setFilters } = useCallDataStore();
```

State shape: `files` (FileInfo[]), `filters` (FilterState), `dataSource`, `selectedFileId`, `sankeyOptions`

### Adding Features

**New filter dimension:**
1. Add field to `FilterState` in `lib/types.ts`
2. Add `matches*()` function in `lib/filters.ts`
3. Add to `applyAllFilters()` chain
4. Add UI control in `components/filters/FilterSidebar.tsx`

**New Sankey preset:**
1. Create `build*Flow()` function in `lib/sankey.ts`
2. Add case to `buildSankeyData()` switch
3. Add entry to `PRESET_INFO` in `app/dashboard/flow/page.tsx`

### Deployment Notes

Optimized for Vercel. Sample data is pre-generated during build via `prebuild` hook. The API route (`app/api/sample-data/route.ts`) has fallbacks for Vercel's file structure.
