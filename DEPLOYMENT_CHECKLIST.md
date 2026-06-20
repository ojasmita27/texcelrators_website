# DEPLOYMENT_CHECKLIST.md
## Texcelerators Robotics Club — Production Deployment Checklist

Scan completed across all `.html`, `.js`, `.css`, `.json`, `.env` files.
Excludes: `node_modules/`, `_TRASH_REVIEW/`, `.git/`, `.venv/`, `package-lock.json`

---

## SCAN RESULTS SUMMARY

| Category | Count | Status |
|---|---|---|
| `localhost` references | 3 | ⚠️ Dev artifacts — safe, not user-facing |
| `127.0.0.1` references | 6 | ⚠️ In test scripts only — not in app code |
| Hardcoded `http://` | 11 | ✅ All safe — scripts, SVG data URIs, or comments |
| Hardcoded port `:3000` | 1 | ⚠️ Legacy cleanup filter in setup script |
| Hardcoded port `:5000` | 3 | ⚠️ Comments and legacy cleanup in scripts |
| `your-domain.com` placeholder | 4 | ❌ **Must replace before going live** |
| `https://texcelerators.com` reference | 4 | ✅ Correct production domain — verify DNS |
| `API_BASE` dynamic resolution | 20 | ✅ Correctly uses `window.location.origin` |
| `og:image` — relative/placeholder | 3 | ⚠️ Should be absolute URLs for social sharing |
| MongoDB URI | 1 | ✅ Atlas URI configured in `.env` |

---

## SECTION 1 — CRITICAL: Must Fix Before Deployment

### ❌ `your-domain.com` placeholder in canonical and Open Graph tags

These tags affect SEO and social media link previews. They must contain the real domain.

| File | Line | Current Value | Required Action |
|---|---|---|---|
| `index.html` | 13 | `<link rel="canonical" href="https://your-domain.com/" />` | Replace with real URL |
| `index.html` | 20 | `<meta property="og:url" content="https://your-domain.com/" />` | Replace with real URL |
| `workshop.html` | 13 | `<link rel="canonical" href="https://your-domain.com/workshop.html" />` | Replace with real URL |
| `workshop.html` | 20 | `<meta property="og:url" content="https://your-domain.com/workshop.html" />` | Replace with real URL |

**Fix:** Replace `https://your-domain.com` with the actual production domain (e.g. `https://texcelerators.com`).

---

### ❌ `og:image` — missing or placeholder values

Open Graph image tags should be absolute URLs for Facebook, WhatsApp, Twitter previews.

| File | Line | Current Value | Issue |
|---|---|---|---|
| `Team.html` | 18 | `<meta property="og:image" content="assets">` | `"assets"` is not a valid image URL |
| `Robots.html` | 13 | `<meta property="og:image" content="assets/logo.jpg">` | Relative path — won't work on social media |
| `workshop.html` | 19 | `<meta property="og:image" content="https://via.placeholder.com/200x200/2563eb/ffffff?text=TEX">` | Placeholder image service URL |

**Fix:** Replace with absolute URLs pointing to real images on your production domain.
Example: `https://texcelerators.com/Assets/images/Nav-Side-Footer/MainLogo.png`

---

### ❌ `.env` — Verify before deployment

The `.env` file contains a hardcoded MongoDB Atlas URI and JWT secret. These are already set for the current Atlas cluster. Verify these before deploying to a new environment:

| Variable | Current Status | Action |
|---|---|---|
| `MONGODB_URI` | ✅ Set to Atlas cluster | Confirm cluster is accessible from production server IP |
| `JWT_SECRET` | ✅ Set (long random hex) | Rotate if security policy requires |
| `PORT` | Currently `3000` | Set to production port (e.g. `80`, `443`, or behind reverse proxy) |
| `NODE_ENV` | Not explicitly set | **Set to `production`** before deploying |
| `USE_IN_MEMORY_DB` | `false` | Confirm stays `false` in production |
| `AUTO_PORT_FALLBACK` | `true` | Disable in production (set to `false`) |

---

## SECTION 2 — API Base URL Resolution

### ✅ Correctly implemented — no hardcoded URLs in user-facing code

`script.js` (`dashboard.html`):
```javascript
function resolveApiBase() {
    const meta = document.querySelector('meta[name="api-base"]');
    const metaBase = meta && meta.getAttribute('content');
    if (metaBase && metaBase.trim()) {
        return metaBase.trim().replace(/\/$/, '');
    }
    return window.location.origin;   // ← automatically uses current domain
}
const API_BASE = resolveApiBase();
```

**Mechanism:** The dashboard reads the `<meta name="api-base" content="">` tag in `dashboard.html`. If the content is empty (current state), it falls back to `window.location.origin`. This means in production at `https://texcelerators.com`, all API calls automatically go to `https://texcelerators.com/...` — **no code change needed**.

**Optional override:** If your API lives on a different domain or subdomain (e.g. `https://api.texcelerators.com`), set the meta tag:
```html
<meta name="api-base" content="https://api.texcelerators.com">
```

`login-script.js`:
```javascript
const API_BASE = window.location.origin;
```
✅ Also uses `window.location.origin` — works automatically in production.

`setup-admin-script.js`:
```javascript
const legacyBases = new Set(['http://localhost:3000', 'http://localhost:5000']);
const API_BASE = storedApiBase && !legacyBases.has(storedApiBase)
    ? storedApiBase
    : currentOrigin;
```
✅ Clears stale localhost values from localStorage, falls back to `window.location.origin`.

---

## SECTION 3 — localhost / 127.0.0.1 References

### ✅ All safe — development and test scripts only, not in user-facing app code

| File | Line | Reference | Classification |
|---|---|---|---|
| `server.js` | 283 | `console.log(...http://localhost:${activePort})` | ✅ Console log only, not user-facing |
| `static-server.js` | 13 | `console.log(...http://localhost:${port})` | ✅ Dev-only alternate server, not used in production |
| `setup-admin-script.js` | 5 | `new Set(['http://localhost:3000', 'http://localhost:5000'])` | ✅ Legacy cleanup list — detects and removes stale dev URLs from localStorage |
| `scripts/verify-payment-system.js` | 93–111 | `http://127.0.0.1:${port}` | ✅ Automated test script — not part of the running app |
| `scripts/verify-receipt-download.js` | 41–47 | `http://127.0.0.1:${port}` | ✅ Automated test script — not part of the running app |
| `scripts/kill-port.js` | 35–36 | `:5000` in comments | ✅ Code comment only |

**Conclusion:** None of these references will appear in a deployed production environment. They are either console logs, maintenance scripts, or test runners.

---

## SECTION 4 — Hardcoded Domain References

### ✅ `https://texcelerators.com` — verify DNS and SSL

These references already use the correct production domain:

| File | Line | Reference |
|---|---|---|
| `Team.html` | 11 | `<link rel="canonical" href="https://texcelerators.com/team.html" />` |
| `Team.html` | 19 | `<meta property="og:url" content="https://texcelerators.com/team.html">` |
| `Team.html` | 36 | `"url": "https://texcelerators.com"` (JSON-LD structured data) |
| `Team.html` | 37 | `"logo": "https://texcelerators.com/assets/logo.jpg"` (JSON-LD — fix path) |

**Action:** Confirm `https://texcelerators.com` is the live production domain and SSL is active.

**Note on JSON-LD logo path:** `Team.html` line 37 references `https://texcelerators.com/assets/logo.jpg`. Verify this file exists at that path on the production server. The actual logo file in the project is `assets/images/logo.png`.

---

## SECTION 5 — MongoDB Atlas

### ✅ Atlas URI is configured

The production MongoDB URI in `.env` points to:
- Cluster: `texcelerators-cluster.uag00za.mongodb.net`
- Database: `texcelerators`
- Auth: Encoded credentials present

**Deployment actions:**
- [ ] Add production server's IP address to MongoDB Atlas IP Allow List
- [ ] Confirm the Atlas user has `readWrite` permissions on the `texcelerators` database
- [ ] Never commit `.env` to version control (`.gitignore` already includes it)

---

## SECTION 6 — Environment Variables Checklist

Copy `.env.example` → `.env` and set all values before first run.

```env
PORT=443                          # or 80, or your reverse proxy port
NODE_ENV=production               # REQUIRED — enables production behaviour
MONGODB_URI=<atlas-uri>           # Already set in current .env
USE_IN_MEMORY_DB=false            # Must be false in production
DB_SERVER_SELECTION_TIMEOUT_MS=10000
DB_CONNECT_TIMEOUT_MS=10000
MEMBER_TOTAL_FEE=13500            # Verify correct fee amount
JWT_SECRET=<long-random-secret>   # Already set — rotate if needed
JWT_EXPIRES_IN=7d
RECEIPT_UPLOAD_DIR=uploads/receipts
AUTO_PORT_FALLBACK=false          # Disable in production
```

---

## SECTION 7 — File Upload Directory

The `uploads/` directory must exist and be **writable** by the Node.js process.

`utils/ensureUploadDirs.js` creates these directories automatically on server start:
```
uploads/
uploads/receipts/
uploads/receipts/generated/
uploads/receipts/proofs/
uploads/certificates/
uploads/profile/
```

**Action:** Ensure the process user has write permissions on `uploads/` in the deployment environment.

---

## SECTION 8 — Static File Serving

In production, `express.static` serves:
- Root directory (HTML pages, CSS, JS)
- `/uploads/*` (user files)

If deploying behind **Nginx or Apache**, configure it to:
1. Serve static files directly (bypass Node for assets)
2. Proxy `/auth`, `/members`, `/payments`, `/dashboard` etc. to Node
3. Set `Cache-Control` headers for `Assets/` images

---

## SECTION 9 — HTTPS / SSL

All Open Graph `og:url` and `canonical` tags reference `https://`. The app must run over HTTPS in production for:
- Secure JWT transmission
- Browser storage (`localStorage`) security
- Social media preview tags to function correctly

**Action:** Configure SSL via Let's Encrypt (Certbot), Cloudflare, or your hosting provider.

---

## SECTION 10 — Pre-Launch Checklist

### Critical (must complete before launch)
- [ ] Replace `your-domain.com` in `index.html` and `workshop.html` (4 tags)
- [ ] Set `NODE_ENV=production` in `.env`
- [ ] Set `AUTO_PORT_FALLBACK=false` in `.env`
- [ ] Whitelist production server IP in MongoDB Atlas
- [ ] Configure HTTPS / SSL certificate
- [ ] Verify `uploads/` directory is writable
- [ ] Run `npm install --production` (omits devDependencies)
- [ ] Run `node server.js` and confirm server starts without errors
- [ ] Visit `/setup-admin` and create the initial admin account
- [ ] Test login as admin and member

### Recommended (complete before public traffic)
- [ ] Fix `og:image` tags in `Team.html`, `Robots.html`, `workshop.html` (absolute URLs)
- [ ] Fix JSON-LD logo path in `Team.html` (`assets/logo.jpg` → real path)
- [ ] Add missing canonical tags to `Team.html`, `Robots.html`
- [ ] Rotate `JWT_SECRET` to a new unique value
- [ ] Set up server monitoring / uptime alerts
- [ ] Configure log rotation for production logs
- [ ] Set up MongoDB Atlas backup schedule
- [ ] Test receipt PDF download after payment approval
- [ ] Test certificate upload and download
- [ ] Test Excel report exports

### Optional (post-launch improvements)
- [ ] Set `<meta name="api-base" content="https://texcelerators.com">` in `dashboard.html` for explicit API URL (currently works without it via `window.location.origin`)
- [ ] Add `sitemap.xml` for SEO
- [ ] Configure CDN for `Assets/images/` to reduce server load
- [ ] Set long-cache headers for static assets

---

*Report generated by project scan. No files were modified.*
