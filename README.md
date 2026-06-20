# Texcelerators Robotics Club — Website & Management System

Official website and internal management platform for **Texcelerators Robotics Club**, the robotics club of St. Vincent Pallotti College of Engineering and Technology (SVPCET), Nagpur.

The project combines a public-facing club website with a private member and admin dashboard for managing membership fees, payments, expenses, projects, events, certificates, reimbursements, and fund tracking.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Vanilla HTML5, CSS3, JavaScript (ES2020+) |
| **Backend** | Node.js v18+, Express 4.x |
| **Database** | MongoDB (Atlas in production, optional local/in-memory for dev) |
| **ODM** | Mongoose 8.x |
| **Authentication** | JWT (jsonwebtoken), bcryptjs for password hashing |
| **File Uploads** | Multer 2.x (disk storage) |
| **PDF Generation** | Custom raw PDF builder (no external library) |
| **Excel Reports** | xlsx (SheetJS) |
| **Charts** | Chart.js (CDN) |
| **Icons** | Font Awesome 6.4 (CDN) |
| **Fonts** | Space Grotesk, Outfit, Audiowide (Google Fonts) + Equinox (local woff2) |
| **Dev Server** | nodemon |

---

## Folder Structure

```
texcelrators_website/
│
├── assets/                          # Public static assets (capital A — used by HTML pages)
│   ├── fonts/                       # Custom woff2 fonts (Equinox Bold, Aquire, BEYNO)
│   ├── images/
│   │   ├── HomePage/                # Homepage images (slideshow, achievements, robots, testimonials)
│   │   ├── Nav-Side-Footer/         # Logos: MainLogo.png, SvpcetLogo.png, SvpcetBanner.png
│   │   ├── Robots/                  # Robots page images (stories, behind-the-build)
│   │   └── Team/                    # Team page photos (all sub-teams, alumni, behind-the-scenes)
│   └── CLUB SOP.pdf                 # Standard Operating Procedure document
│
├── assets/                          # Dashboard and module-specific assets (lowercase a)
│   ├── css/
│   │   ├── certificates.css         # Certificate Management section styles
│   │   ├── fund-management.css      # Fund Management section styles
│   │   ├── sop-card.css             # SOP card styles (used inside dashboard rules section)
│   │   └── sop.css                  # Additional SOP styles (verify if actively used)
│   ├── images/
│   │   ├── logo.png                 # Dashboard sidebar logo
│   │   └── payment-qr.png           # QR code image for UPI payment display
│   └── js/
│       └── sop.js                   # SOP portal JS (verify if actively used)
│
├── backups/                         # Manual HTML backups — not served
│
├── config/
│   └── db.js                        # MongoDB connection via mongoose.connect()
│
├── middleware/
│   └── auth.js                      # JWT auth: requireAuth(), requireRole(), blockIfMustChangePassword()
│
├── models/                          # Mongoose schemas → MongoDB collections
│   ├── Certificate.js               # Member certificates + auto-increment ID (fundentries)
│   ├── Collaboration.js             # External collaboration inquiries
│   ├── Event.js                     # Club events and competitions
│   ├── Expense.js                   # Club expenses (manual + reimbursement-auto-created)
│   ├── FundEntry.js                 # Non-fee fund entries (opening balance, sponsorships, etc.)
│   ├── MemberTransaction.js         # Internal peer-to-peer transfers
│   ├── Payment.js                   # Member fee installment payments
│   ├── Project.js                   # Robotics projects with budget tracking
│   ├── ReceiptSequence.js           # Auto-increment receipt numbers (TXC-YYYY-NNNNNN)
│   ├── Reimbursement.js             # Member purchase reimbursement claims
│   └── User.js                      # Members and admins (roles, status, passwords)
│
├── routes/                          # Express route handlers
│   ├── auth.routes.js               # POST /auth/login, /register-admin, /change-password
│   ├── certificate.routes.js        # GET/POST/PATCH/DELETE /certificates
│   ├── collaboration.routes.js      # POST/GET /api/collaboration + approve/reject
│   ├── dashboard.routes.js          # GET /dashboard/data (aggregated dashboard payload)
│   ├── event.routes.js              # CRUD /events
│   ├── expense.routes.js            # POST/PUT/DELETE /expenses
│   ├── fund.routes.js               # POST/GET/PUT/DELETE /funds
│   ├── member-transaction.routes.js # CRUD /member-transactions
│   ├── member.routes.js             # POST /members/add, deactivate, remove, upload-certificates, etc.
│   ├── payment.routes.js            # POST /payments/add, verify + GET receipt downloads
│   ├── project.routes.js            # CRUD /projects
│   ├── reimbursement.routes.js      # Full reimbursement workflow /reimbursements
│   └── reports.routes.js            # GET /reports/export/:type (Excel downloads)
│
├── scripts/                         # One-off admin / maintenance scripts (run manually)
│   ├── cleanup-dummy-users.js       # Remove test/dummy user accounts
│   ├── kill-backend.js              # Kill any running backend process (used by npm scripts)
│   ├── kill-port.js                 # Kill process on a specific port
│   ├── migrate-user-status.js       # Migrate legacy user status fields
│   ├── verify-payment-system.js     # Sanity check payment system
│   └── verify-receipt-download.js   # Sanity check receipt download flow
│
├── uploads/                         # File upload storage (served at /uploads/*)
│   ├── receipts/
│   │   ├── generated/               # Auto-generated official PDF receipts
│   │   └── proofs/                  # Member-uploaded payment proof images/PDFs
│   ├── profile/                     # Member profile pictures
│   └── certificates/                # Uploaded certificate files (PDF/image)
│
├── utils/                           # Shared utility modules
│   ├── asyncHandler.js              # Express async error wrapper
│   ├── ensureUploadDirs.js          # Creates uploads/ subdirectories on startup
│   ├── excelReports.js              # Excel report generation (SheetJS)
│   ├── jwt.js                       # signAccessToken() helper
│   ├── logger.js                    # logInfo / logWarn / logError helpers
│   ├── membershipInstallments.js    # Installment schedule logic (₹5000 / ₹5000 / ₹3500)
│   ├── pdfGenerator.js              # Raw PDF builder for official payment receipts
│   ├── receiptSequence.js           # Auto-increment receipt numbers per year
│   ├── syncPaymentIndexes.js        # Ensures MongoDB indexes on payments collection
│   └── upload.js                    # Multer uploaders: receiptUploader, profileUploader, certificatesUploader
│
├── _TRASH_REVIEW/                   # Quarantined files pending permanent deletion (not served)
│
├── dashboard.html                   # Admin + Member internal dashboard (SPA-style)
├── Homepage.css                     # Styles for index.html, Robots.html
├── index.html                       # Public homepage
├── login.html                       # Login page
├── login-script.js                  # Login page JS
├── login-style.css                  # Login page styles
├── project-management-extensions.js # Dashboard project modal enhancements
├── project-management-styles.css    # Dashboard project modal styles
├── public-home.js                   # Homepage JS (slideshow, stories, achievements, forms)
├── public-robots.js                 # Robots page JS
├── public-team.js                   # Team page JS (sidebar, animations, robot assistant)
├── public-workshop.js               # Workshop page JS
├── Robots.css                       # Robots page styles
├── Robots.html                      # Robots showcase page
├── script.js                        # Dashboard JS (~7500 lines: all dashboard logic)
├── server.js                        # Express app entry point
├── setup-admin.html                 # One-time admin account setup page
├── setup-admin-script.js            # Setup admin page JS
├── static-server.js                 # Alternative static-only server (not used in production)
├── style.css                        # Dashboard styles (~11,000+ lines)
├── team.css                         # Team page styles
├── Team.html                        # Team members page
├── verify-certificate.html          # Public certificate verification page
├── workshop.css                     # Workshop page styles
├── workshop.html                    # Workshops page
├── .env                             # Environment variables (never commit)
├── .env.example                     # Environment variable template
├── nodemon.json                     # nodemon watch configuration
├── package.json                     # npm scripts and dependencies
└── README.md                        # This file
```

---

## Frontend Pages

### `index.html` + `Homepage.css` + `public-home.js`
**Public homepage.** Hero slideshow, faculty and team testimonials, achievements gallery, robots carousel, workshop stories, about section, timeline, contact/collaboration form, footer. Uses `POST /api/collaboration` for form submissions.

### `Team.html` + `team.css` + `public-team.js`
**Team page.** Shows all current team members by department (Designing, Technical, Fabrication, Management, Media, Maintenance, Alumni), Behind-the-Scenes section. Includes sidebar navigation, animated cards, robot assistant widget.

### `Robots.html` + `Robots.css` + `public-robots.js`
**Robots showcase.** Robot detail cards, competition stories. No backend interaction.

### `workshop.html` + `workshop.css` + `public-workshop.js`
**Workshops page.** Workshop cards, gallery, procedure section. No backend interaction.

### `dashboard.html` + `style.css` + `script.js`
**Internal dashboard (admin + member).** Single-page application handling:
- Overview / analytics charts
- Membership payments, QR payment, receipt upload
- Expense management
- Projects and events
- Reimbursement claims
- Internal transfers
- Certificates management
- Fund management
- Collaboration requests
- Reports and exports
- Member management (admin only)
- Profile editing (member)

Supplemented by:
- `project-management-extensions.js` — project detail modal with team, milestones, expenses
- `project-management-styles.css` — styles for the project modal

### `login.html` + `login-style.css` + `login-script.js`
**Login page.** Email + password + role selector. Calls `POST /auth/login`, stores JWT in localStorage.

### `setup-admin.html` + `setup-admin-script.js`
**One-time admin setup.** Calls `POST /auth/register-admin`. Only works when no users exist in the database.

### `verify-certificate.html`
**Public certificate verification.** Accepts a Certificate ID (TXC-CERT-YYYY-NNNNN), calls `GET /certificates/verify/:id`, displays certificate details without login.

---

## Backend

### `server.js`
Express entry point. Registers all routes, serves static files, handles MongoDB connection with optional in-memory fallback for development. Graceful shutdown on SIGINT/SIGTERM/SIGUSR2.

Mount points:
```
/auth                → auth.routes.js
/members             → member.routes.js
/payments            → payment.routes.js
/expenses            → expense.routes.js
/dashboard           → dashboard.routes.js
/api/collaboration   → collaboration.routes.js
/member-transactions → member-transaction.routes.js
/reimbursements      → reimbursement.routes.js
/projects            → project.routes.js
/events              → event.routes.js
/reports             → reports.routes.js
/certificates        → certificate.routes.js
/funds               → fund.routes.js
/uploads             → express.static (file serving)
```

### `config/db.js`
Calls `mongoose.connect(MONGODB_URI)` with configurable timeouts from environment variables.

### `middleware/auth.js`
- `requireAuth` — verifies Bearer JWT, attaches `req.user`
- `requireRole(...roles)` — checks `req.user.role` against allowed roles
- `blockIfMustChangePassword` — blocks API access if `user.mustChangePassword === true`

---

## API Endpoints

### Authentication — `/auth`
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/register-admin` | Public (first use only) | Create initial admin account |
| POST | `/auth/login` | Public | Login, returns JWT token |
| POST | `/auth/change-password` | Auth required | Change own password |

### Members — `/members`
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/members/add` | Admin | Create member account |
| POST | `/members/deactivate` | Admin | Deactivate member |
| POST | `/members/remove` | Admin | Mark member as removed |
| POST | `/members/reactivate` | Admin | Reactivate member |
| POST | `/members/reset-password` | Admin | Reset member password |
| PUT | `/members/update-my-profile` | Member | Update own profile |
| POST | `/members/upload-profile-pic` | Member | Upload profile photo |
| POST | `/members/upload-certificates` | Member | Upload certificate files |
| POST | `/members/remove-certificate` | Member | Remove a certificate URL |
| POST | `/members/accept-sop` | Member | Record SOP acceptance |

### Payments — `/payments`
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/payments/add` | Auth | Member uploads receipt; Admin adds manual payment |
| POST | `/payments/verify` | Admin | Approve or reject a payment |
| GET | `/payments/receipt/:id/official` | Auth | Download generated PDF receipt |
| GET | `/payments/receipt/:id/proof` | Auth | Download uploaded proof image |

### Expenses — `/expenses`
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/expenses/add` | Admin | Record a club expense |
| PUT | `/expenses/:id` | Admin | Edit an expense |
| DELETE | `/expenses/:id` | Admin | Delete an expense |

### Dashboard — `/dashboard`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/dashboard/data` | Auth | Full dashboard payload (members, payments, expenses, enterprise data, summary) |

### Collaboration — `/api/collaboration`
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/collaboration` | Public | Submit collaboration inquiry |
| GET | `/api/collaboration` | Admin | List all inquiries |
| POST | `/api/collaboration/:id/approve` | Admin | Approve inquiry |
| POST | `/api/collaboration/:id/reject` | Admin | Reject inquiry |
| DELETE | `/api/collaboration/:id` | Admin | Delete inquiry |

### Reimbursements — `/reimbursements`
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/reimbursements/submit` | Auth | Submit reimbursement claim with receipt |
| GET | `/reimbursements/list` | Auth | List claims (member: own; admin: all) |
| GET | `/reimbursements/:id` | Auth | Get single claim |
| POST | `/reimbursements/:id/review` | Admin | Move to under_review |
| POST | `/reimbursements/:id/approve` | Admin | Approve + auto-create linked Expense |
| POST | `/reimbursements/:id/reject` | Admin | Reject with reason |
| DELETE | `/reimbursements/:id` | Admin | Delete claim |
| POST | `/reimbursements/:id/process-reimbursement` | Admin | Mark as paid (reimbursed) |

### Certificates — `/certificates`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/certificates` | Auth | List all certificates |
| POST | `/certificates/upload` | Auth | Upload certificate file + metadata |
| PATCH | `/certificates/:id` | Admin | Edit certificate metadata |
| DELETE | `/certificates/:id` | Admin | Delete certificate + file |
| GET | `/certificates/:id/download` | Auth | Download certificate file |
| GET | `/certificates/verify/:certificateId` | Public | Verify certificate by ID |

### Fund Management — `/funds`
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/funds/add` | Admin | Add fund entry (opening balance, sponsorship, etc.) |
| GET | `/funds` | Admin | List all fund entries |
| PUT | `/funds/:id` | Admin | Edit fund entry |
| DELETE | `/funds/:id` | Admin | Delete fund entry |

### Projects — `/projects`
CRUD for robotics projects with budget tracking and team member assignment.

### Events — `/events`
CRUD for club events and competitions with participant tracking.

### Member Transactions — `/member-transactions`
Internal peer-to-peer transfers between members.

### Reports — `/reports`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/reports/export/:type` | Admin | Download Excel report |

Available types: `members`, `payments`, `reimbursements`, `expense-claims`, `club-expenses`, `projects`, `events`, `fund-entries`, `full`

---

## Database Collections

| Collection | Model | Purpose |
|---|---|---|
| `users` | `User.js` | Members and admins. Stores hashed passwords, role, status, skills, certificates, SOP acceptance |
| `payments` | `Payment.js` | Membership fee installment payments. Tracks receipt uploads and generated PDF receipts. Receipt numbers: TXC-YYYY-NNNNNN |
| `expenses` | `Expense.js` | All club expenditures. Manual entries + auto-created from approved reimbursements |
| `reimbursements` | `Reimbursement.js` | Member purchase claims. Full workflow: submitted → under_review → approved → reimbursed |
| `fundentries` | `FundEntry.js` | Non-fee income: opening balance, sponsorships, donations, contributions |
| `certificates` | `Certificate.js` | Member achievement certificates with metadata. Auto-IDs: TXC-CERT-YYYY-NNNNN |
| `cert_sequences` | (inside Certificate.js) | Per-year auto-increment counters for certificate IDs |
| `collaborations` | `Collaboration.js` | External collaboration requests from the homepage contact form |
| `events` | `Event.js` | Club events with financial tracking, participants, organizer |
| `expenses` | `Expense.js` | (see above) |
| `membertransactions` | `MemberTransaction.js` | Internal money transfers between members |
| `projects` | `Project.js` | Robotics projects with budget, team, milestones |
| `receiptsequences` | `ReceiptSequence.js` | Auto-increment receipt number counters per year |

**Balance Formula** (computed live in `GET /dashboard/data`):
```
balance = SUM(fundentries.amount)
        + SUM(payments.amount WHERE status='approved')
        - SUM(expenses.amount)
```

---

## Upload Storage

All uploads are served at `/uploads/*` via `express.static`.

| Path | Purpose | Size Limit | Accepted Types |
|---|---|---|---|
| `uploads/receipts/` | Member payment proof images | 5 MB | JPG, PNG, WEBP, PDF |
| `uploads/receipts/generated/` | System-generated official receipt PDFs | — | PDF (auto) |
| `uploads/receipts/proofs/` | Member-uploaded proof copies | — | — |
| `uploads/profile/` | Member profile pictures | 2 MB | JPG, PNG, WEBP |
| `uploads/certificates/` | Certificate files | 6 MB | JPG, PNG, WEBP, PDF |

Directories are created automatically at startup by `utils/ensureUploadDirs.js`.

---

## Environment Variables

Copy `.env.example` to `.env` and fill in real values.

| Variable | Required | Description |
|---|---|---|
| `PORT` | Yes | HTTP server port (default: 3000) |
| `NODE_ENV` | Yes | `development` or `production` |
| `MONGODB_URI` | Yes | Full MongoDB connection string (Atlas recommended for production) |
| `USE_IN_MEMORY_DB` | No | `true` to use in-memory MongoDB fallback (dev only) |
| `DB_SERVER_SELECTION_TIMEOUT_MS` | No | Timeout before giving up on DB connection (default: 10000) |
| `DB_CONNECT_TIMEOUT_MS` | No | Connect timeout (default: 10000) |
| `MEMORY_DB_START_TIMEOUT_MS` | No | Timeout for starting in-memory MongoDB (default: 60000) |
| `MEMBER_TOTAL_FEE` | Yes | Total membership fee in INR (default: 13500) |
| `JWT_SECRET` | Yes | Long random string for signing JWT tokens |
| `JWT_EXPIRES_IN` | No | Token expiry (default: 7d) |
| `RECEIPT_UPLOAD_DIR` | No | Path for receipt uploads (default: uploads/receipts) |
| `AUTO_PORT_FALLBACK` | No | Try next port if configured port is busy (dev only) |

---

## Run Instructions

```bash
# Install dependencies
npm install

# Development (auto-restart on file changes)
npm run dev

# Production
npm start
# or
node server.js
```

First run: navigate to `/setup-admin` to create the initial admin account. This endpoint only works when the database has zero users.

---

## Important Files — Do Not Delete

| File | Why |
|---|---|
| `server.js` | Application entry point |
| `config/db.js` | Database connection — removing breaks the entire backend |
| `middleware/auth.js` | All route authentication — removing exposes all APIs |
| `models/*.js` | MongoDB schemas — removing loses data structure definitions |
| `routes/*.js` | All API endpoints |
| `utils/pdfGenerator.js` | Receipt PDF generation — removing breaks payment approval |
| `utils/upload.js` | File upload handlers — removing breaks all file uploads |
| `utils/ensureUploadDirs.js` | Creates upload directories on startup |
| `utils/excelReports.js` | Excel export logic |
| `utils/receiptSequence.js` | Receipt number allocation |
| `.env` | Runtime secrets and connection string — never commit |
| `assets/images/` | All images used by live pages |
| `assets/` | All images, fonts, SOP PDF used by live pages |
| `uploads/` | User-uploaded files — deleting removes real member data |

---

## Maintenance Notes

### For a new developer

1. **Authentication flow**: All dashboard API calls require `Authorization: Bearer <token>` header. The token is stored in `localStorage` after login. The `requireAuth` middleware in `middleware/auth.js` validates it.

2. **Dashboard data flow**: The dashboard makes a single call to `GET /dashboard/data` on load. This returns everything (members, payments, expenses, enterprise data, summary). The frontend stores this in a global `state` object. All rendering functions read from `state`.

3. **Adding a new dashboard section**: Add HTML panel in `dashboard.html` with `data-dashboard-section` and `data-for-roles`, add a sidebar link, add a render function in `script.js`, call it from the `init()` sequence.

4. **Balance calculation**: The club balance is computed as `fundEntries + approvedPayments - expenses`. This is calculated server-side in `routes/dashboard.routes.js` and sent as `summary.balance`. Do not change this without updating both admin and member paths.

5. **Receipt numbers**: Allocated via `utils/receiptSequence.js` using MongoDB atomic `findOneAndUpdate` with `$inc`. There is a unique partial index on `Payment.receiptNumber` to prevent duplicates.

6. **Reimbursement → Expense link**: When admin approves a reimbursement, an `Expense` document is auto-created with `linkedReimbursement` set. This is idempotent — double-approving won't create a duplicate expense.

7. **File uploads**: Three separate Multer instances handle profile pics, receipts, and certificates. Each has separate size limits and accepted MIME types defined in `utils/upload.js`.

8. **In-memory DB fallback**: Set `USE_IN_MEMORY_DB=true` in `.env` to run without installing MongoDB locally. Data is lost on restart. Useful for quick UI testing only.

9. **Port conflicts in dev**: `npm run dev` runs `kill-backend` and `kill-port` first to ensure clean startup.

10. **Modifying the Membership fee structure**: The total fee is set by `MEMBER_TOTAL_FEE` in `.env`. The installment breakdown (₹5000 / ₹5000 / ₹3500) is hardcoded in `utils/membershipInstallments.js`.
