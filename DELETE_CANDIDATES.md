# DELETE CANDIDATES
High-confidence safe-to-delete files only.
All references verified as zero across the entire project.
**Do NOT delete until approved.**

---

## TIER 1 — HIGHEST CONFIDENCE (zero references, clearly redundant)

### 1. Entire `assets/images/images/` folder
- Nested duplicate of `assets/images/` with identical structure
- Zero references in any HTML, CSS, or JS file
- Estimated size: ~80+ files

```
assets/images/images/  ← DELETE ENTIRE FOLDER
```

### 2. Entire `assets/Assets/` folder
- Duplicate of the root `Assets/` folder used by live pages
- Zero references in any HTML, CSS, or JS file
- Estimated size: ~100+ files including images and fonts

```
assets/Assets/  ← DELETE ENTIRE FOLDER
```

### 3. `assets/fonts/` folder (3 font files)
- Duplicate of root `Assets/fonts/` which is the one actually referenced
- Zero references in any CSS or HTML file

```
assets/fonts/Equinox Bold.woff2  ← DELETE
assets/fonts/Aquire-BW0ox.woff2  ← DELETE
assets/fonts/BEYNO.woff2         ← DELETE
```

### 4. `old-texcelerators-ui/` entire folder
- Entire previous version of the website with its own `.git` repo
- Not linked from any live page or server route
- Safe to archive externally and remove from production tree

```
old-texcelerators-ui/  ← DELETE ENTIRE FOLDER
```

### 5. Backup file

```
backups/rules-section-backup-2026-05-31.html  ← DELETE
```

### 6. Python utility scripts (not part of the web app)

```
_brace_check.py  ← DELETE
_extract_sop.py  ← DELETE
```

### 7. Development documentation markdown files
Not served, not referenced, not needed at runtime:

```
BACKEND_API_EXAMPLES.md
ENTERPRISE_FINANCIAL_SYSTEM.md
IMPLEMENTATION_COMPLETE.md
IMPLEMENTATION_SUMMARY.md
PREMIUM_REDESIGN_SUMMARY.md
PROJECT_MANAGEMENT_DEVELOPER_REFERENCE.md
PROJECT_MANAGEMENT_SYSTEM.md
ROLE_BASED_TESTING.md
```

---

## TIER 2 — HIGH CONFIDENCE (verify one condition before deleting)

### Story image originals (safe once Robots.html retirement confirmed)
The live site uses `.webp` versions. The `.jpg`/`.png` originals below are only referenced by `Robots.html`.
If `Robots.html` is retired, these are safe to delete:

```
Assets/images/Robots/Story/Sail.jpg
Assets/images/Robots/Story/Acrylic.png
Assets/images/Robots/Story/Quark.jpg
```

### `static-server.js`
Alternative static file server. `server.js` is the production server.
`static-server.js` is not referenced in `package.json` scripts.
Safe to delete unless used for static deployment.

```
static-server.js  ← DELETE after confirming not in deployment scripts
```

---

## DO NOT DELETE — Requires Further Investigation

| File | Reason |
|---|---|
| `assets/css/sop.css` | No reference found but may be dynamically injected |
| `assets/js/sop.js` | No HTML link found; may be lazy-loaded |
| `Robots.html`, `Robots.css`, `public-robots.js` | No nav links to this page but reachable via direct URL; confirm retirement |
| `.jpg`/`.JPG` slideshow originals | `Team.html` still uses `IITB2024.JPG` |
| `assets/images/HomePage/Achivements/BITSG2025Win.jpg` | Still referenced by `index.html` (×2) |

---

## SUMMARY TABLE

| Category | Count | Action |
|---|---|---|
| Duplicate nested image trees | ~180+ files | Delete after approval |
| Old UI folder | ~15 files + Assets | Delete after approval |
| Backup HTML | 1 | Delete after approval |
| Python scripts | 2 | Delete after approval |
| Markdown docs | 8 | Delete after approval |
| Font duplicates | 3 | Delete after approval |
| Story image originals | 3 | Delete after Robots.html retirement |
| `static-server.js` | 1 | Delete after confirming |

**Total safe-to-delete (Tier 1): ~210+ files**

---

*This file was generated from scan results. No deletions have been made.*
*Await explicit approval before proceeding with any deletion.*
