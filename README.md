<div align="center">

<img src="logo.svg" alt="Memex Logo" width="120" />

# Memex

**A modern bookmark manager that stays in real-time sync with your browser.**

Built with React, TypeScript, and Tailwind CSS · Chrome Extension (Manifest V3)

[![Chrome Web Store](https://img.shields.io/badge/Chrome-Extension-4285F4?style=for-the-badge&logo=googlechrome&logoColor=white)](#installation)
[![Edge Add-ons](https://img.shields.io/badge/Edge-Add--ons-0078D7?style=for-the-badge&logo=microsoftedge&logoColor=white)](#installation)
[![License: MIT](https://img.shields.io/badge/License-MIT-6366f1?style=for-the-badge)](LICENSE)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)

</div>

---

## Why Memex?

> Named after Vannevar Bush's 1945 concept of a "memory extender" — Memex keeps your bookmarks organized, enriched, and always in sync with your browser.

Unlike traditional bookmark managers that store data in their own database, **Memex reads and writes directly to your browser's native bookmark tree**. No data lock-in, no sync issues — what you see is what your browser has.

---

## Features

<table>
<tr>
<td width="50%">

### Core
- **Real-time sync** — changes reflect instantly via `chrome.bookmarks` API
- **Full-page tab** — opens as a dedicated browser tab, not a popup
- **Folder tree** — recursive sidebar with expand/collapse
- **Custom icons** — 150+ icons across 14 categories for folders

</td>
<td width="50%">

### Organization
- **Favorites** — heart toggle on bookmarks and folders
- **Tags** — freeform tags on every bookmark
- **Descriptions** — add context to any bookmark
- **Custom titles** — rename without changing the URL

</td>
</tr>
<tr>
<td width="50%">

### Power Features
- **Export / Import** — full JSON backup with metadata
- **Filter by favourite** — one-click view of starred items
- **Filter by tag** — type-ahead tag search
- **Smart sort** — folders first, then newest/oldest/A-Z

</td>
<td width="50%">

### Design
- **Indigo accent** — clean, modern color system
- **Favicon thumbnails** — visual bookmark recognition
- **Hover states** — edit/delete reveal on hover
- **Empty states** — contextual messages per view

</td>
</tr>
</table>

---

## Screenshots

<div align="center">

| Sidebar | Card Grid | Import |
|---------|-----------|--------|
| Folder tree with custom icons, favourites, and tag filters | Bookmark cards with favicons, heart toggle, and hover actions | Full JSON import with nested folder creation |

</div>

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| UI | React 19, Tailwind CSS 4, shadcn/ui |
| Language | TypeScript 6 |
| Build | Vite 8 |
| Extension | Chrome Manifest V3, `chrome.bookmarks` API |
| Icons | Lucide React + custom icon picker |
| Lint | oxlint |

---

## Project Structure

```
bookmark-manager-v2/
├── public/
│   ├── logo.svg              # Extension logo
│   ├── icons/                # Extension icons (16/48/128)
│   └── favicon.svg
├── src/
│   ├── App.tsx               # Main UI (sidebar, header, grid)
│   ├── background/
│   │   └── service-worker.ts # Chrome bookmark event listeners
│   ├── components/
│   │   ├── bookmark-card.tsx  # Bookmark card with actions
│   │   ├── bookmark-form.tsx  # Add/edit form
│   │   ├── icon-picker.tsx    # 150+ icon selector
│   │   └── ui/               # shadcn components
│   ├── hooks/
│   │   └── use-browser-bookmarks.ts  # Core sync hook
│   ├── manager/
│   │   └── index.html        # Tab page entry
│   └── types/
│       └── bookmark.ts       # Type definitions
├── manifest.json             # Chrome Extension manifest
├── background.ts             # Service worker entry
└── package.json
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm
- Chrome or Edge browser

### Development

```bash
# Clone
git clone https://github.com/yourusername/bookmark-manager-v2.git
cd bookmark-manager-v2

# Install
npm install

# Dev server (opens Vite dev server for hot reload)
npm run dev
```

### Load Extension in Browser

1. Navigate to `chrome://extensions` (or `edge://extensions`)
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the `dist/` folder

### Production Build

```bash
npm run build
```

This outputs to `dist/` — zip the contents for store upload.

---

## Installation

### From Source

1. Download or clone this repository
2. Run `npm install && npm run build`
3. Load the `dist/` folder as an unpacked extension
4. Click the Memex icon to open in a new tab

### From Web Store

> Coming soon

---

## How It Works

```
┌─────────────────────────────────────────────┐
│  Memex UI (React)                           │
│  ┌─────────┐  ┌──────────┐  ┌───────────┐  │
│  │ Sidebar │  │ Card Grid│  │ Form/Modal│  │
│  └────┬────┘  └────┬─────┘  └─────┬─────┘  │
│       │            │              │          │
│  ┌────▼────────────▼──────────────▼─────┐   │
│  │       useBrowserBookmarks Hook       │   │
│  │  • chrome.bookmarks CRUD             │   │
│  │  • chrome.storage for metadata       │   │
│  │  • Real-time event listeners         │   │
│  └──────────────────┬───────────────────┘   │
│                     │                       │
└─────────────────────┼───────────────────────┘
                      │
            ┌─────────▼─────────┐
            │  Chrome Bookmarks │
            │  (Native Storage) │
            └───────────────────┘
```

**Two-layer storage:**
- **Chrome Bookmarks API** — stores the actual bookmark tree (URL, title, folders)
- **chrome.storage.local** — stores enriched metadata (icons, favourites, tags, descriptions)

---

## Development Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Production build to `dist/` |
| `npm run lint` | Run oxlint |
| `npm run preview` | Preview production build |

---

## Contributing

Contributions are welcome! Here's how:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

MIT © 2026

---

<div align="center">

**Built with care for the modern web.**

<img src="logo.svg" alt="Memex" width="40" />

</div>
