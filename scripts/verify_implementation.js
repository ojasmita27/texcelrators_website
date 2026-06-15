/**
 * verify_implementation.js
 * Run with: node scripts/verify_implementation.js
 * Read-only verification — does NOT modify any file.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

function readFile(relPath) {
    return fs.readFileSync(path.join(ROOT, relPath), 'utf8');
}

function pass(msg) { console.log('  ✓  ' + msg); }
function fail(msg) { console.log('  ✗  PROBLEM: ' + msg); }
function warn(msg) { console.log('  ⚠  WARNING: ' + msg); }
function section(title) { console.log('\n── ' + title + ' ──'); }

let problemCount = 0;
let warnCount = 0;

function check(condition, passMsg, failMsg) {
    if (condition) { pass(passMsg); }
    else { fail(failMsg); problemCount++; }
}

function warnIf(condition, msg) {
    if (condition) { warn(msg); warnCount++; }
}

// ─── Load files ───────────────────────────────────────────────────────────
const html      = readFile('dashboard.html');
const scriptJs  = readFile('script.js');
const excelRep  = readFile('utils/excelReports.js');
const reportsRt = readFile('routes/reports.routes.js');
const fundRt    = readFile('routes/fund.routes.js');
const dashRt    = readFile('routes/dashboard.routes.js');
const payRt     = readFile('routes/payment.routes.js');
const expRt     = readFile('routes/expense.routes.js');
const reimRt    = readFile('routes/reimbursement.routes.js');
const authMw    = readFile('middleware/auth.js');
const dbCfg     = readFile('config/db.js');
const fundCss   = readFile('assets/css/fund-management.css');

// ─── 1. dashboard.html — fund-management-section completeness ─────────────
section('1. fund-management-section completeness');

check(html.includes('id="fund-management-section"'), 'Section tag present', 'Section id missing');
check(html.includes('id="fund-kpi-row"'), 'KPI row present', 'KPI row id missing');
check(html.includes('id="fundKpiBalance"'), 'fundKpiBalance present', 'fundKpiBalance missing');
check(html.includes('id="fundKpiOpening"'), 'fundKpiOpening present', 'fundKpiOpening missing');
check(html.includes('id="fundKpiExternal"'), 'fundKpiExternal present', 'fundKpiExternal missing');
check(html.includes('id="fundKpiCount"'), 'fundKpiCount present', 'fundKpiCount missing');
check(html.includes('id="fundEntryForm"'), 'fundEntryForm present', 'fundEntryForm missing');
check(html.includes('id="fundSourceType"'), 'fundSourceType present', 'fundSourceType missing');
check(html.includes('id="fundAmount"'), 'fundAmount present', 'fundAmount missing');
check(html.includes('id="fundDescription"'), 'fundDescription present', 'fundDescription missing');
check(html.includes('id="fundDate"'), 'fundDate present', 'fundDate missing');
check(html.includes('id="fundSubmitBtn"'), 'fundSubmitBtn present', 'fundSubmitBtn missing');
check(html.includes('id="fundSubmitLabel"'), 'fundSubmitLabel present', 'fundSubmitLabel missing');
check(html.includes('id="fundEditId"'), 'fundEditId present', 'fundEditId missing');
check(html.includes('id="fundCancelEdit"'), 'fundCancelEdit present', 'fundCancelEdit missing');
check(html.includes('id="fundCancelEditWrapper"'), 'fundCancelEditWrapper present', 'fundCancelEditWrapper missing');
check(html.includes('id="fundSearchInput"'), 'fundSearchInput present', 'fundSearchInput missing');
check(html.includes('id="fundFilterType"'), 'fundFilterType present', 'fundFilterType missing');
check(html.includes('id="fund-table-wrapper"'), 'fund-table-wrapper present', 'fund-table-wrapper missing');
check(html.includes('id="fund-table-body"'), 'fund-table-body present', 'fund-table-body missing');
check(html.includes('id="fund-empty-state"'), 'fund-empty-state present', 'fund-empty-state missing');
check(html.includes('id="fund-loading-state"'), 'fund-loading-state present', 'fund-loading-state missing');
check(html.includes('id="fund-pagination"'), 'fund-pagination present', 'fund-pagination missing');
check(html.includes('class="fund-table"'), 'fund-table class present', 'fund-table class missing');
check(html.includes('data-dashboard-section'), 'data-dashboard-section attribute present', 'data-dashboard-section missing');
check(html.includes('data-for-roles="admin"') && html.indexOf('fund-management-section') > 0, 'data-for-roles=admin on section', 'data-for-roles missing');
check(html.includes('opening_balance') && html.includes('principal_contribution') && html.includes('sponsorship') && html.includes('donation') && html.includes('other_income'), 'All 5 source type options present', 'Some source type options missing');

// ─── 2. Existing sections not removed ─────────────────────────────────────
section('2. Existing sections present and complete');

const existingSections = [
    'expenses-section', 'collaborations-section', 'reports-section',
    'admin-overview-section', 'members-section', 'payments',
    'receipt-verification-section', 'member-transactions-section',
    'reimbursement-section', 'projects-section', 'events-section',
    'certificates-section', 'profile-section', 'rules-section',
    'contribution-analytics-section', 'transactions', 'analytics',
    'club-summary-section', 'announcements-section', 'admin'
];

existingSections.forEach(id => {
    check(html.includes('id="' + id + '"'), id + ' present', id + ' MISSING — possible regression!');
});

// ─── 3. Collaborations section completeness ────────────────────────────────
section('3. Collaborations section completeness');

check(html.includes('Collaboration Requests'), 'Collaborations header text present', 'Collaborations header text MISSING');
check(html.includes('id="collaborations-container"'), 'collaborations-container present', 'collaborations-container MISSING');
check(html.includes('id="collaborationTotalKpi"'), 'collaborationTotalKpi present', 'collaborationTotalKpi MISSING');
check(html.includes('id="collaborationPendingKpi"'), 'collaborationPendingKpi present', 'collaborationPendingKpi MISSING');
check(html.includes('id="collaborationApprovedKpi"'), 'collaborationApprovedKpi present', 'collaborationApprovedKpi MISSING');
check(html.includes('id="collaborationRejectedKpi"'), 'collaborationRejectedKpi present', 'collaborationRejectedKpi MISSING');

// ─── 4. Reports section completeness ──────────────────────────────────────
section('4. Reports section completeness');

check(html.includes('id="reports-export-grid"'), 'reports-export-grid present', 'reports-export-grid MISSING');
check(html.includes('data-report-export="members"'), 'Export Members button present', 'Export Members MISSING');
check(html.includes('data-report-export="payments"'), 'Export Payments button present', 'Export Payments MISSING');
check(html.includes('data-report-export="reimbursements"'), 'Export Reimbursements button present', 'Export Reimbursements MISSING');
check(html.includes('data-report-export="expense-claims"'), 'Export Expense Claims button present', 'Export Expense Claims MISSING');
check(html.includes('data-report-export="club-expenses"'), 'Export Club Expenses button present', 'Export Club Expenses MISSING');
check(html.includes('data-report-export="projects"'), 'Export Projects button present', 'Export Projects MISSING');
check(html.includes('data-report-export="events"'), 'Export Events button present', 'Export Events MISSING');
check(html.includes('data-report-export="fund-entries"'), 'Export Fund Entries button present (NEW)', 'Export Fund Entries MISSING');
check(html.includes('data-report-export="full"'), 'Export Full Club Report button present', 'Export Full Club Report MISSING');

// ─── 5. Sidebar navigation ────────────────────────────────────────────────
section('5. Sidebar navigation — all existing links present');

const sidebarTargets = [
    'analytics', 'payments', 'announcements-section', 'transactions',
    'projects-section', 'events-section', 'reimbursement-section',
    'certificates-section', 'rules-section', 'profile-section',
    'member-transactions-section', 'contribution-analytics-section',
    'members-section', 'expenses-section', 'fund-management-section',
    'collaborations-section', 'receipt-verification-section',
    'reports-section', 'admin'
];

sidebarTargets.forEach(target => {
    check(html.includes('data-target="' + target + '"'), 'Sidebar link → ' + target, 'Sidebar link MISSING → ' + target);
});

// ─── 6. Duplicate IDs check ────────────────────────────────────────────────
section('6. Duplicate ID check');

const idRegex = /id="([^"]+)"/g;
const allIds = [];
let match;
while ((match = idRegex.exec(html)) !== null) {
    allIds.push(match[1]);
}

const idCounts = {};
allIds.forEach(id => { idCounts[id] = (idCounts[id] || 0) + 1; });
const dupes = Object.entries(idCounts).filter(([id, count]) => count > 1);

if (dupes.length === 0) {
    pass('No duplicate IDs found (' + allIds.length + ' unique IDs)');
} else {
    dupes.forEach(([id, count]) => {
        fail('Duplicate ID "' + id + '" appears ' + count + ' times');
        problemCount++;
    });
}

// ─── 7. Basic tag balance check ────────────────────────────────────────────
section('7. Basic HTML tag balance');

const openSections  = (html.match(/<section/g)  || []).length;
const closeSections = (html.match(/<\/section>/g) || []).length;
check(openSections === closeSections,
    '<section> tags balanced (' + openSections + ' open, ' + closeSections + ' close)',
    '<section> tags UNBALANCED: ' + openSections + ' open vs ' + closeSections + ' close');

const openForms  = (html.match(/<form/g)  || []).length;
const closeForms = (html.match(/<\/form>/g) || []).length;
check(openForms === closeForms,
    '<form> tags balanced (' + openForms + ' open, ' + closeForms + ' close)',
    '<form> tags UNBALANCED: ' + openForms + ' open vs ' + closeForms + ' close');

const openDivs  = (html.match(/<div/g)  || []).length;
const closeDivs = (html.match(/<\/div>/g) || []).length;
check(openDivs === closeDivs,
    '<div> tags balanced (' + openDivs + ' open, ' + closeDivs + ' close)',
    '<div> tags UNBALANCED: ' + openDivs + ' open vs ' + closeDivs + ' close');

check(html.includes('</html>'), 'Closing </html> tag present', 'Closing </html> tag MISSING');
check(html.includes('</body>'), 'Closing </body> tag present', 'Closing </body> tag MISSING');
check(html.includes('</head>'), 'Closing </head> tag present', 'Closing </head> tag MISSING');

// ─── 8. Frontend script.js checks ─────────────────────────────────────────
section('8. Frontend script.js integrity');

check(scriptJs.includes("'fund-entries': 'texcelerators-fund-entries.xlsx'"), 'fund-entries in REPORT_DOWNLOAD_NAMES', 'fund-entries MISSING from REPORT_DOWNLOAD_NAMES');
check(scriptJs.includes('initFundManagement'), 'initFundManagement function defined', 'initFundManagement MISSING');
check(scriptJs.includes('initFundManagement()'), 'initFundManagement() called in init()', 'initFundManagement() not called');
check(scriptJs.includes('loadFundEntries'), 'loadFundEntries function defined', 'loadFundEntries MISSING');
check(scriptJs.includes('renderAll'), 'renderAll function defined', 'renderAll MISSING');
check(scriptJs.includes('handleFormSubmit'), 'handleFormSubmit function defined', 'handleFormSubmit MISSING');
check(scriptJs.includes('handleDeleteEntry'), 'handleDeleteEntry function defined', 'handleDeleteEntry MISSING');
check(scriptJs.includes('populateFormForEdit'), 'populateFormForEdit function defined', 'populateFormForEdit MISSING');
check(scriptJs.includes('resetFormToAddMode'), 'resetFormToAddMode function defined', 'resetFormToAddMode MISSING');
check(scriptJs.includes('updateKpis'), 'updateKpis function defined', 'updateKpis MISSING');
check(scriptJs.includes('renderTable'), 'renderTable function defined', 'renderTable MISSING');
check(scriptJs.includes('renderPagination'), 'renderPagination function defined', 'renderPagination MISSING');
check(scriptJs.includes('apiFundRequest'), 'apiFundRequest helper defined', 'apiFundRequest MISSING');
check(scriptJs.includes('/funds/add'), 'POST /funds/add call present', 'POST /funds/add MISSING');
check(scriptJs.includes("method: 'DELETE'"), 'DELETE call present', 'DELETE call MISSING');
check(scriptJs.includes("method: 'PUT'"), 'PUT call present', 'PUT call MISSING');

// Verify existing report names still present
check(scriptJs.includes("'texcelerators-members.xlsx'"), 'members report name preserved', 'members report name MISSING');
check(scriptJs.includes("'texcelerators-payments.xlsx'"), 'payments report name preserved', 'payments report name MISSING');
check(scriptJs.includes("'texcelerators-full-club-report.xlsx'"), 'full report name preserved', 'full report name MISSING');

// ─── 9. Backend excelReports.js checks ────────────────────────────────────
section('9. Backend excelReports.js integrity');

check(excelRep.includes("const { FundEntry }"), 'FundEntry model imported', 'FundEntry import MISSING');
check(excelRep.includes('fetchFundEntriesRows'), 'fetchFundEntriesRows defined', 'fetchFundEntriesRows MISSING');
check(excelRep.includes('fetchFinanceSummaryRows'), 'fetchFinanceSummaryRows defined', 'fetchFinanceSummaryRows MISSING');
check(excelRep.includes("fetchSummaryRows"), 'Legacy fetchSummaryRows still present (backwards compat)', 'fetchSummaryRows removed — regression risk');
check(excelRep.includes('Net Available Funds'), 'Net Available Funds in Finance Summary', 'Net Available Funds MISSING');
check(excelRep.includes('Opening Balance'), 'Opening Balance row in Finance Summary', 'Opening Balance MISSING');
check(excelRep.includes('Member Fee Income'), 'Member Fee Income row in Finance Summary', 'Member Fee Income MISSING');
check(excelRep.includes('Principal Contributions'), 'Principal Contributions row in Finance Summary', 'Principal Contributions MISSING');
check(excelRep.includes('Sponsorships'), 'Sponsorships row in Finance Summary', 'Sponsorships MISSING');
check(excelRep.includes('Donations'), 'Donations row in Finance Summary', 'Donations MISSING');
check(excelRep.includes('Other Income'), 'Other Income row in Finance Summary', 'Other Income MISSING');
check(excelRep.includes('Total Income'), 'Total Income row in Finance Summary', 'Total Income MISSING');
check(excelRep.includes('Total Expenses'), 'Total Expenses row in Finance Summary', 'Total Expenses MISSING');
check(excelRep.includes('Total Reimbursements Paid'), 'Total Reimbursements Paid row present', 'Total Reimbursements Paid MISSING');
check(excelRep.includes("type === 'fund-entries'"), 'fund-entries case in buildWorkbook', 'fund-entries case MISSING');
check(excelRep.includes('Finance Summary'), 'Finance Summary sheet in full report', 'Finance Summary sheet MISSING');
check(excelRep.includes('Fund Entries'), 'Fund Entries sheet in full report', 'Fund Entries sheet MISSING');
check(excelRep.includes("'fund-entries': 'texcelerators-fund-entries.xlsx'"), 'fund-entries in REPORT_FILENAMES', 'fund-entries MISSING from REPORT_FILENAMES');

// Verify ALL original report types still in REPORT_FILENAMES
['members', 'payments', 'reimbursements', 'expense-claims', 'club-expenses', 'projects', 'events', 'full'].forEach(t => {
    check(excelRep.includes("'" + t + "'"), t + ' still in REPORT_FILENAMES', t + ' MISSING from REPORT_FILENAMES — regression!');
});

// Verify all original fetch functions untouched
['fetchMembersRows', 'fetchPaymentsRows', 'fetchReimbursementsRows', 'fetchExpenseClaimsRows', 'fetchClubExpensesRows', 'fetchProjectsRows', 'fetchEventsRows'].forEach(fn => {
    check(excelRep.includes(fn), fn + ' still present', fn + ' REMOVED — regression!');
});

// ─── 10. Backend reports.routes.js checks ─────────────────────────────────
section('10. reports.routes.js integrity');

check(reportsRt.includes("'fund-entries'"), 'fund-entries in VALID_TYPES', 'fund-entries MISSING from VALID_TYPES');
['members', 'payments', 'reimbursements', 'expense-claims', 'club-expenses', 'projects', 'events', 'full'].forEach(t => {
    check(reportsRt.includes("'" + t + "'"), t + ' still in VALID_TYPES', t + ' MISSING — regression!');
});

// ─── 11. Unchanged workflow files ─────────────────────────────────────────
section('11. Existing workflow files — zero modifications');

check(payRt.includes('generateReceiptForApprovedPayment'), 'payment.routes: receipt generation intact', 'payment.routes: receipt generation MISSING');
check(payRt.includes("'/verify'"), 'payment.routes: /verify route intact', 'payment.routes: /verify MISSING');
check(payRt.includes('installmentContext'), 'payment.routes: installment logic intact', 'payment.routes: installment logic MISSING');

check(expRt.includes("'/add'"), 'expense.routes: /add route intact', 'expense.routes: /add MISSING');
check(expRt.includes('expenseRoutes'), 'expense.routes: module.exports intact', 'expense.routes: exports MISSING');

check(reimRt.includes("'/approve'"), 'reimbursement.routes: /approve route intact', 'reimbursement.routes: /approve MISSING');
check(reimRt.includes('existingExpense'), 'reimbursement.routes: idempotent expense creation intact', 'reimbursement.routes: idempotent expense MISSING');
check(reimRt.includes("'/submit'"), 'reimbursement.routes: /submit route intact', 'reimbursement.routes: /submit MISSING');

check(authMw.includes('requireAuth'), 'middleware/auth: requireAuth intact', 'middleware/auth: requireAuth MISSING');
check(authMw.includes('requireRole'), 'middleware/auth: requireRole intact', 'middleware/auth: requireRole MISSING');
check(authMw.includes('blockIfMustChangePassword'), 'middleware/auth: blockIfMustChangePassword intact', 'middleware/auth: blockIfMustChangePassword MISSING');

check(dbCfg.includes('connectMongo'), 'config/db: connectMongo intact', 'config/db: connectMongo MISSING');
check(dbCfg.includes('mongoose.connect'), 'config/db: mongoose.connect intact', 'config/db: mongoose.connect MISSING');

// ─── 12. Dashboard balance formula not changed ─────────────────────────────
section('12. Dashboard balance formula unchanged');

check(dashRt.includes('fundEntriesTotal + paymentsTotal - expensesTotal'), 'Balance formula intact in dashboard.routes', 'Balance formula CHANGED — critical regression!');
check(dashRt.includes('balance: fundEntriesTotal + paymentsTotal - expensesTotal'), 'balance field in summary intact', 'balance field MISSING from summary');

// ─── 13. CSS file checks ───────────────────────────────────────────────────
section('13. fund-management.css integrity');

check(html.includes('assets/css/fund-management.css'), 'CSS file linked in dashboard.html', 'CSS file NOT linked');
check(fs.existsSync(path.join(ROOT, 'assets/css/fund-management.css')), 'fund-management.css file exists on disk', 'fund-management.css file MISSING from disk');
check(fundCss.includes('.fund-badge'), '.fund-badge class present', '.fund-badge MISSING');
check(fundCss.includes('.fund-table'), '.fund-table class present', '.fund-table MISSING');
check(fundCss.includes('.fund-pagination'), '.fund-pagination class present', '.fund-pagination MISSING');
check(fundCss.includes('max-width: 720px'), 'Responsive breakpoint present', 'Responsive breakpoint MISSING');
check(fundCss.includes('.fund-badge-opening') && fundCss.includes('.fund-badge-sponsorship'), 'Source type badge styles present', 'Source type badge styles MISSING');

// ─── Collaborations section structure deep check ───────────────────────────
section('14. Collaborations section — structural deep check');

// Check the order: fund-management-section must come BEFORE collaborations-section
const fundIdx  = html.indexOf('id="fund-management-section"');
const collabIdx = html.indexOf('id="collaborations-section"');
check(fundIdx > 0 && collabIdx > 0 && fundIdx < collabIdx, 'fund-management-section appears before collaborations-section', 'Section ordering problem');

// Check collaborations section has its panel-header restored
check(html.includes('<h3><i class="fas fa-handshake"></i> Collaboration Requests</h3>'), 'Collaborations panel header fully intact', 'Collaborations panel header MISSING or damaged');
check(html.includes('id="collaboration-summary-grid"'), 'collaboration-summary-grid present', 'collaboration-summary-grid MISSING');

// ─── FINAL SUMMARY ────────────────────────────────────────────────────────
console.log('\n════════════════════════════════════════');
console.log('VERIFICATION COMPLETE');
console.log('Problems: ' + problemCount);
console.log('Warnings: ' + warnCount);
if (problemCount === 0) {
    console.log('STATUS: ALL CHECKS PASSED');
} else {
    console.log('STATUS: ' + problemCount + ' PROBLEM(S) FOUND — review above');
}
console.log('════════════════════════════════════════');
