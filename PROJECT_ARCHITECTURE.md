# PROJECT_ARCHITECTURE.md
## Texcelerators Robotics Club — Technical Architecture Reference

This document describes the internal architecture of the project for developers who need to understand how the system is structured, how data flows, and how the major features are connected.

---

## 1. Complete Folder Explanation

```
texcelrators_website/
│
│  ┌─ PUBLIC WEBSITE ─────────────────────────────────────────────────────┐
├── index.html              Homepage — public, no auth required
├── Team.html               Team members page — public
├── Robots.html             Robots showcase — public
├── workshop.html           Workshops page — public
├── verify-certificate.html Certificate verification — public
│  └────────────────────────────────────────────────────────────────────────
│
│  ┌─ AUTH PAGES ──────────────────────────────────────────────────────────┐
├── login.html              Login form (admin + member)
├── setup-admin.html        One-time admin account creation
│  └────────────────────────────────────────────────────────────────────────
│
│  ┌─ INTERNAL DASHBOARD ──────────────────────────────────────────────────┐
├── dashboard.html          SPA-style dashboard (all sections in one file)
│  └────────────────────────────────────────────────────────────────────────
│
│  ┌─ PAGE STYLESHEETS ────────────────────────────────────────────────────┐
├── Homepage.css            index.html + Robots.html styles
├── team.css                Team.html styles
├── Robots.css              Robots.html styles
├── workshop.css            workshop.html styles
├── login-style.css         login.html + setup-admin.html styles
├── style.css               dashboard.html styles (~11,000 lines)
├── project-management-styles.css  Project modal overlay styles
│  └────────────────────────────────────────────────────────────────────────
│
│  ┌─ PAGE JAVASCRIPT ─────────────────────────────────────────────────────┐
├── public-home.js          Homepage: slideshow, stories, testimonials, form
├── public-team.js          Team page: sidebar, animations, robot assistant
├── public-robots.js        Robots page: story cards, showcase
├── public-workshop.js      Workshop page: gallery, lightbox
├── login-script.js         Login page: form submit, JWT storage, redirect
├── setup-admin-script.js   Setup page: register-admin API call
├── script.js               Dashboard: all state, rendering, API calls (~7500 lines)
├── project-management-extensions.js  Project detail modal enhancements
│  └────────────────────────────────────────────────────────────────────────
│
│  ┌─ BACKEND ENTRY ───────────────────────────────────────────────────────┐
├── server.js               Express app + MongoDB connection + route mounting
│  └────────────────────────────────────────────────────────────────────────
│
│  ┌─ BACKEND MODULES ─────────────────────────────────────────────────────┐
├── config/db.js            mongoose.connect() wrapper
├── middleware/auth.js      JWT verification + role guard + password guard
├── models/                 Mongoose schemas (one file per collection)
├── routes/                 Express route handlers (one file per feature)
├── utils/                  Shared helpers (PDF, upload, reports, logger, etc.)
├── scripts/                One-off maintenance scripts (run manually)
│  └────────────────────────────────────────────────────────────────────────
│
│  ┌─ STATIC ASSETS ───────────────────────────────────────────────────────┐
├── assets/                 Images + fonts + SOP PDF (used by public pages)
├── assets/                 Dashboard CSS + images (logo, QR, SOP card CSS)
│  └────────────────────────────────────────────────────────────────────────
│
│  ┌─ RUNTIME STORAGE ─────────────────────────────────────────────────────┐
├── uploads/                User-uploaded files served at /uploads/*
│   ├── receipts/           Payment proof images + generated receipt PDFs
│   ├── profile/            Member profile pictures
│   └── certificates/       Uploaded certificate files
│  └────────────────────────────────────────────────────────────────────────
│
│  ┌─ CONFIGURATION ───────────────────────────────────────────────────────┐
├── .env                    Runtime secrets (never commit)
├── .env.example            Template for .env
├── package.json            npm config + scripts
├── nodemon.json            Dev watcher config
│  └────────────────────────────────────────────────────────────────────────
```

---

## 2. Dependency Overview

### Frontend page dependencies

| Page | CSS | JS | Backend APIs used |
|---|---|---|---|
| `index.html` | `Homepage.css` | `public-home.js` | `POST /api/collaboration` |
| `Team.html` | `team.css` | `public-team.js` | None |
| `Robots.html` | `Robots.css`, `Homepage.css` | `public-robots.js` | None |
| `workshop.html` | `workshop.css`, `Homepage.css` | `public-workshop.js` | None |
| `login.html` | `login-style.css` | `login-script.js` | `POST /auth/login` |
| `setup-admin.html` | `login-style.css` | `setup-admin-script.js` | `POST /auth/register-admin` |
| `dashboard.html` | `style.css`, `project-management-styles.css`, `assets/css/certificates.css`, `assets/css/fund-management.css`, `assets/css/sop-card.css` | `script.js`, `project-management-extensions.js` | All authenticated APIs |
| `verify-certificate.html` | Inline `<style>` | Inline `<script>` | `GET /certificates/verify/:id` |

### Backend module dependencies

```
server.js
  ├── config/db.js                    (mongoose.connect)
  ├── utils/ensureUploadDirs.js       (creates uploads/ dirs)
  ├── utils/syncPaymentIndexes.js     (ensures Payment indexes)
  ├── utils/receiptSequence.js        (syncReceiptCountersFromPayments)
  ├── middleware/auth.js              (used by every protected route)
  ├── models/*.js                     (imported by routes)
  ├── routes/*.js                     (all mounted on express app)
  └── utils/upload.js                 (multer instances for file uploads)

routes/payment.routes.js
  ├── models/Payment.js
  ├── models/User.js
  ├── utils/pdfGenerator.js
  ├── utils/receiptSequence.js
  ├── utils/membershipInstallments.js
  └── utils/upload.js  (receiptUploader)

routes/reimbursement.routes.js
  ├── models/Reimbursement.js
  ├── models/Expense.js              (auto-creates Expense on approval)
  └── utils/upload.js  (receiptUploader)

routes/dashboard.routes.js
  ├── models/User.js
  ├── models/Payment.js
  ├── models/Expense.js
  ├── models/MemberTransaction.js
  ├── models/Reimbursement.js
  ├── models/Project.js
  ├── models/Event.js
  ├── models/Collaboration.js
  ├── models/Certificate.js
  └── models/FundEntry.js

routes/reports.routes.js
  └── utils/excelReports.js
        ├── models/User.js
        ├── models/Payment.js
        ├── models/Expense.js
        ├── models/Reimbursement.js
        ├── models/Project.js
        ├── models/Event.js
        └── models/FundEntry.js
```

---

## 3. Frontend → Backend Data Flow

```
Browser
  │
  ├─ Page load: dashboard.html
  │     └─ script.js: init()
  │           └─ refreshDashboardFromApi()
  │                 └─ GET /dashboard/data  (Bearer JWT)
  │                       └─ dashboard.routes.js
  │                             ├─ Payment.aggregate (paymentsTotal)
  │                             ├─ Expense.aggregate (expensesTotal)
  │                             ├─ FundEntry.aggregate (fundEntriesTotal)
  │                             ├─ Reimbursement.countDocuments (pending/approved)
  │                             └─ loadEnterpriseData()
  │                                   ├─ MemberTransaction.find
  │                                   ├─ Reimbursement.find
  │                                   ├─ Project.find
  │                                   ├─ Event.find
  │                                   └─ Certificate.find
  │
  │  Response → state object in script.js
  │
  ├─ Render cycle (called after every data refresh):
  │     renderFinance()          → KPI cards, balance
  │     renderMembers()          → members table
  │     renderExpenses()         → activity feed
  │     renderMemberExpenses()   → expense table with edit/delete
  │     renderReimbursements()   → reimbursement list
  │     renderProjects()         → project cards
  │     renderEvents()           → event cards
  │     renderCertificates()     → certificate grid
  │     renderFundManagement()   → fund entries + KPIs
  │     renderCollaborations()   → collaboration requests
  │     renderMemberProfile()    → member profile editor
  │     renderVerificationQueue()→ pending payment queue
  │     renderTransactions()     → activity log
  │
  └─ User actions trigger specific API calls, then re-fetch and re-render
```

---

## 4. Authentication Flow

```
1. User visits /login → login.html

2. User enters email + password + role → login-script.js
      POST /auth/login
      Body: { email, password, role }

3. server → auth.routes.js → login handler
      ├─ User.find({ email })
      ├─ user.comparePassword(password)    [bcryptjs]
      ├─ check role matches
      ├─ check status === 'active'
      └─ signAccessToken({ sub: user._id, role, email })  [utils/jwt.js]
            └─ jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })

4. Response: { token, user }
      login-script.js stores:
      └─ localStorage.setItem('authToken', token)
      └─ localStorage.setItem('currentUser', JSON.stringify(user))

5. Redirect to /dashboard

6. Every dashboard API call:
      fetch(url, { headers: { Authorization: 'Bearer <token>' } })

7. middleware/auth.js (requireAuth):
      ├─ Extract token from Authorization header
      ├─ jwt.verify(token, JWT_SECRET)
      ├─ User.findById(payload.sub)
      ├─ Check user.status === 'active'
      └─ Attach req.user → next()

8. requireRole('admin') or requireRole('member'):
      └─ Check req.user.role is in allowed list

9. blockIfMustChangePassword:
      └─ If req.user.mustChangePassword === true → 403

10. Token expiry:
       └─ 401 with code TOKEN_EXPIRED → script.js clears localStorage → redirect /login

┌─ Role-based UI ───────────────────────────────────────┐
│  Admin sees: Members, Expenses, Fund Management,       │
│             Verification, Reports, Collaborations,     │
│             Transfers, Contributors, Admin panel       │
│                                                        │
│  Member sees: Payments, Expense Claims, Announcements, │
│              Profile, Certificates, Projects, Events   │
│  All data-for-roles attributes hide/show sections      │
└───────────────────────────────────────────────────────┘
```

---

## 5. Upload Flow

```
┌─ RECEIPT UPLOAD (member payment) ──────────────────────┐

Member → dashboard.html (payments section)
  └─ Selects image/PDF receipt file
  └─ Clicks "Submit For Verification"
  └─ script.js: submitReceiptForVerification(file)
        POST /payments/add  (multipart/form-data)
        Fields: amount, installmentNumber, notes
        File:   receipt (field name)

routes/payment.routes.js
  └─ upload.single('receipt')  [multer: receiptUploader]
  └─ Validates amount vs installment context
  └─ Payment.create({ status: 'pending', receiptPath: '/uploads/receipts/filename' })

Admin reviews in Verification Queue → POST /payments/verify (approve)
  └─ generateReceiptForApprovedPayment()
        └─ allocateReceiptNumber(year)  [atomic increment in receiptsequences]
        └─ buildPdfBuffer(contentLines)  [utils/pdfGenerator.js]
        └─ fs.writeFileSync(uploads/receipts/generated/TXC-YYYY-NNNNNN.pdf)
        └─ Payment.save({ status: 'approved', receiptNumber, receiptPdfPath })

Member downloads: GET /payments/receipt/:id/official
  └─ Streams PDF from uploads/receipts/generated/

└─────────────────────────────────────────────────────────

┌─ PROFILE PICTURE UPLOAD ───────────────────────────────┐

Member → dashboard profile edit
  └─ Selects image
  └─ POST /members/upload-profile-pic  (multipart)
        └─ profileUploader().single('profilePic')  [2 MB limit, JPG/PNG/WEBP]
        └─ Saves to uploads/profile/
        └─ User.profilePic = '/uploads/profile/filename'

└─────────────────────────────────────────────────────────

┌─ CERTIFICATE UPLOAD ───────────────────────────────────┐

Admin (or Member for own) → certificates section
  └─ POST /certificates/upload  (multipart)
        └─ certificatesUploader().single('certificate')  [6 MB, JPG/PNG/WEBP/PDF]
        └─ Saves to uploads/certificates/
        └─ Certificate.create({ filePath: '/uploads/certificates/filename', ... })

Download: GET /certificates/:id/download
  └─ Streams file from uploads/certificates/

└─────────────────────────────────────────────────────────
```

---

## 6. Certificate Flow

```
CERTIFICATE ID FORMAT: TXC-CERT-YYYY-NNNNN
Example: TXC-CERT-2026-00001

ID Generation (models/Certificate.js):
  ├─ CertSequence collection: { year, sequence }
  ├─ Pre-validate hook: allocateCertNumber(year)
  │     └─ CertSequence.findOneAndUpdate({ year }, { $inc: { sequence: 1 } }, { upsert: true })
  └─ certificateId = `TXC-CERT-${year}-${sequence.padStart(5,'0')}`

Upload path:
  Admin or Member → POST /certificates/upload
    ├─ Admin: must supply memberId
    ├─ Member: uploads for themselves
    └─ File saved to uploads/certificates/

Certificate data stored:
  { certificateId, member, title, issuingOrganization,
    issuedDate, category, adminNotes, filePath,
    fileOriginalName, fileType, uploadedAt, uploadedBy, createdBy }

Categories: competition_win, competition_participation,
            workshop_completion, training, skill_certification,
            appreciation, other

Public verification (no login):
  GET /certificates/verify/:certificateId
    └─ Returns: certificateId, title, memberName, issuingOrganization,
                issuedDate, category, adminNotes

Dashboard display:
  script.js: renderCertificates()
    ├─ Reads from state.enterprise.certificates
    ├─ Shows badge: Manual (pen icon) or Reimbursement (link icon)
    ├─ Admin: inline edit form + delete
    └─ All: download button → GET /certificates/:id/download
```

---

## 7. Payment Flow

```
MEMBERSHIP FEE STRUCTURE (configurable via MEMBER_TOTAL_FEE env var)
Default: ₹13,500 total

Installment breakdown (hardcoded in utils/membershipInstallments.js):
  Installment 1: ₹5,000
  Installment 2: ₹5,000
  Installment 3: ₹3,500

PAYMENT STATES: pending → approved | rejected

Flow 1: Member self-submission
  1. Member scans QR code (UPI)
  2. Member uploads receipt image
  3. POST /payments/add (method: 'receipt', status: 'pending')
  4. Admin sees in Verification Queue
  5. Admin: POST /payments/verify { action: 'approve' }
     → status = 'approved'
     → Receipt number allocated (TXC-YYYY-NNNNNN)
     → PDF generated at uploads/receipts/generated/
  6. Member downloads: GET /payments/receipt/:id/official

Flow 2: Admin manual payment
  1. Admin: POST /payments/add { isManual: true, memberId, amount }
  2. Payment auto-approved
  3. Receipt PDF auto-generated immediately

INSTALLMENT VALIDATION (utils/membershipInstallments.js):
  getActiveInstallmentContext(approvedPaidTotal)
    └─ Returns: activeInstallmentNumber, activeInstallmentRemaining
  validateInstallmentPayment(amount, context, requestedInstallmentNumber)
    └─ Enforces: amount ≤ remaining, correct installment number

RECEIPT NUMBER FORMAT: TXC-YYYY-NNNNNN
  Allocated via utils/receiptSequence.js
  Unique partial index on Payment.receiptNumber prevents duplicates
  Up to 5 retries on collision (race condition safety)

BALANCE IMPACT:
  Approved payment → increases paymentsTotal → increases balance
```

---

## 8. Reimbursement → Expense Link

```
REIMBURSEMENT WORKFLOW:
submitted → under_review → approved → reimbursed
                        ↘ rejected

When admin approves (POST /reimbursements/:id/approve):

  Step 1: Update reimbursement
    reimbursement.status = 'approved'
    reimbursement.approvedAmount = finalAmount
    reimbursement.reviewedBy = admin._id

  Step 2: Auto-create linked Expense (IDEMPOTENT)
    Check: Expense.findOne({ linkedReimbursement: reimbursement._id })
    If not exists → Expense.create({
      title:               '[Reimbursement] ' + itemName,
      amount:              finalAmount,
      category:            mapped from reimbursement.category,
      linkedReimbursement: reimbursement._id,
      isComponentPurchase: true,
      addedBy:             admin._id
    })
    
  This means: approving twice NEVER creates a duplicate expense.

BALANCE IMPACT:
  Approved reimbursement → creates Expense document
  → increases expensesTotal
  → decreases balance

EXPENSE TYPE DISPLAY (dashboard):
  expense.isComponentPurchase === true → "Reimbursement" badge (green)
  Otherwise → "Manual" badge (blue)
```

---

## 9. Fund Management → Balance Integration

```
FUND ENTRY TYPES:
  opening_balance       (unique — only one allowed)
  principal_contribution
  sponsorship
  donation
  other_income

OPENING BALANCE UNIQUENESS:
  Enforced at application layer in fund.routes.js:
  POST /funds/add: if sourceType === 'opening_balance'
    → check existing: FundEntry.findOne({ sourceType: 'opening_balance' })
    → if exists → 409 Conflict

BALANCE FORMULA (dashboard.routes.js, both admin and member paths):
  fundEntriesTotal = FundEntry.aggregate [SUM amount]  (try/catch, fallback 0)
  paymentsTotal    = Payment.aggregate [SUM WHERE approved]
  expensesTotal    = Expense.aggregate [SUM all]

  summary.balance = fundEntriesTotal + paymentsTotal - expensesTotal
  summary.fundEntriesTotal = fundEntriesTotal  (sent separately for UI breakdown)

GRACEFUL DEGRADATION:
  FundEntry query is wrapped in try/catch.
  If FundEntry collection is unavailable → fundEntriesTotal = 0
  → balance degrades to old formula: paymentsTotal - expensesTotal
  → existing behaviour preserved, no crash

AUDIT TRAIL:
  Every FundEntry has: addedBy, lastEditedBy, createdAt, updatedAt
  Edit (PUT /funds/:id) updates lastEditedBy = req.user._id
  Delete is permanent with log entry via logger.js
```

---

## 10. Excel Report Generation Flow

```
GET /reports/export/:type  (admin only)

routes/reports.routes.js
  └─ generateReportBuffer(type)   [utils/excelReports.js]
        └─ buildWorkbook(type)
              ├─ 'members'        → fetchMembersRows()     → User.find
              ├─ 'payments'       → fetchPaymentsRows()    → Payment.find
              ├─ 'reimbursements' → fetchReimbursementsRows() → Reimbursement.find
              ├─ 'expense-claims' → fetchExpenseClaimsRows()  → Reimbursement.find
              ├─ 'club-expenses'  → fetchClubExpensesRows()   → Expense.find
              ├─ 'projects'       → fetchProjectsRows()    → Project.find
              ├─ 'events'         → fetchEventsRows()      → Event.find
              ├─ 'fund-entries'   → fetchFundEntriesRows() → FundEntry.find
              └─ 'full'           → all sheets + fetchSummaryRows()

workbookToBuffer(workbook) → XLSX.write → Buffer
Response: Content-Type: application/vnd.openxmlformats... + download

Frontend (script.js):
  downloadReport(reportType)
    └─ fetch(/reports/export/:type, { method: GET, headers: { Authorization } })
    └─ response.blob() → URL.createObjectURL → anchor.click() → download
```

---

## 11. Key State Management (Frontend)

All dashboard state lives in the `state` object inside `script.js`:

```javascript
state = {
  user:         { id, name, email, role, phone, skills, certificates, ... }
  memberFee:    { totalFee, paidAmount, remainingAmount, activeInstallmentNumber, ... }
  installments: [ { number, amount, status, paid, remaining } × 3 ]
  payments:     [ mapped payment objects ]
  members:      [ { id, name, status, paid, remaining } ]
  users:        [ { id, name, email, role } ]
  expenses:     [ { id, title, amount, category, date } ]
  collaborations: [ ... ]
  enterprise:   {
    memberTransactions: [ ... ]
    reimbursements:     [ ... ]
    projects:           [ ... ]
    events:             [ ... ]
    certificates:       [ ... ]
    contributionStats:  { topContributors, topRequests }
  }
  finance:      { totalIncome, totalExpenses, totalFunds }
  summary:      { paymentsApprovedTotal, expensesTotal, fundEntriesTotal, balance, ... }
  paymentFlow:  { qrScanned, amountToPay }
  profileEditor: { isEditing, draft, saving, clearProfilePic }
  fundEntries:  [ ... ]
}
```

**Refresh cycle:**
1. `refreshDashboardFromApi()` — fetches fresh data, rebuilds state
2. All render functions are called in sequence
3. Each render function reads from `state` and writes to DOM
4. User actions call the relevant API, then call `refreshDashboardFromApi()` again + re-render

---

## 12. Files Never To Delete

| File/Folder | Consequence of deletion |
|---|---|
| `.env` | Server cannot start — no DB connection, no JWT secret |
| `server.js` | Application does not run |
| `config/db.js` | MongoDB connection broken |
| `middleware/auth.js` | All API endpoints become unprotected |
| `models/*.js` | Mongoose loses schema definitions — queries fail |
| `routes/*.js` | All API endpoints disappear |
| `utils/pdfGenerator.js` | Payment approval breaks — cannot generate receipts |
| `utils/upload.js` | All file uploads fail |
| `utils/receiptSequence.js` | Receipt number allocation fails — approval crashes |
| `utils/ensureUploadDirs.js` | Upload directories not created on fresh deploy |
| `utils/excelReports.js` | All report exports fail |
| `utils/membershipInstallments.js` | Installment validation breaks — no payments possible |
| `assets/` | All public page images disappear |
| `assets/images/logo.png` | Dashboard sidebar logo broken |
| `assets/images/payment-qr.png` | QR payment section broken |
| `uploads/` (folder) | All uploaded files become inaccessible |
| `package.json` | npm cannot install or run scripts |
| `Homepage.css` | index.html and Robots.html lose all styling |
| `style.css` | Dashboard loses all styling |
| `script.js` | Dashboard becomes completely non-functional |
